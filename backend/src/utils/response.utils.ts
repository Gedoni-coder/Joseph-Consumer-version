import type { Response } from 'express';
import { MESSAGES } from '@app-core/messages';
import type { ApiResponse } from '../types/index.js';

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message: string = MESSAGES.COMMON.SUCCESS,
    statusCode: number = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message
    };
    return res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    message: string,
    code: string = 'ERROR',
    statusCode: number = 500,
    details?: unknown
): Response => {
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
            details
        }
    };
    return res.status(statusCode).json(response);
};
