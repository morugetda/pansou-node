import { getAuthService } from '../service/auth.js';
import { getConfig } from '../config.js';
export function authMiddleware(req, res, next) {
    const config = getConfig();
    if (!config.authEnabled) {
        next();
        return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            error: '未授权：缺少认证令牌',
            code: 'AUTH_TOKEN_MISSING'
        });
        return;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
            error: '未授权：令牌格式无效',
            code: 'AUTH_TOKEN_INVALID'
        });
        return;
    }
    const token = parts[1];
    const authService = getAuthService();
    const result = authService.verifyToken(token);
    if (!result.valid) {
        res.status(401).json({
            error: '未授权：令牌无效或已过期',
            code: 'AUTH_TOKEN_INVALID'
        });
        return;
    }
    req.username = result.username;
    next();
}
export function optionalAuthMiddleware(req, res, next) {
    const config = getConfig();
    if (!config.authEnabled) {
        next();
        return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        next();
        return;
    }
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const authService = getAuthService();
        const result = authService.verifyToken(token);
        if (result.valid) {
            req.username = result.username;
        }
    }
    next();
}
export function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    res.status(500).json({
        code: 500,
        message: '内部服务器错误'
    });
}
export function notFoundHandler(req, res) {
    res.status(404).json({
        code: 404,
        message: '接口不存在'
    });
}
export function optionalAuthLogout(req, res, next) {
    next();
}
//# sourceMappingURL=middleware.js.map