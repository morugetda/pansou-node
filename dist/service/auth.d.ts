interface AuthResponse {
    token: string;
    expires_at: number;
    username: string;
}
interface VerifyResponse {
    valid: boolean;
    username?: string;
}
export declare class AuthService {
    private config;
    private revokedTokens;
    private tokenExpiryMs;
    constructor();
    login(username: string, password: string): Promise<AuthResponse | null>;
    generateToken(username: string): AuthResponse;
    verifyToken(token: string): VerifyResponse;
    logout(token: string): boolean;
    cleanupExpiredTokens(): void;
}
export declare function getAuthService(): AuthService;
export {};
//# sourceMappingURL=auth.d.ts.map