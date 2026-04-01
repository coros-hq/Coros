/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API base, e.g. `http://localhost:3000/v1/api` (see `apps/web/.env`). */
  readonly COROS_API_ORIGIN?: string;
  readonly VITE_COROS_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
