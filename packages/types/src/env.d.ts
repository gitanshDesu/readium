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
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_CALLBACK_URL: string;
      FRONTEND_REDIRECT_URI: string;
      MAX_AGE: number;
      COOKIE_SESSION_KEY: string;
      ETHEREAL_USER: string;
      ETHEREAL_PASS: string;
      BUCKET_NAME: string;
      BUCKET_REGION: string;
      ACCESS_KEY: string;
      SECRET_ACCESS_KEY: string;
    }
  }
}

export {};
