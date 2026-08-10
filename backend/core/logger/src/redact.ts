export type RedactFactoryOptions = {
    fieldsToRedact?: string[];
    mask?: string;
};

const DEFAULT_FIELDS_TO_REDACT = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'secret',
    'pinHash',
    'jwt'
];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const shouldRedact = (keyPath: string, fieldsToRedact: string[]) => {
    const keyName = keyPath.split('.').pop() ?? keyPath;
    return fieldsToRedact.includes(keyPath) || fieldsToRedact.includes(keyName);
};

const cloneAndRedact = (
    value: unknown,
    fieldsToRedact: string[],
    mask: string,
    currentPath = ''
): unknown => {
    if (Array.isArray(value)) {
        return value.map((item, index) =>
            cloneAndRedact(item, fieldsToRedact, mask, currentPath ? `${currentPath}.${index}` : String(index))
        );
    }

    if (!isPlainObject(value)) {
        return value;
    }

    return Object.entries(value).reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
        const nextPath = currentPath ? `${currentPath}.${key}` : key;

        if (shouldRedact(nextPath, fieldsToRedact)) {
            accumulator[key] = mask;
            return accumulator;
        }

        accumulator[key] = cloneAndRedact(entry, fieldsToRedact, mask, nextPath);
        return accumulator;
    }, {});
};

export const redactFactory = (options: RedactFactoryOptions = {}) => {
    const fieldsToRedact = options.fieldsToRedact ?? DEFAULT_FIELDS_TO_REDACT;
    const mask = options.mask ?? '[REDACTED]';

    return (data: unknown) => cloneAndRedact(data, fieldsToRedact, mask);
};
