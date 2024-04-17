interface MTRLineData {
    [key: string]: string;
}

interface MTRLineInfo {
    [key: string]: MTRLineItem;
}

interface MTRLineItem {
    chineseName: string;
    englishName: string;
    colorCode: string;
}