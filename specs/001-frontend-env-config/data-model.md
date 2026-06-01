# data-model.md

## Entities

- **Environment Configuration**: Named set of key/value pairs used by the frontend at build or runtime.
  - Fields:
    - `name` (string) — preset name, e.g., `development`, `staging`, `production`.
    - `values` (object) — map of config keys to string values.

- **Preset**: A reference to an Environment Configuration. Stored as `.env.<preset>` files using Vite conventions.

- **Override**: Local developer-scoped key/value pairs applied on top of a preset. Implemented via `.env.local` files or `public/config.json` (dev runtime override).

## Validation Rules

- Required keys for this feature (examples to finalize):
  - `VITE_API_URL` — base API endpoint the frontend calls.
  - `VITE_FEATURE_DRAWING_ENABLED` — boolean-like string `"true"`/`"false"` for feature flag.

- Validation behavior:
  - Missing required keys cause the validator to exit with non-zero and list missing keys.
  - Extra keys are allowed but may be reported as informational warnings.

## Format

- Build-time: `.env*` files with `KEY=VALUE` pairs using Vite's `VITE_` prefix for public exposure.
- Runtime override (dev-only): `public/config.json` with `{"VITE_API_URL":"...", ...}` shape.
