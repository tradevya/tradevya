# Tradevya Project Rules

## Project Identity

- Project name: Tradevya
- Client name: Tradevya
- GitHub repository: https://github.com/tradevya/tradevya.git
- Default branch: main
- Vercel project: tradevya
- Live production domain: https://tradevya.com
- Vercel fallback URL: https://tradevya.vercel.app
- Vercel local project id: prj_I5fKqTADRjn1m9QnpfLNMRy9r8rN
- Vercel org/team id: team_eAMd6VqO2wP6WnWZiugazP05
- Supabase project ref: lxcsnnkancszllrafzaj
- Supabase URL: https://lxcsnnkancszllrafzaj.supabase.co
- Package name: tradevya

## Project Isolation Rules

- Treat this as a completely separate client project.
- Do not copy code, environment files, database migrations, deployment settings, branding, data, or credentials from other client projects.
- Do not rename or repoint the GitHub remote, Vercel project, or Supabase project without explicit approval.
- If any reference to another client, account, product, URL, repository, deployment, database, or organization appears, stop and report it before continuing.
- The current Vercel account/team label is `bodyshop-s-projects`; treat that as an account-level reference only, and verify with the user before making account-level Vercel changes.

## Deployment Rules

- Do not push until the GitHub remote has been verified as `https://github.com/tradevya/tradevya.git`.
- Do not deploy until the Vercel project has been verified as `tradevya`.
- Before deployment, run the relevant checks for the change, normally `npm run typecheck`, `npm run lint`, and `npm run build`.
- Production deploys should target the verified Vercel project and use `https://tradevya.com` as the canonical live domain.
- Keep `https://tradevya.vercel.app` as the Vercel fallback URL unless the user approves removing or changing it.
- Do not delete deployments, unlink projects, transfer projects, or change domains without explicit approval.

## Supabase Rules

- Do not run Supabase migrations until the Supabase URL and project ref have been verified as `https://lxcsnnkancszllrafzaj.supabase.co` and `lxcsnnkancszllrafzaj`.
- Do not use or request a Supabase service-role key unless the task explicitly requires server-side admin access.
- Do not modify auth settings, RLS policies, production tables, or user data without identifying the exact Supabase project first.
- Keep migrations scoped to Tradevya only and store them under `supabase/migrations`.

## Security Rules

- Never commit passwords, API secrets, Supabase service-role keys, private tokens, OAuth secrets, or production database credentials.
- `.env.local` and other `.env*` files must remain untracked; `.env.example` may contain placeholder variable names only.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public client configuration, but still verify they belong to the Tradevya Supabase project before deploys.
- Do not paste or echo user passwords in commits, logs, documentation, or final reports.
- If real secrets are discovered in tracked files, report them immediately and do not push until the user approves remediation.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
