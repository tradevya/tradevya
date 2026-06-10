import { COMPANY_SEED_NAMES } from "@/lib/constants";

export type Company = {
  id: string;
  name: string;
  is_other?: boolean;
};

export type Airport = {
  id: string;
  iata_code: string;
  name: string;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type Station = {
  id: string;
  airport_id: string;
  name: string;
  description?: string | null;
};

export const demoCompanies: Company[] = COMPANY_SEED_NAMES.map((name) => ({
  id: `demo-company-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  name,
  is_other: name === "Other",
}));

export const demoAirports: Airport[] = [
  { id: "demo-airport-atl", iata_code: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", state: "GA", latitude: 33.6407, longitude: -84.4277 },
  { id: "demo-airport-lax", iata_code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", state: "CA", latitude: 33.9416, longitude: -118.4085 },
  { id: "demo-airport-ord", iata_code: "ORD", name: "O'Hare International Airport", city: "Chicago", state: "IL", latitude: 41.9742, longitude: -87.9073 },
  { id: "demo-airport-dfw", iata_code: "DFW", name: "Dallas Fort Worth International Airport", city: "Dallas-Fort Worth", state: "TX", latitude: 32.8998, longitude: -97.0403 },
  { id: "demo-airport-jfk", iata_code: "JFK", name: "John F. Kennedy International Airport", city: "New York", state: "NY", latitude: 40.6413, longitude: -73.7781 },
];

const stationNames = ["Ramp", "Gate", "Customer Service", "Baggage", "Operations", "Maintenance", "Security"];

export const demoStations: Station[] = demoAirports.flatMap((airport) =>
  stationNames.map((name) => ({
    id: `demo-station-${airport.iata_code.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    airport_id: airport.id,
    name,
    description: `${airport.iata_code} ${name}`,
  })),
);
