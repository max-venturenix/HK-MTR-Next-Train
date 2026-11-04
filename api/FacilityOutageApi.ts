import axios from "axios";
import {XMLParser, XMLValidator} from "fast-xml-parser";
import {FacilityOutage, FacilityOutageFeed} from "../data/type/FacilityOutage";

export const facilityInformationUrl = "https://www.mtr.com.hk/ch/customer/services/free_search.php";
const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.replace(/&#(x[\da-f]+|\d+);/gi, (entity, code: string) => {
        const point = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
        return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : entity;
    }).trim();
}

export function parseFacilityTimestamp(value: unknown): string | undefined {
    const match = text(value).match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!match) return undefined;
    const [, day, month, year, hour, minute, second] = match;
    const stamp = `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`;
    const time = Date.parse(stamp);
    if (!Number.isFinite(time)) return undefined;
    const local = new Date(time + 8 * 3600000).toISOString().slice(0, 19);
    return local === stamp.slice(0, 19) ? new Date(time).toISOString() : undefined;
}

export function parseFacilityOutageFeed(xml: string): FacilityOutageFeed {
    if (XMLValidator.validate(xml) !== true || /<!DOCTYPE/i.test(xml)) throw new Error("Invalid facility XML");
    const parsed: unknown = new XMLParser({ignoreAttributes: false, parseTagValue: false,
        parseAttributeValue: false, isArray: tag => tag === "outagemessage"}).parse(xml);
    if (!record(parsed) || !Object.hasOwn(parsed, "outagemessages") ||
        (parsed.outagemessages !== "" && !record(parsed.outagemessages))) throw new Error("Missing outage feed");
    const root = record(parsed.outagemessages) ? parsed.outagemessages : {};
    const rows: unknown = root.outagemessage ?? [];
    if (!Array.isArray(rows)) throw new Error("Invalid outage list");
    const notices = rows.map((row: unknown): FacilityOutage => {
        if (!record(row)) throw new Error("Invalid outage notice");
        const bilingual = (field: string) => text(row[`${field}_tc`]) || text(row[field]);
        const id = text(row["@_id"]), stationCode = text(row.stationcode);
        if (!id || !stationCode || !bilingual("facilityname") || !bilingual("message")) throw new Error("Incomplete outage notice");
        const phone = text(row.phonenumber).replace(/\s/g, "");
        return {id, stationCode, facilityId: text(row.facilityid), facilityType: text(row.facilitytype),
            name: bilingual("facilityname"), location: bilingual("location"), message: bilingual("message"),
            alternative: bilingual("alternative"), remarks: bilingual("remarks"),
            phone: /^(?:\+?852)?\d{8}$/.test(phone) ? phone : undefined,
            updatedAt: parseFacilityTimestamp(row["@_lastupdate"])};
    });
    return {updatedAt: parseFacilityTimestamp(root["@_lastupdate"]), notices};
}

export class InvalidFacilityFeedError extends Error {}

export async function getFacilityOutages(signal?: AbortSignal): Promise<FacilityOutageFeed> {
    const response = await axios.get<string>("https://tnews.mtr.com.hk/facility/outage.xml", {
        responseType: "text", transformResponse: [data => data], timeout: 10000, signal
    });
    try { return parseFacilityOutageFeed(response.data); }
    catch { throw new InvalidFacilityFeedError("Invalid facility XML"); }
}
