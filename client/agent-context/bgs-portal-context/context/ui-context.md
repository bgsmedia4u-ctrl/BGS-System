# UI Context — BGS Teachers & Administration Portal

## Design system
Institutional **Navy & Gold**. Fill in exact hex values from the existing
Vanilla CSS variables the first time an agent touches `src/styles/` — do not
invent new brand colors. Suggested variable names if not already present:

```css
:root {
  --color-navy-900: #0b1f3a;   /* replace with actual brand navy */
  --color-navy-700: #16305c;
  --color-gold-500: #c9a227;   /* replace with actual brand gold */
  --color-gold-100: #f5e9c8;
  --color-bg: #f7f8fa;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-text-muted: #5c6472;
  --color-danger: #b3261e;
  --color-success: #1e7d32;
}
```

## Layout conventions
- Unified Shell: one persistent nav/header, contents swap based on role
  (Teacher Portal vs Admin Portal) — never a separate layout tree per role.
- Forms (Weekly Report Builder, leave applications, SMS template picker): consistent
  label-above-input pattern, inline validation errors in `--color-danger`,
  primary actions in `--color-gold-500` on `--color-navy-900`.
- Tables (registries, marks entry, notification log): sticky header, zebra striping
  optional but must stay within the navy/gold/neutral palette — no ad hoc
  colors per feature.

## Component conventions
- Buttons: primary (gold-on-navy), secondary (navy outline), destructive
  (danger) — three variants only, don't add a fourth without updating this file.
- Loading/empty/error states are required for every data-driven view
  (registries, dashboards, notification log) — no bare blank screens.
- New MSG91 DLT SMS modal (spec 03) reuses the existing modal and form component
  pattern rather than introducing a new form primitive.

*(Agent note: if `src/styles/` already defines these tokens differently,
update this file to match reality rather than the reverse — this file
documents the actual system, it doesn't dictate a new one.)*
