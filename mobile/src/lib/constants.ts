export const SHIFT_CATEGORIES = [
  { value: "pick_up", label: "Pick Up" },
  { value: "give_away", label: "Give Away" },
  { value: "day_trade", label: "Day Trade" },
  { value: "looking_for_double", label: "Find Double" },
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

export type ShiftCategory = (typeof SHIFT_CATEGORIES)[number]["value"];
