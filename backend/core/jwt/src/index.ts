import crypto from 'crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { throwAppError } from '@app-core/errors';

export type AccessTokenPayload = {
    userId: string;
    email: string;
};

export type RefreshJwtPayload = {
    userId: string;
    tokenId: string;
};

export type LegacyAuthPayload = {
    id: string;
    email: string;
};

export type DecodedToken = JwtPayload | string | null;

export const ACCESS_TOKEN_ISSUER = 'joseph-ai';
export const ACCESS_TOKEN_AUDIENCE = 'joseph-ai-users';
export const REFRESH_TOKEN_ISSUER = 'joseph-ai';
export const REFRESH_TOKEN_AUDIENCE = 'joseph-ai-refresh';
export const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '15m';
export const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = '7d';
export const JWT_ALGORITHM = 'HS256';

export const JWT_CONFIG = {
    get ACCESS_TOKEN_SECRET() {
        return process.env.JWT_SECRET;
    },
    get REFRESH_TOKEN_SECRET() {
        return process.env.JWT_REFRESH_SECRET;
    },
    get ACCESS_TOKEN_EXPIRES_IN() {
        return (process.env.ACCESS_TOKEN_EXPIRES_IN ||
            DEFAULT_ACCESS_TOKEN_EXPIRES_IN) as SignOptions['expiresIn'];
    },
    get REFRESH_TOKEN_EXPIRES_IN() {
        return (process.env.REFRESH_TOKEN_EXPIRES_IN ||
            process.env.JWT_REFRESH_EXPIRES_IN ||
            DEFAULT_REFRESH_TOKEN_EXPIRES_IN) as SignOptions['expiresIn'];
    },
};

const getSecret = (value: string | undefined, name: string): string => {
    if (!value) {
        throwAppError(`${name} is not configured`, 'AUTH_ERROR');
    }

    if (value.length < 32) {
        throwAppError(`${name} must be at least 32 characters`, 'AUTH_ERROR');
    }

    return value;
};

const getAccessTokenSecret = () => getSecret(JWT_CONFIG.ACCESS_TOKEN_SECRET, 'JWT_SECRET');

const getRefreshTokenSecret = () => getSecret(JWT_CONFIG.REFRESH_TOKEN_SECRET, 'JWT_REFRESH_SECRET');

export const generateAccessToken = (payload: AccessTokenPayload): string =>
    jwt.sign(payload, getAccessTokenSecret(), {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
        algorithm: JWT_ALGORITHM,
    });

export const generateRefreshToken = (payload: RefreshJwtPayload): string =>
    jwt.sign(payload, getRefreshTokenSecret(), {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
        issuer: REFRESH_TOKEN_ISSUER,
        audience: REFRESH_TOKEN_AUDIENCE,
        algorithm: JWT_ALGORITHM,
    });

export const generateTokenPair = (
    userPayload: AccessTokenPayload,
    tokenId: string
): { accessToken: string; refreshToken: string; expiresIn: SignOptions['expiresIn'] } => ({
    accessToken: generateAccessToken({
        userId: userPayload.userId,
        email: userPayload.email,
    }),
    refreshToken: generateRefreshToken({
        userId: userPayload.userId,
        tokenId,
    }),
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
});

export const verifyAccessToken = (token: string): JwtPayload | string => {
    try {
        return jwt.verify(token, getAccessTokenSecret(), {
            issuer: ACCESS_TOKEN_ISSUER,
            audience: ACCESS_TOKEN_AUDIENCE,
            algorithms: [JWT_ALGORITHM],
        });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Access token expired');
        }

        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid access token');
        }

        throw error;
    }
};

export const verifyRefreshToken = (token: string): JwtPayload | string => {
    try {
        return jwt.verify(token, getRefreshTokenSecret(), {
            issuer: REFRESH_TOKEN_ISSUER,
            audience: REFRESH_TOKEN_AUDIENCE,
            algorithms: [JWT_ALGORITHM],
        });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }

        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }

        throw error;
    }
};

export const decodeToken = (token: string): DecodedToken => jwt.decode(token);

export const isTokenExpired = (token: string): boolean => {
    const decoded = decodeToken(token);

    if (!decoded || typeof decoded === 'string' || !decoded.exp) {
        return true;
    }

    return Date.now() >= decoded.exp * 1000;
};

export const getTokenExpiresIn = (token: string): number | null => {
    const decoded = decodeToken(token);

    if (!decoded || typeof decoded === 'string' || !decoded.exp) {
        return null;
    }

    const expiresIn = decoded.exp * 1000 - Date.now();
    return Math.max(0, Math.floor(expiresIn / 1000));
};

export const generateTokenId = (): string => crypto.randomUUID();

export const generateOpaqueToken = (): string => crypto.randomBytes(32).toString('base64url');

export const hashToken = (token: string): string =>
    crypto.createHash('sha256').update(token).digest('hex');

export const extractTokenFromHeader = (authHeader?: string): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.substring(7);
};

export const signJwt = (payload: LegacyAuthPayload): string =>
    jwt.sign(payload, getAccessTokenSecret(), {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
        algorithm: JWT_ALGORITHM,
    });

export const verifyJwt = (token: string): LegacyAuthPayload =>
    jwt.verify(token, getAccessTokenSecret(), {
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
        algorithms: [JWT_ALGORITHM],
    }) as LegacyAuthPayload;

export default {
    JWT_CONFIG,
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    isTokenExpired,
    getTokenExpiresIn,
    generateTokenId,
    generateOpaqueToken,
    hashToken,
    extractTokenFromHeader,
    signJwt,
    verifyJwt,
};
