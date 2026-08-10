type RateLimitConfig = {
    apiWindowMs: number;
    apiMax: number;
    trustProxy: number | boolean;
};

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
    if (!value) {
        return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseTrustProxy = (value: string | undefined): number | boolean => {
    if (!value) {
        return false;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
        return true;
    }

    if (normalized === 'false') {
        return false;
    }

    const parsed = Number.parseInt(normalized, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : false;
};

export const getRateLimitConfig = (): RateLimitConfig => ({
    apiWindowMs: parsePositiveInteger(process.env.RATE_LIMIT_API_WINDOW_MS, 60 * 1000),
    apiMax: parsePositiveInteger(process.env.RATE_LIMIT_API_MAX, 180),
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY)
});
