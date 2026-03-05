## Styling & Theming Style Guide

This is the canonical copy of the styling rules for the project. A shorter version is also available at `STYLEGUIDE.md` in the repo root.

This project uses **Tailwind CSS** as the only styling system for new work, with a glassmorphism theme inspired by the main Anafora site (`https://anafora.org/`).

### Tailwind-Only Rule

- Do **not** create new `.scss` files or add custom SCSS.
- All new styling should use:
  - Tailwind utility classes directly in templates, and/or
  - Small reusable utilities defined with `@apply` in `src/styles.scss`.
- Keep `src/styles.scss` focused on:
  - Tailwind entry (`@use 'tailwindcss';`)
  - Light global resets (e.g. transitions on `html, body`)
  - A small set of shared utilities (see below).

### Theme Tokens

- Theme tokens are defined in `tailwind.config.ts` via `theme.extend`:
  - `background` / `foreground`
  - `muted` / `muted-foreground`
  - `primary` / `primary-foreground`
  - `accent` / `accent-foreground`
- Use these tokens with standard Tailwind APIs:
  - `bg-background`, `text-foreground`
  - `text-muted-foreground`
  - `bg-primary`, `text-primary-foreground`

### Shared Utilities

The following utilities are defined in `src/styles.scss` using `@apply` and should be reused across the app:

- **`app-bg`**:
  - Full-screen background gradient with dark desert/sky palette.
  - Example: Apply to the outermost shell (`<div class="app-bg">`).
- **`card-glass`**:
  - Rounded glass panel with translucent background, subtle border, strong shadow, and backdrop blur.
  - Example: cards, panels, admin sections, and key content surfaces.
- **`input-glass`**:
  - Rounded, semi-transparent input with clear focus-ring and improved readability.
  - Example: login, settings, and search inputs.
- **`btn-primary`**:
  - Primary CTAs with warm amber background and strong contrast.
  - Example: main actions such as “Login”, “Save”, or “Confirm”.
- **`btn-ghost`**:
  - Subtle glass buttons for secondary actions.
  - Example: toggles, secondary links, “Refresh” actions.
- **`text-muted`**:
  - Muted text for descriptions and helper copy.

### Layout Patterns

- **App Shell** (`App` component):
  - Uses `app-bg` on the root wrapper.
  - Wraps page content in a centered container (`max-w-5xl`, padding, and vertical spacing).
  - Top header uses `card-glass` and includes:
    - App title / wordmark.
    - Language toggle.
    - Theme toggle.
    - Login link/button.
- **Auth Pages**:
  - Centered column layout.
  - Outer container uses `app-bg`.
  - Inner card uses `card-glass` with generous padding.
  - Inputs use `input-glass`, buttons use `btn-primary` / `btn-ghost`.
- **Content Pages (Home/Admin)**:
  - Use `card-glass` for primary sections (forms, tables, dashboards).
  - Use consistent spacing (`space-y-*`, `gap-*`) instead of ad-hoc margins.

### PrimeNG Integration

- PrimeNG theme is configured in `app.config.ts` and respects dark mode via `.dark` selector.
- When using PrimeNG components:
  - Prefer Tailwind for layout and spacing (grid, flex, gaps).
  - Use PrimeNG CSS classes primarily for component-specific visuals.
  - Wrap complex PrimeNG tables or forms inside `card-glass` containers for consistent theming.

### Accessibility & Responsiveness

- Ensure all interactive elements have:
  - Clear focus styles (inherited from `btn-*` and `input-glass`).
  - Sufficient contrast with the background.
- Layouts should:
  - Stack cleanly on mobile (`grid` → single column, `flex` → `flex-col` when appropriate).
  - Avoid horizontal scrolling where possible; use `overflow-x-auto` on tables when needed.

### Internationalization (i18n)

- **Two languages required**: All user-facing UI text must be available in both **English (`en`) and Arabic (`ar`)**.
- **No hard-coded copy**:
  - Do not hard-code English/Arabic labels, headings, button text, helper copy, or error messages in templates or TypeScript.
  - Exceptions: brand names (`Anafora`, `Anafora Farm`) and obvious sample data (e.g. city names, product names used as demo content).
- **Use translation keys**:
  - In templates, always use the ngx-translate pipe, e.g. `{{ 'LOGIN_SUBMIT_LABEL' | translate }}`.
  - In TypeScript, fetch messages via `TranslationService.instant('KEY')` instead of inline strings.
- **Keep `en.json` and `ar.json` in sync**:
  - When adding a new key, update **both** `src/assets/i18n/en.json` and `src/assets/i18n/ar.json` in the same change.
  - Do not leave missing translations or placeholder Arabic/English.
- **Key naming**:
  - Use clear, feature-oriented UPPER_SNAKE_CASE keys (e.g. `LOGIN_WELCOME_TITLE`, `ADMIN_USERS_ERROR_LOAD`).
  - Prefer reusing generic keys (`EMAIL`, `PASSWORD`, `HOME`, `CANCEL`, etc.) instead of duplicating similar phrases.

