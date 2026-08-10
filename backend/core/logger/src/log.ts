import logClient from './log-client';
import { LOG_TYPE, type LogType } from './constants';
import { redactFactory, type RedactFactoryOptions } from './redact';

const defaultRedactor = redactFactory();

export type LogOptions = {
    redact?: string[] | RedactFactoryOptions;
};

const redact = (data: unknown, options?: LogOptions['redact']) => {
    if (!options) {
        return defaultRedactor(data);
    }

    if (Array.isArray(options)) {
        return redactFactory({ fieldsToRedact: options })(data);
    }

    return redactFactory(options)(data);
};

const normalizeData = (data: unknown): Record<string, unknown> => {
    if (data instanceof Error) {
        return {
            errorMessage: data.message,
            errorStack: data.stack,
            _raw: data
        };
    }

    if (typeof data === 'object' && data !== null) {
        return data as Record<string, unknown>;
    }

    return { value: data };
};

type LogMethod = (data: unknown, optionalKey?: string, options?: LogOptions) => void;

type AppLogger = LogMethod & {
    info: LogMethod;
    warn: LogMethod;
    error: LogMethod;
    errorX: LogMethod;
};

const _log = (type: LogType, data: unknown, optionalKey = 'APP-LOG', options: LogOptions = {}) => {
    const redactedData = redact(data, options.redact);
    const payload = normalizeData(redactedData);

    logClient[type](payload, String(optionalKey));
};

const appLogger = ((data: unknown, optionalKey?: string, options?: LogOptions) =>
    _log(LOG_TYPE.LOG, data, optionalKey, options)) as AppLogger;

appLogger.info = (data: unknown, optionalKey?: string, options?: LogOptions) =>
    _log(LOG_TYPE.INFO, data, optionalKey, options);

appLogger.warn = (data: unknown, optionalKey?: string, options?: LogOptions) =>
    _log(LOG_TYPE.WARN, data, optionalKey, options);

appLogger.error = (data: unknown, optionalKey?: string, options?: LogOptions) =>
    _log(LOG_TYPE.ERROR, data, optionalKey, options);

appLogger.errorX = (data: unknown, optionalKey?: string, options?: LogOptions) =>
    _log(LOG_TYPE.ERROR, data instanceof Error ? data : { errorMessage: data }, optionalKey, options);

export default appLogger;
export { redact };
