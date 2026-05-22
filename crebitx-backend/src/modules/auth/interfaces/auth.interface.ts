export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserFromToken {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}
