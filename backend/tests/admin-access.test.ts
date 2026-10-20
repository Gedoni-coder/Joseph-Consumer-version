import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { database, updateIndicator } = vi.hoisted(() => ({
    database: { user: { findUnique: vi.fn(), update: vi.fn() }, userSession: { findUnique: vi.fn() } },
    updateIndicator: vi.fn(async (_req, res) => res.json({ success: true }))
}));

vi.mock('../src/config/prisma', () => ({ prisma: database }));
vi.mock('../src/controllers/adminController', () => ({
    ...Object.fromEntries([
        'batchUpdateIndicators', 'refreshFromSources', 'getUpdateStats', 'getAllIndicators',
        'getThresholdSettings', 'updateThresholdSettings', 'setCustomThreshold',
        'removeCustomThreshold', 'toggleRule', 'getDataSources', 'updateDataSource',
        'getTemplates', 'getTemplate', 'upsertTemplate', 'deleteTemplate', 'resetTemplate',
        'previewTemplate', 'seedIndustryTemplates'
    ].map(name => [name, vi.fn()])),
    updateIndicator
}));

process.env.JWT_SECRET = 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters';

const { default: adminRoutes } = await import('../src/routes/admin');
const { generateAccessToken } = await import('../src/config/jwt');
const { sendNormalizedError } = await import('../src/utils/service-error.utils');

describe('admin HTTP authorization boundary', () => {
    let server: Server;
    let url: string;

    beforeEach(async () => {
        vi.clearAllMocks();
        database.userSession.findUnique.mockImplementation(async ({ where }) => ({
            id: where.id, userId: where.id, revokedAt: null,
            expiresAt: new Date(Date.now() + 60000)
        }));
        const app = express();
        app.use(express.json());
        app.use('/api/admin', adminRoutes);
        app.use((err, _req, res, _next) => sendNormalizedError(res, err));
        server = app.listen(0, '127.0.0.1');
        await new Promise<void>(resolve => server.once('listening', resolve));
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterEach(async () => {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    });

    const request = (url: string, token?: string) => fetch(`${url}/api/admin/indicators/TEST`, {
        method: 'PUT', headers: {
            'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {})
        }, body: JSON.stringify({ value: 20 })
    });

    it('rejects anonymous mutations before reaching the controller', async () => {
        expect((await request(url)).status).toBe(401);
        expect(updateIndicator).not.toHaveBeenCalled();
    });

    it('rejects ordinary users even when the signed token claims admin', async () => {
        database.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'user', isActive: true });
        const token = generateAccessToken({ userId: 'user-1', sessionId: 'user-1', role: 'admin' });
        expect((await request(url, token)).status).toBe(403);
        expect(updateIndicator).not.toHaveBeenCalled();
    });

    it('allows the mutation for an active database-confirmed administrator', async () => {
        database.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'admin', isActive: true });
        const token = generateAccessToken({ userId: 'admin-1', sessionId: 'admin-1' });
        expect((await request(url, token)).status).toBe(200);
        expect(updateIndicator).toHaveBeenCalledOnce();
    });

    it('rejects a disabled administrator', async () => {
        database.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'admin', isActive: false });
        expect((await request(url, generateAccessToken({ userId: 'admin-1', sessionId: 'admin-1' }))).status).toBe(401);
        expect(updateIndicator).not.toHaveBeenCalled();
    });
});

// SR
