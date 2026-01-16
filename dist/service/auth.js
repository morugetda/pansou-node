import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config.js';
export class AuthService {
    config;
    revokedTokens;
    tokenExpiryMs;
    constructor() {
        this.config = getConfig();
        this.revokedTokens = new Map();
        this.tokenExpiryMs = this.config.authTokenExpiry * 60 * 60 * 1000;
    }
    async login(username, password) {
        if (!this.config.authEnabled) {
            return null;
        }
        const storedPassword = this.config.authUsers[username];
        if (!storedPassword) {
            return null;
        }
        const isValid = await bcrypt.compare(password, storedPassword);
        if (!isValid) {
            return null;
        }
        const token = this.generateToken(username);
        return token;
    }
    generateToken(username) {
        const now = Date.now();
        const expiresAt = now + this.tokenExpiryMs;
        const jti = uuidv4();
        const payload = {
            username,
            jti,
            iat: Math.floor(now / 1000),
            exp: Math.floor(expiresAt / 1000)
        };
        const token = jwt.sign(payload, this.config.jwtSecret, { algorithm: 'HS256' });
        this.revokedTokens.set(jti, {
            jti,
            username,
            expires_at: expiresAt
        });
        return {
            token,
            expires_at: expiresAt,
            username
        };
    }
    verifyToken(token) {
        if (!this.config.authEnabled) {
            return { valid: true };
        }
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            const storedToken = this.revokedTokens.get(decoded.jti);
            if (storedToken) {
                return { valid: false };
            }
            return {
                valid: true,
                username: decoded.username
            };
        }
        catch (error) {
            return { valid: false };
        }
    }
    logout(token) {
        if (!this.config.authEnabled) {
            return true;
        }
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            this.revokedTokens.set(decoded.jti, {
                jti: decoded.jti,
                username: decoded.username,
                expires_at: decoded.exp * 1000
            });
            return true;
        }
        catch {
            return false;
        }
    }
    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [jti, token] of this.revokedTokens) {
            if (token.expires_at < now) {
                this.revokedTokens.delete(jti);
            }
        }
    }
}
let globalAuthService = null;
export function getAuthService() {
    if (!globalAuthService) {
        globalAuthService = new AuthService();
    }
    return globalAuthService;
}
//# sourceMappingURL=auth.js.map