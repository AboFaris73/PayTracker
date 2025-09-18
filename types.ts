
export enum RateType {
    Hourly = 'hourly',
    Fixed = 'fixed',
}

export enum WorkStatus {
    Pending = 'pending',
    PartiallyPaid = 'partially_paid',
    Paid = 'paid',
}

export interface Employer {
    id: string;
    name: string;
    contact?: string;
}

export interface WorkEntry {
    id: string;
    employerId: string;
    description: string;
    date: string; // ISO string format
    rate: number;
    rateType: RateType;
    hours?: number;
    status: WorkStatus;
}

export interface Payment {
    id: string;
    workEntryId: string;
    amount: number;
    date: string; // ISO string format
}
