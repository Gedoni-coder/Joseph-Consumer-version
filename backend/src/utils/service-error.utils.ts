import type { Response } from 'express';
import { ERROR_STATUS_CODE_MAPPING, isAppError, normalizeError } from '@app-core/errors';
import { MESSAGES } from '@app-core/messages';
import { sendError } from './response.utils.js';

const resolveStatusCode = (code: string) =>
    ERROR_STATUS_CODE_MAPPING[code as keyof typeof ERROR_STATUS_CODE_MAPPING] ?? 500;

export const sendNormalizedError = (res: Response, error: unknown) => {
    const normalizedError = normalizeError(error, {
        internalMessage: MESSAGES.COMMON.INTERNAL_SERVER_ERROR,
        invalidJsonMessage: MESSAGES.COMMON.REQUEST_FAILED,
        invalidJsonDetails: [MESSAGES.COMMON.REQUEST_FAILED]
    });

    return sendError(
        res,
        normalizedError.message,
        normalizedError.errorCode,
        resolveStatusCode(normalizedError.errorCode),
        normalizedError.details
    );
};

export { isAppError };
