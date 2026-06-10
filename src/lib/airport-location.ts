import type { Airport } from "@/lib/demo-data";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type NearestAirport = {
  airport: Airport;
  distanceMiles: number;
};

const EARTH_RADIUS_MILES = 3958.8;

const AIRPORT_COORDINATES: Record<string, Coordinates> = {
  ATL: { latitude: 33.6407, longitude: -84.4277 },
  BOS: { latitude: 42.3656, longitude: -71.0096 },
  CLT: { latitude: 35.2144, longitude: -80.9473 },
  DCA: { latitude: 38.8512, longitude: -77.0402 },
  DEN: { latitude: 39.8561, longitude: -104.6737 },
  DFW: { latitude: 32.8998, longitude: -97.0403 },
  DTW: { latitude: 42.2162, longitude: -83.3554 },
  EWR: { latitude: 40.6895, longitude: -74.1745 },
  IAH: { latitude: 29.9902, longitude: -95.3368 },
  JFK: { latitude: 40.6413, longitude: -73.7781 },
  LAS: { latitude: 36.084, longitude: -115.1537 },
  LAX: { latitude: 33.9416, longitude: -118.4085 },
  MCO: { latitude: 28.4312, longitude: -81.3081 },
  MIA: { latitude: 25.7959, longitude: -80.287 },
  MSP: { latitude: 44.8848, longitude: -93.2223 },
  ORD: { latitude: 41.9742, longitude: -87.9073 },
  PHL: { latitude: 39.8744, longitude: -75.2424 },
  PHX: { latitude: 33.4352, longitude: -112.0101 },
  SEA: { latitude: 47.4502, longitude: -122.3088 },
  SFO: { latitude: 37.6213, longitude: -122.379 },
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceInMiles(from: Coordinates, to: Coordinates) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

export function findNearestAirport(airports: Airport[], currentLocation: Coordinates): NearestAirport | null {
  return airports.reduce<NearestAirport | null>((nearest, airport) => {
    const airportLocation =
      typeof airport.latitude === "number" && typeof airport.longitude === "number"
        ? { latitude: airport.latitude, longitude: airport.longitude }
        : AIRPORT_COORDINATES[airport.iata_code.toUpperCase()];

    if (!airportLocation) return nearest;

    const distanceMiles = distanceInMiles(currentLocation, airportLocation);

    if (!nearest || distanceMiles < nearest.distanceMiles) {
      return { airport, distanceMiles };
    }

    return nearest;
  }, null);
}
