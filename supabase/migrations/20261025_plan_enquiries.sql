-- Run after the initial static sales site migration if that migration was already applied.
alter table public.enquiries drop constraint if exists enquiries_service_valid;
alter table public.enquiries add constraint enquiries_service_valid
  check (service in ('extension', 'consultation', 'moving', 'itinerary', 'other', 'plan'));
