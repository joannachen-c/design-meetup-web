-- Optional note from the Partner with us form.
-- Paste and run this in the Supabase SQL editor if it has not been applied.
--
-- The column is nullable so inquiries sent before the note field, and new
-- inquiries that leave it blank, still insert. A rejected insert is only
-- logged by app/api/contact/route.ts — the sender still gets their email.
alter table public.partner_inquiries
  add column if not exists note text;

alter table public.partner_inquiries
  drop constraint if exists partner_inquiries_note_length_check;

alter table public.partner_inquiries
  add constraint partner_inquiries_note_length_check
    check (note is null or char_length(note) <= 1000);
