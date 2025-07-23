import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, TokenPair, LoginCredentials } from './types';

export class AuthService {
  private readonly saltRounds = 10;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev-secret';
  private readonly refreshSecret = process.env.REFRESH_SECRET || 'dev-refresh-secret';

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokenPair(userId: string): TokenPair {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.refreshSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): { userId: string } {
    const payload = jwt.verify(token, this.jwtSecret) as any;
    if (payload.type !== 'access') throw new Error('Invalid token type');
    return { userId: payload.userId };
  }

  verifyRefreshToken(token: string): { userId: string } {
    const payload = jwt.verify(token, this.refreshSecret) as any;
    if (payload.type !== 'refresh') throw new Error('Invalid token type');
    return { userId: payload.userId };
  }

  async login(credentials: LoginCredentials, userHash: string): Promise<TokenPair | null> {
    const isValid = await this.verifyPassword(credentials.password, userHash);
    if (!isValid) return null;
    return this.generateTokenPair(credentials.username);
  }
}