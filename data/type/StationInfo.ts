export interface StationInfo {
    [code: string]: StationItemInfo
}

export interface StationItemInfo {
    code: string;
    line: string[];
    englishName: string;
    chineseName: string;
}