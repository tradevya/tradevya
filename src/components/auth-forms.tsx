"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { loginAction, resendVerificationAction, signUpAction, type ActionState } from "@/app/actions/auth";
import { completeLocationAction, requestLocationChangeAction } from "@/app/actions/profile";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
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
  const selectedCompany = companies.find((company) => company.id === companyId);
  const filteredStations = useMemo(
    () => stations.filter((station) => station.airport_id === airportId),
    [airportId, stations],
  );

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

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Airport
        <select
          className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
          name="airport_id"
          onChange={(event) => setAirportId(event.target.value)}
          required
          value={airportId}
        >
          {airports.map((airport) => (
            <option key={airport.id} value={airport.id}>
              {airport.iata_code} - {airport.city}, {airport.state}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-semibold text-zinc-800">
        Station / department
        <select
          className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
          name="station_id"
          required
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
