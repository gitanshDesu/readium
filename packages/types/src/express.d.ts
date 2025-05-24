import { UserDocumentType } from "@readium/database/user.model";

declare global {
  namespace Express {
    export interface User extends UserDocumentType {}
    export interface CustomRequest extends Request {
      user?: UserDocumentType;
    }
  }
}
