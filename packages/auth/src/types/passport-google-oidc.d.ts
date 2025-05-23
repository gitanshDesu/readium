declare module "passport-google-oidc" {
  import { Strategy as PassportStrategy } from "passport";
  import { Request } from "express";

  interface VerifyCallback {
    (err?: Error | null, user?: any, info?: any): void;
  }

  type VerifyFunction = (
    issuer: string,
    profile: any,
    cb: VerifyCallback
  ) => void;

  type VerifyFunctionWithReq = (
    req: Request,
    issuer: string,
    profile: any,
    cb: VerifyCallback
  ) => void;

  interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback?: false;
  }

  interface StrategyOptionsWithRequest {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback: true;
  }

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(
      options: StrategyOptionsWithRequest,
      verify: VerifyFunctionWithReq
    );
  }
}
