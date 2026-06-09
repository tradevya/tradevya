"use client";

import { useActionState, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin } from "lucide-react";
import { loginAction, resendVerificationAction, signUpAction, type ActionState } from "@/app/actions/auth";
import { completeLocationAction, requestLocationChangeAction } from "@/app/actions/profile";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { findNearestAirport } from "@/lib/airport-location";
import type { Airport, Company, Station } from "@/lib/demo-data";

const initialState: ActionState = { ok: false, message: "" };

function DirectoryFields({
  companies,
  airports,
  stations,
  includeReason,
}: {
  companies: Company[];
  airports: Airport[];
  stations: Station[];
  includeReason?: boolean;
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [airportId, setAirportId] = useState(airports[0]?.id ?? "");
  const [stationId, setStationId] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const airportSelectId = useId();
  const selectedCompany = companies.find((company) => company.id === companyId);
  const filteredStations = useMemo(
    () => stations.filter((station) => station.airport_id === airportId),
    [airportId, stations],
  );

  useEffect(() => {
    setStationId((currentStationId) => {
      if (filteredStations.some((station) => station.id === currentStationId)) {
        return currentStationId;
      }

      return filteredStations[0]?.id ?? "";
    });
  }, [filteredStations]);

  function handleUseClosestAirport() {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not available in this browser. Choose your airport manually.");
      return;
    }

    setIsLocating(true);
    setLocationMessage("Reading your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestAirport(airports, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setIsLocating(false);

        if (!nearest) {
          setLocationMessage("No matching airport coordinates are available yet. Choose your airport manually.");
          return;
        }

        setAirportId(nearest.airport.id);
        const roundedDistance = Math.max(1, Math.round(nearest.distanceMiles));
        setLocationMessage(
          `Selected ${nearest.airport.iata_code}, about ${roundedDistance} ${roundedDistance === 1 ? "mile" : "miles"} away.`,
        );
      },
      (error) => {
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage("Location permission was blocked. Choose your airport manually.");
          return;
        }

        if (error.code === error.TIMEOUT) {
          setLocationMessage("Location timed out. Try again or choose your airport manually.");
          return;
        }

        setLocationMessage("Could not read your location. Choose your airport manually.");
      },
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 },
    );
  }

  return (
    <>
      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Company / employer
        <select
          className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
          name="company_id"
          onChange={(event) => setCompanyId(event.target.value)}
          required
          value={companyId}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>

      {selectedCompany?.is_other || selectedCompany?.name === "Other" ? (
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Company name
          <input
            className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600"
            name="custom_company_name"
            placeholder="Enter your employer"
            required
          />
        </label>
      ) : null}

      <div className="grid gap-2 text-sm font-semibold text-zinc-800">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={airportSelectId}>Airport</label>
          <button
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-teal-800 hover:border-teal-300 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLocating || airports.length === 0}
            onClick={handleUseClosestAirport}
            type="button"
          >
            {isLocating ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <MapPin aria-hidden className="size-4" />}
            Use my location
          </button>
        </span>
        <select
          className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
          id={airportSelectId}
          name="airport_id"
          onChange={(event) => {
            setAirportId(event.target.value);
            setLocationMessage("");
          }}
          required
          value={airportId}
        >
          {airports.map((airport) => (
            <option key={airport.id} value={airport.id}>
              {airport.iata_code} - {airport.city}, {airport.state}
            </option>
          ))}
        </select>
        {locationMessage ? (
          <span aria-live="polite" className="text-xs font-medium text-zinc-600">
            {locationMessage}
          </span>
        ) : null}
      </div>

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Station / department
        <select
          className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
          disabled={filteredStations.length === 0}
          name="station_id"
          onChange={(event) => setStationId(event.target.value)}
          required
          value={stationId}
        >
          {filteredStations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))}
        </select>
      </label>

      {includeReason ? (
        <label className="grid gap-2 text-sm font-semibold text-zinc-800 md:col-span-2">
          Reason
          <textarea
            className="min-h-28 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            name="reason"
            placeholder="Briefly explain the station, airport, or employer change."
            required
          />
        </label>
      ) : null}
    </>
  );
}

export function SignupForm({
  companies,
  airports,
  stations,
}: {
  companies: Company[];
  airports: Airport[];
  stations: Station[];
}) {
  const [state, action] = useActionState(signUpAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Full name
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="full_name" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-800">
          Work email
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="email" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-zinc-800 md:col-span-2">
          Password
          <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" minLength={8} name="password" required type="password" />
        </label>
        <DirectoryFields airports={airports} companies={companies} stations={stations} />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Creating account...">Create account</SubmitButton>
      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link className="font-semibold text-teal-700" href="/login">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Work email
        <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="email" required type="email" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Password
        <input className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600" name="password" required type="password" />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Logging in...">Log in</SubmitButton>
      <p className="text-center text-sm text-zinc-600">
        New to Tradevya?{" "}
        <Link className="font-semibold text-teal-700" href="/signup">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function ResendVerificationForm({ email }: { email?: string }) {
  const [state, action] = useActionState(resendVerificationAction, initialState);

  return (
    <form action={action} className="mt-5 grid gap-3">
      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Work email
        <input
          className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-600"
          defaultValue={email}
          name="email"
          required
          type="email"
        />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending...">Resend verification email</SubmitButton>
    </form>
  );
}

export function SelectLocationForm({
  companies,
  airports,
  stations,
}: {
  companies: Company[];
  airports: Airport[];
  stations: Station[];
}) {
  const [state, action] = useActionState(completeLocationAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <DirectoryFields airports={airports} companies={companies} stations={stations} />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving...">Save location</SubmitButton>
    </form>
  );
}

export function LocationChangeForm({
  companies,
  airports,
  stations,
}: {
  companies: Company[];
  airports: Airport[];
  stations: Station[];
}) {
  const [state, action] = useActionState(requestLocationChangeAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <DirectoryFields airports={airports} companies={companies} includeReason stations={stations} />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Submitting...">Submit request</SubmitButton>
    </form>
  );
}
