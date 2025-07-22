// Interface for token storage (implement with Redis/DB)
class TokenStore {
  async saveRefreshToken(token, userId, ttl) {
    throw new Error('Not implemented');
  }

  async validateRefreshToken(token, userId) {
    throw new Error('Not implemented');
  }

  async deleteRefreshToken(token) {
    throw new Error('Not implemented');
  }

  async deleteAllUserTokens(userId) {
    throw new Error('Not implemented');
  }

  async getFailedLoginAttempts(userId) {
    throw new Error('Not implemented');
  }

  async incrementFailedLoginAttempts(userId) {
    throw new Error('Not implemented');
  }

  async resetFailedLoginAttempts(userId) {
    throw new Error('Not implemented');
  }

  async lockAccount(userId, duration) {
    throw new Error('Not implemented');
  }

  async getLockoutEnd(userId) {
    throw new Error('Not implemented');
  }
}

module.exports = TokenStore;
