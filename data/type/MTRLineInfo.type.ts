export interface MTRLineData {
    [key: string]: string;
}

export interface MTRLineInfo {
    [key: string]: MTRLineItem;
}

export interface MTRLineItem {
    chineseName: string;
    englishName: string;
    colorCode: string;
    stations: string[];
}