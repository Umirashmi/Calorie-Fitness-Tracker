import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { tokenConfig } from '../config/jwt';
import { environment } from '../config/environment';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, environment.BCRYPT_SALT_ROUNDS);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, tokenConfig.access.secret, {
      expiresIn: tokenConfig.access.expiresIn,
      issuer: tokenConfig.access.issuer,
      audience: tokenConfig.access.audience,
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, tokenConfig.refresh.secret, {
      expiresIn: tokenConfig.refresh.expiresIn,
      issuer: tokenConfig.refresh.issuer,
      audience: tokenConfig.refresh.audience,
    });
  }

  static generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, tokenConfig.access.secret, {
        issuer: tokenConfig.access.issuer,
        audience: tokenConfig.access.audience,
      }) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, tokenConfig.refresh.secret, {
        issuer: tokenConfig.refresh.issuer,
        audience: tokenConfig.refresh.audience,
      }) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }
}