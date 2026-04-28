export type EventPriority = 'CRITICAL' | 'HIGH' | 'STANDARD';

export type CareerEventType =
    | 'ADVANCEMENT_EXAM'
    | 'STATUTORY_BOARD'
    | 'ADMIN_BOARD'
    | 'ATTENDANCE_MUSTER';

export type AttendanceStatus = 'PENDING' | 'PRESENT' | 'ABSENT' | 'EXCUSED';

export interface CareerEvent {
    eventId: string;
    eventType: CareerEventType;
    title: string;
    date: string; // ISO 8601
    location: string;
    attendanceStatus: AttendanceStatus;
    priority: EventPriority;
    /**
     * Required for Attendance events to facilitate QR code scanning
     */
    qr_token?: string;
}
