/**
 * @readonly
 * @enum {string}
 */
export const LOG_TYPE = {
    LOG: 'log',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
} as const;

export type LogType = (typeof LOG_TYPE)[keyof typeof LOG_TYPE];
