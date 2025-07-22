const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

class AuthService {
  constructor(config, tokenStore, logger) {
    this.config = config;
    this.tokenStore = tokenStore; // Redis/DB client
    this.logger = logger;
    this.bcryptRounds = config.bcryptRounds || 12;
  }

  async hashPassword(password) {
    this.validatePassword(password);
    return bcrypt.hash(password, this.bcryptRounds);
  }

  validatePassword(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain number');
    }
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(userId) {
    return jwt.sign(
      { userId, type: 'access' },
      this.config.jwtSecret,
      { expiresIn: '15m', algorithm: 'HS256' }
    );
  }

  async generateRefreshToken(userId) {
    const token = jwt.sign(
      { userId, type: 'refresh' },
      this.config.refreshSecret,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    
    await this.tokenStore.saveRefreshToken(token, userId, '7d');
    this.logger.info(`Refresh token generated for user ${userId}`);
    return token;
  }

  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ['HS256']
      });
      return decoded.type === 'access' ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.config.refreshSecret, {
        algorithms: ['HS256']
      });
      
      if (decoded.type !== 'refresh') return null;
      
      const isValid = await this.tokenStore.validateRefreshToken(
        refreshToken,
        decoded.userId
      );
      
      if (!isValid) {
        this.logger.warn(`Invalid refresh token attempt for user ${decoded.userId}`);
        return null;
      }
      
      // Token rotation
      await this.revokeRefreshToken(refreshToken);
      
      const newAccessToken = this.generateAccessToken(decoded.userId);
      const newRefreshToken = await this.generateRefreshToken(decoded.userId);
      
      this.logger.info(`Tokens refreshed for user ${decoded.userId}`);
      
      return { 
        accessToken: newAccessToken, 
        refreshToken: newRefreshToken 
      };
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      return null;
    }
  }

  async revokeRefreshToken(token) {
    await this.tokenStore.deleteRefreshToken(token);
    this.logger.info('Refresh token revoked');
  }

  async revokeAllUserTokens(userId) {
    await this.tokenStore.deleteAllUserTokens(userId);
    this.logger.info(`All tokens revoked for user ${userId}`);
  }

  async checkAccountLockout(userId) {
    const attempts = await this.tokenStore.getFailedLoginAttempts(userId);
    const lockoutDuration = this.calculateLockoutDuration(attempts);
    
    if (lockoutDuration > 0) {
      const lockoutEnd = await this.tokenStore.getLockoutEnd(userId);
      if (lockoutEnd && lockoutEnd > Date.now()) {
        return { locked: true, until: lockoutEnd };
      }
    }
    
    return { locked: false };
  }

  calculateLockoutDuration(attempts) {
    if (attempts >= 10) return 30 * 60 * 1000; // 30 minutes
    if (attempts >= 7) return 15 * 60 * 1000;  // 15 minutes
    if (attempts >= 5) return 5 * 60 * 1000;   // 5 minutes
    return 0;
  }

  async handleFailedLogin(userId, ip) {
    const attempts = await this.tokenStore.incrementFailedLoginAttempts(userId);
    const lockoutDuration = this.calculateLockoutDuration(attempts);
    
    if (lockoutDuration > 0) {
      await this.tokenStore.lockAccount(userId, lockoutDuration);
      this.logger.warn(`Account locked for user ${userId} after ${attempts} failed attempts from IP ${ip}`);
    }
    
    this.logger.warn(`Failed login attempt ${attempts} for user ${userId} from IP ${ip}`);
  }

  async handleSuccessfulLogin(userId, ip) {
    await this.tokenStore.resetFailedLoginAttempts(userId);
    this.logger.info(`Successful login for user ${userId} from IP ${ip}`);
  }

  createLoginLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many login attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true
    });
  }

  createGeneralLimiter() {
    return rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later'
    });
  }
}

module.exports = AuthService;
