export interface StationData {
    [code: string]: StationDataItem
}

export interface StationDataItem {
    code: string;
    line: string[];
    englishName: string;
    chineseName: string;
}