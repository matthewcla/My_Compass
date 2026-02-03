import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EventType =
  | 'advancement_exam'
  | 'administrative_board'
  | 'statutory_board'
  | 'career_event';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO 8601
  type: EventType;
  location: string;
  description: string;
  isMandatory?: boolean;
}

export interface Attendance {
  eventId: string;
  timestamp: string;
  synced: boolean;
}

interface CalendarState {
  events: CalendarEvent[];
  attendance: Attendance[];

  // Actions
  getEvents: () => CalendarEvent[];
  logAttendance: (eventId: string) => void;
  isAttended: (eventId: string) => boolean;
}

// Mock Data
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'evt_adv_001',
    title: 'Navy Wide Advancement Exam (E-4)',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(), // 5 days from now
    type: 'advancement_exam',
    location: 'Base Theater / Designated Classroom',
    description: 'Cycle 263 Navy-Wide Advancement Examination (NWAE) for E-4 candidates. Uniform of the day required. Bring ID and bibliography references.',
    isMandatory: true,
  },
  {
    id: 'evt_board_001',
    title: 'FY-25 Chief Petty Officer Selection Board',
    date: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
    type: 'statutory_board',
    location: 'NPC Millington, TN',
    description: 'Active Duty and TAR Chief Petty Officer Selection Board convenes.',
  },
  {
    id: 'evt_car_001',
    title: 'Career Development Symposium',
    date: new Date().toISOString(), // Today!
    type: 'career_event',
    location: 'Convention Center, Hall B',
    description: 'Annual symposium featuring detailers, community managers, and leadership briefs. QR Code check-in required at entrance.',
  },
  {
    id: 'evt_admin_001',
    title: 'Administrative Separation Board Training',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 days ago
    type: 'administrative_board',
    location: 'Legal Office, Bldg 404',
    description: 'Training for board members on new separation policies.',
  },
  {
    id: 'evt_adv_002',
    title: 'Navy Wide Advancement Exam (E-5)',
    date: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
    type: 'advancement_exam',
    location: 'Base Theater',
    description: 'Cycle 263 NWAE for E-5 candidates.',
    isMandatory: true,
  },
];

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: MOCK_EVENTS,
      attendance: [],

      getEvents: () => {
        // Return events sorted by date
        return [...get().events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },

      logAttendance: (eventId: string) => {
        const { attendance } = get();
        // Check if already attended
        if (attendance.some(a => a.eventId === eventId)) return;

        set({
          attendance: [
            ...attendance,
            {
              eventId,
              timestamp: new Date().toISOString(),
              synced: false, // In a real app, we'd try to sync immediately
            },
          ],
        });
      },

      isAttended: (eventId: string) => {
        return get().attendance.some(a => a.eventId === eventId);
      },
    }),
    {
      name: 'calendar-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
