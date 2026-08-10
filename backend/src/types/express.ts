declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                role?: 'admin' | 'user';
                [key: string]: unknown;
            };
            userId?: string;
            resource?: {
                userId?: string;
                [key: string]: unknown;
            };
            validatedBody?: unknown;
            validatedParams?: unknown;
            validatedQuery?: unknown;
        }
    }
}

export {};
