export interface MTRRealTimeData {
    status: 0 | 1;
    message: string;
    sys_time?: string;
    curr_time?: string;
    data?: {[lineSta: string]: LineStaData};
    isdelay?: string;
    url?: string;
}

export interface LineStaData {
    curr_time?: string;
    sys_time?: string;
    UP?: TrainArrivalData[];
    DOWN?: TrainArrivalData[];
}

export interface TrainArrivalData {
    seq: string;
    dest: string;
    plat: string;
    time: string;
    ttnt?: string;
    valid?: string;
    source?: string;
    timetype?: string;
    route?: string;
}
