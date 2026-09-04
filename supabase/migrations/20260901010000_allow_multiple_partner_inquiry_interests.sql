-- Partner form interests can now be multi-select. Store one or more keys as a
-- comma-separated list (option order), e.g. "sponsor,advisor".
-- Paste and run this in the Supabase SQL editor if it has not been applied.
alter table public.partner_inquiries
  drop constraint if exists partner_inquiries_interest_check;

alter table public.partner_inquiries
  add constraint partner_inquiries_interest_check
    check (
      interest ~ '^(sponsor|panelist|judge|venue|advisor)(,(sponsor|panelist|judge|venue|advisor))*$'
    );
