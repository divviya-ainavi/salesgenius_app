// Authentication helper functions with environment-based configuration
import { config } from './config';
import CryptoJS from 'crypto-js';

// Hash password function using environment-based salt
export const hashPassword = (password) => {
  const saltedPassword = password + config.passwordSalt;
  return CryptoJS.SHA256(saltedPassword).toString();
};

// JWT token utilities using environment-based secret
export const createJWT = (payload, expiresIn = '24h') => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresIn === '24h' ? 24 * 60 * 60 : parseInt(expiresIn));

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: exp
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${config.jwtSecret}`)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const decodeJWT = (token, secret = config.jwtSecret) => {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    const base64UrlDecode = (str) => {
      return JSON.parse(atob(str.replace(/-/g, '+').replace(/_/g, '/')));
    };

    // Decode header and payload
    const header = base64UrlDecode(encodedHeader);
    const payload = base64UrlDecode(encodedPayload);

    // Recreate signature to verify
    const expectedSignature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const isValid = signature === expectedSignature;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp && payload.exp < now;

    return {
      header,
      payload,
      isExpired,
      isValid,
    };
  } catch (error) {
    console.error('JWT decode error:', error);
    return { header: null, payload: null, isExpired: true, isValid: false };
  }
};