/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SENTRY_DSN?: string;
  readonly PUBLIC_GIT_COMMIT?: string;
  readonly PUBLIC_CLARITY_PROJECT_ID?: string;
  readonly PUBLIC_CF_WEB_ANALYTICS_TOKEN?: string;
  readonly PUBLIC_ENABLE_SITE_SEARCH?: string;
  readonly PUBLIC_ENABLE_AI_ASSISTANT?: string;
  readonly MODE: 'development' | 'production';
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
