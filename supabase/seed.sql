-- seed.sql
-- Demo data: 14 applications (every status, so the Kanban board fills up) + tasks.
-- Needs migrations 001 and 002 (status "saved" and job_url) to have been run first.
-- How to use: Supabase → SQL Editor → paste this file → change the email below → Run.
-- The SQL Editor runs as an admin, so it can write rows for any user (RLS is bypassed here,
-- unlike in the app). Running it twice inserts the data twice.

do $$
declare
  seed_email text := 'YOUR_EMAIL@example.com';  -- ← the email you log in with
  uid uuid;
  app_id uuid;
begin
  select id into uid from auth.users where email = seed_email;
  if uid is null then
    raise exception 'No user with email %. Sign up in the app first.', seed_email;
  end if;

  -- ── Saved (found, not applied yet) ────────────────────────────────────────
  insert into public.applications (user_id, company, position, status, application_date, notes, job_url)
  values (uid, 'Airbnb', 'Account Executive (Hotels)', 'saved', '2026-11-10', 'Location: Barcelona, Spain',
          'https://boards.greenhouse.io/airbnb/jobs/8365363');

  insert into public.applications (user_id, company, position, status, application_date, notes, job_url)
  values (uid, 'Grupo Boticário', 'Analista de Produto', 'saved', '2026-11-11', 'Location: Curitiba, PR',
          'https://grupoboticario.gupy.io/')
  returning id into app_id;
  insert into public.tasks (user_id, application_id, title, due_date, done) values
    (uid, app_id, 'Tailor the CV for this role', '2026-11-14', false);

  -- ── Applied ───────────────────────────────────────────────────────────────
  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'Nubank', 'Product Manager', 'applied', '2026-10-28', 'Referral from a Le Wagon alumnus')
  returning id into app_id;
  insert into public.tasks (user_id, application_id, title, due_date, done) values
    (uid, app_id, 'Send follow-up email to the recruiter', '2026-11-12', false),
    (uid, app_id, 'Research Nubank''s latest product launches', '2026-11-08', true);

  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'QuintoAndar', 'Associate Product Manager', 'applied', '2026-11-03', null)
  returning id into app_id;
  insert into public.tasks (user_id, application_id, title, due_date, done) values
    (uid, app_id, 'Follow up if no answer', '2026-11-17', false);

  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'Hotmart', 'Product Analyst', 'applied', '2026-11-06', 'Remote position');

  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'Creditas', 'Product Owner', 'applied', '2026-11-09', null);

  -- ── Interviewing ──────────────────────────────────────────────────────────
  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'iFood', 'Associate Product Manager', 'interviewing', '2026-10-14', 'Case interview with the growth team')
  returning id into app_id;
  insert into public.tasks (user_id, application_id, title, due_date, done) values
    (uid, app_id, 'Prepare the product case presentation', '2026-11-13', false),
    (uid, app_id, 'Practice metrics questions (CAC, LTV, retention)', '2026-11-12', false),
    (uid, app_id, 'First call with recruiter', '2026-10-21', true);

  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'Mercado Livre', 'Product Manager - Payments', 'interviewing', '2026-10-20', 'Second round with the PM lead')
  returning id into app_id;
  insert into public.tasks (user_id, application_id, title, due_date, done) values
    (uid, app_id, 'Read about Mercado Pago''s roadmap', '2026-11-10', true),
    (uid, app_id, 'Write STAR stories for behavioral questions', '2026-11-14', false);

  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'Stone', 'Business Analyst', 'interviewing', '2026-10-30', null)
  returning id into app_id;
  insert into public.tasks (user_id, application_id, title, due_date, done) values
    (uid, app_id, 'Finish the SQL take-home test', '2026-11-11', false);

  -- ── Offered ───────────────────────────────────────────────────────────────
  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'PicPay', 'Product Manager', 'offered', '2026-09-22', 'Offer received! Answer by Nov 20')
  returning id into app_id;
  insert into public.tasks (user_id, application_id, title, due_date, done) values
    (uid, app_id, 'Compare the offer with other processes', '2026-11-15', false),
    (uid, app_id, 'Ask about benefits and remote policy', '2026-11-13', false);

  -- ── Rejected ──────────────────────────────────────────────────────────────
  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'Itaú BBA', 'Product Owner', 'rejected', '2026-09-15', 'Feedback: wanted more banking experience')
  returning id into app_id;
  insert into public.tasks (user_id, application_id, title, due_date, done) values
    (uid, app_id, 'Send a thank-you note and ask to stay in touch', '2026-10-10', true);

  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'McKinsey & Company', 'Business Analyst', 'rejected', '2026-09-08', null);

  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'Loft', 'Product Manager', 'rejected', '2026-09-29', null);

  -- ── Withdrawn ─────────────────────────────────────────────────────────────
  insert into public.applications (user_id, company, position, status, application_date, notes)
  values (uid, 'Ambev Tech', 'Product Analyst', 'withdrawn', '2026-10-05', 'On-site only, withdrew');

  raise notice 'Seed done for %', seed_email;
end $$;
