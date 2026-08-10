import { NextFunction, Request, Response } from 'express';
import { throwAppError } from '@app-core/errors';
import { MESSAGES } from '@app-core/messages';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.id) {
        throwAppError(MESSAGES.COMMON.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    if (req.user.role !== 'admin') {
        throwAppError('Forbidden', 'FORBIDDEN');
    }

    next();
};
