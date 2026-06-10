insert into public.companies (name, company_type, is_other) values
  ('Delta Air Lines', 'major_us_airline', false),
  ('United Airlines', 'major_us_airline', false),
  ('American Airlines', 'major_us_airline', false),
  ('Southwest Airlines', 'major_us_airline', false),
  ('JetBlue', 'major_us_airline', false),
  ('Spirit Airlines', 'major_us_airline', false),
  ('Frontier Airlines', 'major_us_airline', false),
  ('Alaska Airlines', 'major_us_airline', false),
  ('Hawaiian Airlines', 'major_us_airline', false),
  ('Allegiant Air', 'major_us_airline', false),
  ('Sun Country Airlines', 'major_us_airline', false),
  ('Breeze Airways', 'major_us_airline', false),
  ('Avelo Airlines', 'major_us_airline', false),
  ('Air Canada', 'international_airline', false),
  ('British Airways', 'international_airline', false),
  ('Lufthansa', 'international_airline', false),
  ('Air France', 'international_airline', false),
  ('KLM', 'international_airline', false),
  ('Emirates', 'international_airline', false),
  ('Qatar Airways', 'international_airline', false),
  ('Etihad Airways', 'international_airline', false),
  ('Turkish Airlines', 'international_airline', false),
  ('Singapore Airlines', 'international_airline', false),
  ('Cathay Pacific', 'international_airline', false),
  ('Japan Airlines', 'international_airline', false),
  ('ANA', 'international_airline', false),
  ('Korean Air', 'international_airline', false),
  ('Virgin Atlantic', 'international_airline', false),
  ('Aer Lingus', 'international_airline', false),
  ('Iberia', 'international_airline', false),
  ('Swiss', 'international_airline', false),
  ('TAP Air Portugal', 'international_airline', false),
  ('Avianca', 'international_airline', false),
  ('Copa Airlines', 'international_airline', false),
  ('LATAM', 'international_airline', false),
  ('Aeromexico', 'international_airline', false),
  ('FedEx Express', 'cargo_airline', false),
  ('UPS Airlines', 'cargo_airline', false),
  ('DHL Aviation', 'cargo_airline', false),
  ('Amazon Air', 'cargo_airline', false),
  ('Atlas Air', 'cargo_airline', false),
  ('Kalitta Air', 'cargo_airline', false),
  ('Amerijet', 'cargo_airline', false),
  ('Swissport', 'ground_handler', false),
  ('Worldwide Flight Services', 'ground_handler', false),
  ('Menzies Aviation', 'ground_handler', false),
  ('Unifi Aviation', 'ground_handler', false),
  ('GAT Airline Ground Support', 'ground_handler', false),
  ('PrimeFlight Aviation Services', 'ground_handler', false),
  ('Prospect Airport Services', 'ground_handler', false),
  ('Dnata', 'ground_handler', false),
  ('ABM Aviation', 'ground_handler', false),
  ('Alliance Ground International', 'ground_handler', false),
  ('Trego-Dugan Aviation', 'ground_handler', false),
  ('McGee Air Services', 'ground_handler', false),
  ('TSA', 'airport_authority', false),
  ('Port Authority / Airport Authority', 'airport_authority', false),
  ('Airport Operations', 'airport_authority', false),
  ('Airport Security', 'airport_authority', false),
  ('Airport Maintenance', 'airport_authority', false),
  ('Other', 'other', true)
on conflict (name) do nothing;

insert into public.airports (iata_code, name, city, state, latitude, longitude) values
  ('ATL', 'Hartsfield-Jackson Atlanta International Airport', 'Atlanta', 'GA', 33.640700, -84.427700),
  ('LAX', 'Los Angeles International Airport', 'Los Angeles', 'CA', 33.941600, -118.408500),
  ('ORD', 'O''Hare International Airport', 'Chicago', 'IL', 41.974200, -87.907300),
  ('DFW', 'Dallas Fort Worth International Airport', 'Dallas-Fort Worth', 'TX', 32.899800, -97.040300),
  ('DEN', 'Denver International Airport', 'Denver', 'CO', 39.856100, -104.673700),
  ('JFK', 'John F. Kennedy International Airport', 'New York', 'NY', 40.641300, -73.778100),
  ('SFO', 'San Francisco International Airport', 'San Francisco', 'CA', 37.621300, -122.379000),
  ('SEA', 'Seattle-Tacoma International Airport', 'Seattle', 'WA', 47.450200, -122.308800),
  ('MIA', 'Miami International Airport', 'Miami', 'FL', 25.795900, -80.287000),
  ('CLT', 'Charlotte Douglas International Airport', 'Charlotte', 'NC', 35.214400, -80.947300),
  ('LAS', 'Harry Reid International Airport', 'Las Vegas', 'NV', 36.084000, -115.153700),
  ('MCO', 'Orlando International Airport', 'Orlando', 'FL', 28.431200, -81.308100),
  ('EWR', 'Newark Liberty International Airport', 'Newark', 'NJ', 40.689500, -74.174500),
  ('PHX', 'Phoenix Sky Harbor International Airport', 'Phoenix', 'AZ', 33.435200, -112.010100),
  ('IAH', 'George Bush Intercontinental Airport', 'Houston', 'TX', 29.990200, -95.336800),
  ('BOS', 'Boston Logan International Airport', 'Boston', 'MA', 42.365600, -71.009600),
  ('MSP', 'Minneapolis-Saint Paul International Airport', 'Minneapolis-Saint Paul', 'MN', 44.884800, -93.222300),
  ('DTW', 'Detroit Metropolitan Wayne County Airport', 'Detroit', 'MI', 42.216200, -83.355400),
  ('PHL', 'Philadelphia International Airport', 'Philadelphia', 'PA', 39.874400, -75.242400),
  ('DCA', 'Ronald Reagan Washington National Airport', 'Washington', 'DC', 38.851200, -77.040200)
on conflict (iata_code) do update
set latitude = excluded.latitude,
    longitude = excluded.longitude;

insert into public.stations (airport_id, name, description)
select a.id, s.name, s.description
from public.airports a
cross join (
  values
    ('Ramp', 'Ramp and below-wing operations'),
    ('Gate', 'Gate and boarding teams'),
    ('Customer Service', 'Ticketing, check-in, and customer support'),
    ('Baggage', 'Bag room and baggage service teams'),
    ('Operations', 'Station operations and control'),
    ('Maintenance', 'Aircraft, facility, and ground equipment maintenance'),
    ('Security', 'Security and screening support')
) as s(name, description)
on conflict (airport_id, name) do nothing;

with seed_context as (
  select
    c.id as company_id,
    a.id as airport_id,
    s.id as station_id
  from public.companies c
  join public.airports a on a.iata_code = 'ATL'
  join public.stations s on s.airport_id = a.id and s.name = 'Ramp'
  where c.name = 'Delta Air Lines'
)
insert into public.shift_posts (
  user_id,
  company_id,
  airport_id,
  station_id,
  poster_name_snapshot,
  category,
  shift_date,
  day_of_week,
  shift_start,
  shift_end,
  location_team,
  notes,
  status
)
select null::uuid, company_id, airport_id, station_id, 'Sample coordinator', 'give_away', current_date + 3, 'Monday', '06:00'::time, '14:30'::time, 'Ramp Team A', 'Early bag room coverage. Sample post for first-run testing.', 'open'
from seed_context
union all
select null::uuid, company_id, airport_id, station_id, 'Sample coordinator', 'day_trade', current_date + 5, 'Wednesday', '14:00'::time, '22:30'::time, 'T-Concourse', 'Looking to swap for a morning shift later this week.', 'open'
from seed_context
union all
select null::uuid, company_id, airport_id, station_id, 'Sample coordinator', 'looking_for_double', current_date + 6, 'Thursday', '05:00'::time, '13:30'::time, 'Ramp Team B', 'Available to double if anyone needs coverage.', 'open'
from seed_context;
