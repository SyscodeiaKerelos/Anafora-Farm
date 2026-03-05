## Git Branch & Commit Conventions

This document collects the git workflow rules for the project. The Cursor agent reads the mirrored version in `.cursor/rules/git-conventions.mdc`.

### Branch Naming Convention

- **Feature branches** must follow the pattern: `NNN-short-description`, for example:
  - `001-auth-flow`
  - `023-admin-users-table`
- **`NNN`**:
  - Three‑digit, zero‑padded feature number (001, 002, ..., 123).
  - Allocated sequentially per feature; do not reuse numbers.
- **`short-description`**:
  - Lowercase, **kebab‑case** words (`[a-z0-9-]` only).
  - 2–4 meaningful keywords; avoid filler words like *add, fix, change, update, feature*.
  - Generated from the feature description (e.g. "Add user authentication system" → `001-user-authentication`).
- **Do not** add extra prefixes (no `feature/`, `bugfix/`, etc.) unless CI tooling explicitly requires them.

### Commit Message Convention

- Use a **single, structured line** for the subject, optionally followed by a blank line and details.
- Follow a **Conventional Commits–style** prefix:
  - `feat: …` – new user‑visible feature.
  - `fix: …` – bug fix.
  - `docs: …` – documentation or rules changes.
  - `style: …` – formatting only (no code behavior change).
  - `refactor: …` – code refactor without behavior change.
  - `test: …` – add or adjust tests only.
  - `chore: …` – tooling, build, or maintenance tasks.
- Examples:
  - `docs: adopt shared i18n key rules`
  - `feat: add admin users role management page`
  - `fix: correct auth guard redirect for anonymous users`
- **Guidelines**:
  - Max ~72 characters for the subject line.
  - Use **imperative mood** (“add”, “fix”, “update”), not past tense.
  - Ensure each commit is a **logical unit**: commit after each task or cohesive group of changes.

