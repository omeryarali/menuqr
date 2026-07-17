# Auth email templates (Turkish)

These are **not** loaded by the app. They live in the Supabase dashboard under
**Authentication → Email Templates**, and are kept here only so they're versioned and reviewable —
the dashboard is the source of truth at runtime. Edit here, then paste into the dashboard.

## Subjects

Paste the body from the matching `.html`, and set the subject by hand:

| Template        | File                   | Subject (Konu)                    | Used by the app?         |
| --------------- | ---------------------- | --------------------------------- | ------------------------ |
| Confirm signup  | `confirm-signup.html`  | `MenuQR hesabınızı doğrulayın`    | **Yes** — on signup      |
| Reset password  | `reset-password.html`  | `MenuQR şifrenizi sıfırlayın`     | **Yes** — /forgot-password |
| Magic Link      | `magic-link.html`      | `MenuQR giriş bağlantınız`        | No — password auth only  |

**Confirm signup** fires from `signUp()` and **Reset password** from `forgotPassword()` (both in
`lib/actions/auth.ts`). Magic Link is translated in advance and is dead copy until an OTP flow
exists — nothing sends it today.

The remaining Supabase templates (Invite user, Change email, Reauthentication) are untranslated —
MenuQR triggers none of them.

## Two things that will bite you

**1. The built-in email service sends 2 emails per hour. Total.**

That is not a typo and it is not per user — it's the documented limit on Supabase's built-in SMTP,
and it cannot be raised without configuring custom SMTP. In practice this means your third test
signup in an hour silently fails to receive anything, and it makes the built-in provider unusable in
production. Set up custom SMTP (Resend, Postmark, SES, …) under **Project Settings → Authentication →
SMTP Settings** before you launch, or before any real user signs up.

**2. Redirects must be allow-listed.**

`{{ .ConfirmationURL }}` bounces the user through Supabase's verify endpoint and then to the
redirect we pass in code — `/auth/callback` for signup, `/auth/callback?next=/update-password` for
password reset. If the target isn't in **Authentication → URL Configuration → Redirect URLs**,
Supabase silently falls back to the Site URL instead of erroring. Add both
`http://localhost:3000/auth/callback` and your production `https://…/auth/callback`.

The docs don't spell out whether query strings (`?next=…`) participate in allow-list matching. The
symptom to watch for: if clicking the reset link signs you in but drops you on the home page instead
of the new-password form, the `?next=` variant is being rejected — change the allow-list entries to
`…/auth/callback*` (trailing wildcard) and it will match.

## Notes on the copy

- `{{ .Data.full_name }}` reads `auth.users.user_metadata`, which we populate at signup. It can be
  empty (OAuth, manually created users), so the greeting is wrapped in `{{ if }}` — otherwise the
  email opens with "Merhaba ,".
- No template states a link lifetime. The expiry is a configurable Auth setting, so a hardcoded
  "24 saat" turns into a lie the moment someone changes it. If you want a concrete number in the
  copy, it's on you to keep the two in sync.
- `{{ .Token }}` (the 6-digit OTP) is only populated for Magic Link and Reauthentication. Don't add
  it to `confirm-signup.html` — it renders empty there.
