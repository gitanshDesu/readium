declare module "passport-google-oidc" {
  import { Request } from "express";
  import { Strategy as PassportStrategy } from "passport-strategy"; // not from "passport"
  import { Profile, Strategy as PassportStrategyInterface } from "passport";

  export interface VerifyCallback {
    (err?: Error | null, user?: any, info?: any): void;
  }

  export type VerifyFunction = (
    issuer: string,
    profile: Profile,
    cb: VerifyCallback
  ) => void;

  export type VerifyFunctionWithReq = (
    req: Request,
    issuer: string,
    profile: Profile,
    cb: VerifyCallback
  ) => void;

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback?: boolean;
  }

  export interface StrategyOptionsWithRequest {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    passReqToCallback: true;
  }

  export class Strategy
    extends PassportStrategy
    implements PassportStrategyInterface
  {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(
      options: StrategyOptionsWithRequest,
      verify: VerifyFunctionWithReq
    );

    // Add this to satisfy the interface
    authenticate: PassportStrategyInterface["authenticate"];
  }
}
