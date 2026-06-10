export const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "msn.com",
  "me.com",
] as const;

export const OWNER_EMAIL_ALLOWLIST = ["tradevya@gmail.com"] as const;

export const SHIFT_CATEGORIES = [
  { value: "pick_up", label: "Pick Up", description: "Someone wants another person to take their shift." },
  { value: "give_away", label: "Give Away", description: "Someone is giving away a shift." },
  { value: "day_trade", label: "Day Trade", description: "Someone wants to swap shifts." },
  { value: "looking_for_double", label: "Find Double", description: "Someone wants to work 2 shifts in one day." },
] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const SHIFT_STATUSES = ["open", "pending", "approved", "declined", "closed"] as const;

export const REQUEST_STATUSES = ["pending", "approved", "declined", "withdrawn"] as const;

export const ROLE_LABELS: Record<string, string> = {
  regular_user: "Regular user",
  station_admin: "Station admin",
  airport_admin: "Airport admin",
};

export const COMPANY_SEED_NAMES = [
  "Delta Air Lines",
  "United Airlines",
  "American Airlines",
  "Southwest Airlines",
  "JetBlue",
  "Spirit Airlines",
  "Frontier Airlines",
  "Alaska Airlines",
  "Hawaiian Airlines",
  "Allegiant Air",
  "Sun Country Airlines",
  "Breeze Airways",
  "Avelo Airlines",
  "Air Canada",
  "British Airways",
  "Lufthansa",
  "Air France",
  "KLM",
  "Emirates",
  "Qatar Airways",
  "Etihad Airways",
  "Turkish Airlines",
  "Singapore Airlines",
  "Cathay Pacific",
  "Japan Airlines",
  "ANA",
  "Korean Air",
  "Virgin Atlantic",
  "Aer Lingus",
  "Iberia",
  "Swiss",
  "TAP Air Portugal",
  "Avianca",
  "Copa Airlines",
  "LATAM",
  "Aeromexico",
  "FedEx Express",
  "UPS Airlines",
  "DHL Aviation",
  "Amazon Air",
  "Atlas Air",
  "Kalitta Air",
  "Amerijet",
  "Swissport",
  "Worldwide Flight Services",
  "Menzies Aviation",
  "Unifi Aviation",
  "GAT Airline Ground Support",
  "PrimeFlight Aviation Services",
  "Prospect Airport Services",
  "Dnata",
  "ABM Aviation",
  "Alliance Ground International",
  "Trego-Dugan Aviation",
  "McGee Air Services",
  "TSA",
  "Port Authority / Airport Authority",
  "Airport Operations",
  "Airport Security",
  "Airport Maintenance",
  "Other",
] as const;

export type ShiftCategory = (typeof SHIFT_CATEGORIES)[number]["value"];
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
export type ShiftStatus = (typeof SHIFT_STATUSES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
