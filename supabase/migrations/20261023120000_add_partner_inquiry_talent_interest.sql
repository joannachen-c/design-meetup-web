-- Adds "hiring through the Talent Network" from the /talent page form.
-- Paste and run this in the Supabase SQL editor if it has not been applied.
--
-- Without it the interest check rejects the insert; app/api/contact/route.ts
-- only logs that, so the email still goes out but the dashboard copy is lost.
alter table public.partner_inquiries
  drop constraint if exists partner_inquiries_interest_check;

alter table public.partner_inquiries
  add constraint partner_inquiries_interest_check
    check (interest in ('sponsor', 'panelist', 'judge', 'venue', 'advisor', 'talent'));
