import CryptoJS from 'crypto-js';
import { config } from './config';

// JWT Utilities for token generation and management
class JWTManager {
  constructor() {
    this.tokenKey = 'salesgenius_jwt_token';
    this.expiryKey = 'salesgenius_jwt_expiry';
    this.userIdKey = 'salesgenius_user_id';
    this.userEmailKey = 'salesgenius_user_email';
  }

  // Generate JWT token
  generateToken(userId, email) {
    try {
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };

      // Set expiry to 3 hours from now
      const now = Math.floor(Date.now() / 1000);
      const expiry = now + (3 * 60 * 60); // 3 hours

      const payload = {
        userId,
        email,
        iat: now,
        exp: expiry
      };

      // Base64URL encode
      const base64UrlEncode = (obj) => {
        return btoa(JSON.stringify(obj))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };

      const encodedHeader = base64UrlEncode(header);
      const encodedPayload = base64UrlEncode(payload);

      // Create signature using HMAC SHA256
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      const signature = CryptoJS.HmacSHA256(signatureInput, config.jwtSecret)
        .toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const token = `${encodedHeader}.${encodedPayload}.${signature}`;

      // Store token and related data
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.expiryKey, expiry.toString());
      localStorage.setItem(this.userIdKey, userId);
      localStorage.setItem(this.userEmailKey, email);

      console.log('✅ JWT token generated successfully', {
        userId,
        email,
        expiresAt: new Date(expiry * 1000).toLocaleString()
      });

      return token;
    } catch (error) {
      console.error('❌ Error generating JWT token:', error);
      throw error;
    }
  }

  // Get current token (auto-refresh if expired)
  getToken() {
    try {
      const token = localStorage.getItem(this.tokenKey);
      const expiry = localStorage.getItem(this.expiryKey);
      const userId = localStorage.getItem(this.userIdKey);
      const email = localStorage.getItem(this.userEmailKey);

      if (!token || !expiry || !userId || !email) {
        console.log('📭 No JWT token data found');
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiryTime = parseInt(expiry);

      // Check if token expires within 5 minutes (300 seconds buffer)
      if (now >= (expiryTime - 300)) {
        console.log('🔄 JWT token expired or expiring soon, regenerating...');
        return this.generateToken(userId, email);
      }

      return token;
    } catch (error) {
      console.error('❌ Error getting JWT token:', error);
      return null;
    }
  }

  // Set user info for token generation
  setUserInfo(userId, email) {
    localStorage.setItem(this.userIdKey, userId);
    localStorage.setItem(this.userEmailKey, email);
    
    // Generate initial token
    return this.generateToken(userId, email);
  }

  // Clear all JWT data
  clearToken() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.expiryKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.userEmailKey);
    console.log('🧹 JWT token data cleared');
  }

  // Check if token exists and is valid
  isTokenValid() {
    const token = localStorage.getItem(this.tokenKey);
    const expiry = localStorage.getItem(this.expiryKey);

    if (!token || !expiry) return false;

    const now = Math.floor(Date.now() / 1000);
    const expiryTime = parseInt(expiry);

    return now < expiryTime;
  }

  // Get token expiry info
  getTokenInfo() {
    const expiry = localStorage.getItem(this.expiryKey);
    const userId = localStorage.getItem(this.userIdKey);
    const email = localStorage.getItem(this.userEmailKey);

    if (!expiry) return null;

    const expiryTime = parseInt(expiry);
    const now = Math.floor(Date.now() / 1000);
    const remainingSeconds = expiryTime - now;

    return {
      userId,
      email,
      expiresAt: new Date(expiryTime * 1000),
      remainingSeconds,
      isExpired: remainingSeconds <= 0,
      expiresInMinutes: Math.floor(remainingSeconds / 60)
    };
  }
}

// Create singleton instance
const jwtManager = new JWTManager();

export default jwtManager;
export { jwtManager };