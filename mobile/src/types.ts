export type Company = {
  id: string;
  name: string;
  is_other?: boolean | null;
};

export type Airport = {
  id: string;
  iata_code: string;
  name: string;
  city: string;
  state: string;
};

export type Station = {
  id: string;
  airport_id: string;
  name: string;
  description?: string | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  custom_company_name: string | null;
  airport_id: string | null;
  station_id: string | null;
  role: string;
  email_verified_at: string | null;
  blocked_at: string | null;
  disabled_at: string | null;
  companies?: { name: string } | null;
  airports?: { iata_code: string; name: string; city: string; state: string } | null;
  stations?: { name: string } | null;
};

export type ShiftPost = {
  id: string;
  user_id: string | null;
  station_id?: string;
  airport_id?: string;
  company_id?: string | null;
  poster_name_snapshot: string | null;
  category: string;
  shift_date: string;
  day_of_week: string;
  shift_start: string;
  shift_end: string;
  location_team: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export type ShiftRequest = {
  id: string;
  requester_id: string;
  request_type: string;
  proposed_shift_date: string | null;
  proposed_start_time: string | null;
  proposed_end_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
  shift_post_id: string | null;
};
