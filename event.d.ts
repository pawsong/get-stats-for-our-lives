export interface MarchForOurLivesEvent {
    attendee_count: number;
    latitude: number;
    longitude: number;
    id: number;
    is_full: boolean;
    is_open_for_signup: boolean;
    is_in_past: boolean;
    time_at_iso: string;
    day: number;
    hour: number;
    minute: number;
    city_etc_no_postal: string;
    address1: string;
    address2: string;
    city: string;
    zip: string;
    title: string;
    city_etc: string;
    venue: string;
    state: string;
}
