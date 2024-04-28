export interface MTRStationInfo {
    [code: string]: MTRStationItem
}

export interface MTRStationItem {
    code: string;
    line: string[];
    englishName: string;
    chineseName: string;
}