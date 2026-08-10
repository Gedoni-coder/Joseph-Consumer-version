import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit';
import type { Request } from 'express';
import { appLogger } from '@app-core/logger';
import { sendError } from '../utils/response.utils';

type RateLimitKeyDetails = {
    key: string;
    keyType: 'ip' | 'user';
    userId?: string;
    ip?: string;
};

type CreateRateLimiterOptions = {
    name: string;
    windowMs: number;
    limit: number;
    keyDetails: (req: Request) => RateLimitKeyDetails;
    store?: Options['store'];
};

const RATE_LIMIT_MESSAGE = 'Too many requests. Please try again later.';

export const getDefaultRateLimitKeyDetails = (req: Request): RateLimitKeyDetails => {
    if (req.user?.id) {
        return {
            key: req.user.id,
            keyType: 'user',
            userId: req.user.id
        };
    }

    const ip = ipKeyGenerator(req.ip ?? 'unknown');
    return {
        key: ip,
        keyType: 'ip',
        ip
    };
};

export const createRateLimiter = ({
    name,
    windowMs,
    limit,
    keyDetails,
    store
}: CreateRateLimiterOptions) =>
    rateLimit({
        windowMs,
        limit,
        store,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        keyGenerator: (req) => keyDetails(req).key,
        handler: (req, res) => {
            const details = keyDetails(req);
            const retryAfter = Math.ceil(windowMs / 1000);

            res.setHeader('Retry-After', String(retryAfter));
            appLogger.warn(
                {
                    action: 'rate_limit_hit',
                    limiter: name,
                    keyType: details.keyType,
                    userId: details.userId,
                    ip: details.ip,
                    route: req.originalUrl,
                    timestamp: new Date().toISOString()
                },
                'RATE-LIMIT'
            );

            return sendError(res, RATE_LIMIT_MESSAGE, 'RATE_LIMIT_ERROR', 429);
        }
    });
