-- Adds "joining the Board of Advisors" to the Partner with us form.
-- Paste and run this in the Supabase SQL editor if it has not been applied.
--
-- The interest column is guarded by a check constraint, and a rejected insert
-- is only logged by app/api/contact/route.ts — the sender still gets their
-- email, so without this the dashboard copy of an advisor inquiry would go
-- missing without anyone noticing.
alter table public.partner_inquiries
  drop constraint if exists partner_inquiries_interest_check;

alter table public.partner_inquiries
  add constraint partner_inquiries_interest_check
    check (interest in ('sponsor', 'panelist', 'judge', 'venue', 'advisor'));
