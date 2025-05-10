//defining types for environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CORS_FRONTEND_ORIGIN: string;
      CORS_WEB_ORIGIN: string;
      PORT: string;
    }
  }
}

export {};
