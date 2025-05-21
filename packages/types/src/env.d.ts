//defining types for environment variables
import jwt from "jsonwebtoken";
type ExpiryTime = `${number}${"s" | "m" | "h" | "d"}`;
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      DB_NAME: string;
      CORS_FRONTEND_ORIGIN: string;
      CORS_WEB_ORIGIN: string;
      PORT: string;
      ACCESS_TOKEN_SECRET: string;
      ACCESS_TOKEN_EXPIRY: ExpiryTime;
      REFRESH_TOKEN_SECRET: string;
      REFRESH_TOKEN_EXPIRY: ExpiryTime;
    }
  }
}

export {};
