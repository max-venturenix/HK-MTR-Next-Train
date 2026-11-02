export interface FacilityOutage {
    id: string;
    stationCode: string;
    facilityId: string;
    facilityType: string;
    name: string;
    location: string;
    message: string;
    alternative: string;
    remarks: string;
    phone?: string;
    updatedAt?: string;
}

export interface FacilityOutageFeed {
    updatedAt?: string;
    notices: FacilityOutage[];
}
