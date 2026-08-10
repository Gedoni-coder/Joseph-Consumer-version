import jwt, { type SignOptions } from 'jsonwebtoken';
import { throwAppError } from '@app-core/errors';
import { MESSAGES } from '@app-core/messages';

export type AuthPayload = {
    id: string;
    email: string;
};

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throwAppError(MESSAGES.AUTH.JWT_SECRET_NOT_CONFIGURED, 'AUTH_ERROR');
    }
    return secret;
};

const getJwtExpiry = (): SignOptions['expiresIn'] => {
    const value = process.env.JWT_EXPIRES_IN;
    return (value || '7d') as SignOptions['expiresIn'];
};

export const signJwt = (payload: AuthPayload) =>
    jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiry() });

export const verifyJwt = (token: string): AuthPayload =>
    jwt.verify(token, getJwtSecret()) as AuthPayload;
