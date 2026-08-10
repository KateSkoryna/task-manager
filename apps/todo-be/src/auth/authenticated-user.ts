export interface FirebasePrincipal {
  firebaseUid: string;
  email: string;
}

export interface AuthenticatedUser extends FirebasePrincipal {
  id: string;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  firebaseUser?: FirebasePrincipal;
  headers: { authorization?: string };
  params: Record<string, string>;
}
