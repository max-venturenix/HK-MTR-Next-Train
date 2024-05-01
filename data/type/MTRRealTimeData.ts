export interface MTRRealTimeData {
    status: number;
    message: string;
    sys_time: string;
    curr_time: string;
    data: Data;
    isdelay: string;
}

export interface Data {
    [lineSta: string]: LineStaData;
}

export interface LineStaData {
    curr_time: string;
    sys_time: string;
    UP?: TrainArrivalData[];
    DOWN?: TrainArrivalData[];
}

export interface TrainArrivalData {
    seq: string;
    dest: string;
    plat: string;
    time: string;
    ttnt: string;
    valid: string;
    source: string;
}
