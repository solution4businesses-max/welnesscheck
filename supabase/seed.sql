-- Seed data mirroring the live prototype (Maya as client, Danielle as coach)
-- so `supabase start` gives you a backend that looks like the real app,
-- not an empty database. Local dev only — do not run against production.

-- Two demo auth users (password: "password123" for both, local only).
-- GoTrue's driver scans these token columns as non-nullable strings, so they
-- must be '' rather than left NULL or password sign-in fails with a
-- "converting NULL to string" 500 (only surfaces when seeding auth.users
-- directly instead of going through the signup API).
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
   confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maya@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', ''),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'danielle@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '');

insert into profiles (id, role, full_name, timezone) values
  ('11111111-1111-1111-1111-111111111111', 'client', 'Maya R.', 'America/New_York'),
  ('22222222-2222-2222-2222-222222222222', 'coach', 'Danielle', 'America/New_York');

insert into coaches (id, bio, credentials, specialties) values
  ('22222222-2222-2222-2222-222222222222', 'Somatic-informed relationship & nervous-system coaching.', 'ICF-PCC', array['relationships', 'nervous system', 'burnout']);

insert into coach_clients (coach_id, client_id, program_started_on, program_length_weeks) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', current_date - interval '2 weeks', 12);

insert into mood_tags (slug, label, sort_order) values
  ('heavy', 'Heavy', 1),
  ('low', 'Low', 2),
  ('steady', 'Steady', 3),
  ('open', 'Open', 4),
  ('bright', 'Bright', 5),
  ('tender', 'Tender', 6),
  ('lifted', 'Lifted', 7);

insert into check_ins (client_id, mood_slug, check_in_date) values
  ('11111111-1111-1111-1111-111111111111', 'steady', current_date - 5),
  ('11111111-1111-1111-1111-111111111111', 'heavy', current_date - 4),
  ('11111111-1111-1111-1111-111111111111', 'steady', current_date - 3),
  ('11111111-1111-1111-1111-111111111111', 'heavy', current_date - 2),
  ('11111111-1111-1111-1111-111111111111', 'lifted', current_date - 1),
  ('11111111-1111-1111-1111-111111111111', 'steady', current_date);

insert into journal_entries (client_id, source, prompt_text, body, shared_with_coach, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'free', null, 'Marcus came home tense again. Old me would have...', false, now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'free', null, 'Slept well. The morning walk is becoming the...', false, now() - interval '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'session', 'Where did you feel resistance — and what was underneath it?', 'Big day. I want to remember exactly how this felt.', true, now() - interval '4 days');

insert into goals (client_id, coach_id, title, detail, cadence, target_days_per_week, status, coach_note) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Have one honest conversation', 'with Marcus', 'daily', 5, 'active', 'We named this in session — what matters is consistency, not perfection.'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '30 min outside, no phone', 'Before noon · grounding practice', 'daily', 5, 'active', null),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Sleep before 11pm', 'Phone in another room', 'weekdays', 5, 'active', null);

insert into sessions (client_id, coach_id, scheduled_at, duration_minutes, prep_note) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', (current_date + 3)::timestamptz + interval '10 hours', 50, 'Want to talk about the doorway moment with Marcus — and what comes next when I don''t apologize.');

insert into library_collections (name, description) values
  ('When everything is changing', '9 pieces'),
  ('On anxious days', '12 pieces'),
  ('Permission to rest', '7 pieces');

insert into library_content (title, type, duration_seconds, storage_path, is_new, created_by_coach_id) values
  ('Three minutes of stillness', 'audio', 194, 'library/three-minutes-stillness.mp3', true, '22222222-2222-2222-2222-222222222222'),
  ('What is window of tolerance?', 'video', 522, 'library/window-of-tolerance.mp4', false, '22222222-2222-2222-2222-222222222222'),
  ('A grief vocabulary', 'pdf', null, 'library/grief-vocabulary.pdf', false, null),
  ('Breath, for the overwhelmed', 'audio', 300, 'library/breath-overwhelmed.mp3', false, null),
  ('How coaching actually works', 'video', 680, 'library/how-coaching-works.mp4', false, null),
  ('The 4-7-8 reset, narrated', 'audio', 240, 'library/478-reset.mp3', false, '22222222-2222-2222-2222-222222222222');

insert into coach_picks (client_id, content_id, coach_note, week_of)
  select '11111111-1111-1111-1111-111111111111', id, 'Maya — based on your check-ins this week. Try it tonight.', date_trunc('week', current_date)
  from library_content where title = 'The 4-7-8 reset, narrated';

insert into messages (coach_id, client_id, sender_id, body) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Proud of how you handled that conversation with Marcus.');
