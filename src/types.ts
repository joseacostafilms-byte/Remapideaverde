export enum Scope {
  LOCAL = "Local",
  REGIONAL = "Regional",
  NATIONAL = "National",
  INTERNATIONAL = "International"
}

export enum InitiativeStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export interface Initiative {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  scope: Scope;
  category: string;
  address?: string;
  lat: number;
  lng: number;
  responsible1?: string;
  responsible2?: string;
  socialFB?: string;
  socialIG?: string;
  socialTikTok?: string;
  description?: string;
  mainProject?: string;
  website?: string;
  logoUrl?: string;
  images?: string[];
  userId: string;
  status: InitiativeStatus;
  createdAt: any;
  updatedAt: any;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
