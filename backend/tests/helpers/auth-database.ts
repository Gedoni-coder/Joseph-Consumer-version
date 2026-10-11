import { randomUUID } from 'node:crypto';
import { vi } from 'vitest';

/** Transactional in-memory test double. Exercises application behavior, not
 * PostgreSQL locking/isolation; a separate database rollout check is required. */
export const createAuthDatabase = () => {
    let tables: Record<string, Map<string, any>> = {
        user: new Map(), userSession: new Map(), refreshToken: new Map()
    };
    let tail = Promise.resolve();
    const matches = (row: any, where: any = {}) => Object.entries(where).every(([key, value]) => {
        if (value === undefined) return true;
        if (value === null) return row[key] == null;
        if (key === 'OR') return (value as any[]).some(w => matches(row, w));
        if (typeof value === 'object' && !(value instanceof Date)) {
            return Object.entries(value as object).every(([op, operand]) => {
                if (op === 'gt') return row[key] > operand;
                if (op === 'not') return row[key] !== operand;
                throw new Error(`Unsupported fixture query operator: ${op}`);
            });
        }
        return row[key] === value;
    });
    const database: any = {};
    for (const name of Object.keys(tables)) {
        const find = (where: any) => [...tables[name].values()].find(r => matches(r, where)) ?? null;
        database[name] = {
            findUnique: vi.fn(async ({ where }) => structuredClone(find(where))),
            findFirst: vi.fn(async ({ where }) => structuredClone(find(where))),
            create: vi.fn(async ({ data }) => {
                const row = { id: randomUUID(), createdAt: new Date(), revokedAt: null,
                    isActive: true, role: 'user', ...data };
                tables[name].set(row.id, row);
                return structuredClone(row);
            }),
            update: vi.fn(async ({ where, data }) => {
                const row = find(where);
                if (!row) throw new Error('Record not found');
                Object.assign(row, data);
                return structuredClone(row);
            }),
            updateMany: vi.fn(async ({ where, data }) => {
                let count = 0;
                for (const row of tables[name].values()) {
                    if (matches(row, where)) { Object.assign(row, data); count++; }
                }
                return { count };
            })
        };
    }
    database.$queryRaw = vi.fn(async () => []);
    database.$transaction = vi.fn(async (callback: (tx: any) => any) => {
        const previous = tail;
        let release: () => void;
        tail = new Promise<void>(resolve => { release = resolve; });
        await previous;
        const snapshot = structuredClone(tables);
        try { return await callback(database); }
        catch (error) { tables = snapshot; throw error; }
        finally { release!(); }
    });
    return { database, all: (table: string) => [...tables[table].values()].map(row => structuredClone(row)) };
};
