import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthDatabase } from './helpers/auth-database';

const { db } = vi.hoisted(() => ({ db: {} as any }));
vi.mock('../src/config/prisma', () => ({ prisma: db }));
process.env.JWT_SECRET = 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters';

const { default: authRoutes } = await import('../src/routes/auth');
const { default: whatsappRoutes } = await import('../src/routes/whatsapp');
const { sendNormalizedError } = await import('../src/utils/service-error.utils');
const auth = await import('../src/services/prisma/authService');

describe('authentication HTTP flows with transactional database double', () => {
    let server: Server;
    let url: string;
    beforeEach(async () => {
        Object.assign(db, createAuthDatabase().database);
        const app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
        app.use('/api/whatsapp', whatsappRoutes);
        app.use((err, _req, res, _next) => sendNormalizedError(res, err));
        server = app.listen(0, '127.0.0.1');
        await new Promise<void>(resolve => server.once('listening', resolve));
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });
    afterEach(async () => {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    });
    const post = async (path: string, body: object, accessToken?: string) => {
        const response = await fetch(url + path, { method: 'POST', headers: {
            'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }, body: JSON.stringify(body) });
        return { status: response.status, body: await response.json() };
    };
    const register = async (email = 'one@example.com') => {
        const result = await post('/api/auth/register', { email, name: 'Test User', password: 'Password123!' });
        expect(result.status).toBe(201);
        return result.body;
    };
    const me = (accessToken: string) => fetch(url + '/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    it('registers, rotates, logs out, and rejects both old access and refresh credentials', async () => {
        const user = await register();
        expect((await me(user.accessToken)).status).toBe(200);
        const refresh = await post('/api/auth/refresh', { refreshToken: user.refreshToken });
        expect(refresh.status).toBe(200);
        const logout = await post('/api/auth/logout', { refreshToken: refresh.body.refreshToken }, refresh.body.accessToken);
        expect(logout.status).toBe(200);
        expect((await me(user.accessToken)).status).toBe(401);
        expect((await post('/api/auth/refresh', { refreshToken: refresh.body.refreshToken })).status).toBe(401);
    });

    it('keeps accounts isolated when a caller submits somebody else\'s refresh token', async () => {
        const one = await register(), two = await register('two@example.com');
        expect((await post('/api/auth/logout', { refreshToken: two.refreshToken }, one.accessToken)).status).toBe(401);
        expect((await me(two.accessToken)).status).toBe(200);
        expect((await me(one.accessToken)).status).toBe(200);
    });

    it('logs out all devices without requiring a refresh-token body', async () => {
        const one = await register();
        const two = await post('/api/auth/login', { email: 'one@example.com', password: 'Password123!' });
        expect(two.status).toBe(200);
        expect((await post('/api/auth/logout', { logoutAll: true }, one.accessToken)).status).toBe(200);
        expect((await me(two.body.accessToken)).status).toBe(401);
    });

    it('a password change revokes every session and requires the new password', async () => {
        const user = await register();
        const other = await post('/api/auth/login', { email: 'one@example.com', password: 'Password123!' });
        const changed = await post('/api/auth/change-password', {
            currentPassword: 'Password123!', newPassword: 'ChangedPassword456!'
        }, user.accessToken);
        expect(changed.status).toBe(200);
        expect((await me(other.body.accessToken)).status).toBe(401);
        expect((await post('/api/auth/login', { email: 'one@example.com', password: 'Password123!' })).status).toBe(401);
        expect((await post('/api/auth/login', { email: 'one@example.com', password: 'ChangedPassword456!' })).status).toBe(200);
    });

    it('rejects malformed and weak password changes without revoking a valid session', async () => {
        const user = await register();
        expect((await post('/api/auth/change-password', {
            currentPassword: 'Password123!', newPassword: 'weak'
        }, user.accessToken)).status).toBe(400);
        expect((await post('/api/auth/refresh', {})).status).toBe(400);
        expect((await post('/api/auth/reset-password', { token: 'invalid', newPassword: 'Password123!' })).status).toBe(400);
        expect((await me(user.accessToken)).status).toBe(200);
    });

    it('resets once, invalidates existing sessions and exposes no reset credential in the public response', async () => {
        const user = await register();
        const request = await post('/api/auth/request-password-reset', { email: 'one@example.com' });
        expect(request.status).toBe(200);
        expect(request.body).not.toHaveProperty('resetToken');
        // Delivery is a separate, still-unimplemented provider boundary.
        const reset = await auth.generatePasswordReset('one@example.com');
        const payload = { token: reset.token, newPassword: 'ChangedPassword456!' };
        const results = await Promise.all([post('/api/auth/reset-password', payload), post('/api/auth/reset-password', payload)]);
        expect(results.map(r => r.status).sort()).toEqual([200, 400]);
        expect((await me(user.accessToken)).status).toBe(401);
    });

    it('WhatsApp linking issues a bound session that uses the same refresh and logout lifecycle', async () => {
        const user = await register();
        const link = await post('/api/whatsapp/link/generate', {}, user.accessToken);
        expect(link.status).toBe(200);
        const payload = { phone: '2348012345678', token: link.body.data.token };
        const verified = await post('/api/whatsapp/auth/verify-link-token', payload);
        expect(verified.status).toBe(200);
        expect((await me(verified.body.data.accessToken)).status).toBe(200);
        expect((await post('/api/whatsapp/auth/verify-link-token', payload)).status).toBe(404);
        const refreshed = await post('/api/auth/refresh', { refreshToken: verified.body.data.refreshToken });
        expect(refreshed.status).toBe(200);
        expect((await post('/api/auth/logout', { logoutAll: true }, user.accessToken)).status).toBe(200);
        expect((await me(refreshed.body.accessToken)).status).toBe(401);
    });
});
