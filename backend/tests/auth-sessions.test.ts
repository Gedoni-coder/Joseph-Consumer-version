import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthDatabase } from './helpers/auth-database';

const { db } = vi.hoisted(() => ({ db: {} as any }));
vi.mock('../src/config/prisma', () => ({ prisma: db }));
process.env.JWT_SECRET = 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters';
delete process.env.ACCESS_TOKEN_EXPIRES_IN;
delete process.env.REFRESH_TOKEN_EXPIRES_IN;

const sessions = await import('../src/services/prisma/authSessionService');
const { decodeToken, generateRefreshToken } = await import('../src/config/jwt');
const auth = await import('../src/services/prisma/authService');

describe('persisted authentication sessions', () => {
    let fixture: ReturnType<typeof createAuthDatabase>;
    let user: any;
    beforeEach(async () => {
        fixture = createAuthDatabase();
        Object.assign(db, fixture.database);
        user = await db.user.create({ data: { id: 'user-1', email: 'one@example.test', password: 'hash-one' } });
    });

    it('persists only a digest with 15-minute access and a seven-day session family', async () => {
        const pair = await sessions.createAuthSession(user);
        const access = decodeToken(pair.accessToken);
        const refresh = decodeToken(pair.refreshToken);
        const record = fixture.all('refreshToken')[0];
        expect(record.token).toBe(createHash('sha256').update(pair.refreshToken).digest('hex'));
        expect(record.token).not.toBe(pair.refreshToken);
        expect(access.exp - access.iat).toBe(900);
        expect(refresh.exp - refresh.iat).toBe(7 * 86400);
        expect(access.sessionId).toBe(refresh.sessionId);
        expect(record.id).toBe(refresh.tokenId);
        expect(db.$queryRaw).toHaveBeenCalledOnce();
    });

    it('rotates once, records lineage and preserves the absolute family expiry', async () => {
        const first = await sessions.createAuthSession(user);
        const second = await sessions.rotateAuthSession(first.refreshToken);
        const a = decodeToken(first.refreshToken), b = decodeToken(second.refreshToken);
        expect(b.tokenId).not.toBe(a.tokenId);
        expect(b.sessionId).toBe(a.sessionId);
        expect(b.exp).toBe(a.exp);
        expect(fixture.all('refreshToken').find(r => r.id === a.tokenId).revokedAt).toBeInstanceOf(Date);
        expect(fixture.all('refreshToken').find(r => r.id === b.tokenId).parentId).toBe(a.tokenId);
    });

    it('commits family revocation when an old token is replayed', async () => {
        const first = await sessions.createAuthSession(user);
        const second = await sessions.rotateAuthSession(first.refreshToken);
        await expect(sessions.rotateAuthSession(first.refreshToken)).rejects.toMatchObject({ errorCode: 'UNAUTHORIZED' });
        expect(fixture.all('userSession')[0].revokedAt).toBeInstanceOf(Date);
        await expect(sessions.rotateAuthSession(second.refreshToken)).rejects.toThrow();
        expect(await sessions.hasActiveSession(user.id, decodeToken(second.accessToken).sessionId)).toBe(false);
    });

    it('rejects an unknown, tampered, or unbound legacy refresh token', async () => {
        const legacy = generateRefreshToken({ userId: user.id, tokenId: 'old' });
        await expect(sessions.rotateAuthSession(legacy)).rejects.toThrow();
        const pair = await sessions.createAuthSession(user);
        await expect(sessions.rotateAuthSession(pair.refreshToken + 'tampered')).rejects.toThrow();
        const unknown = generateRefreshToken({ userId: user.id, tokenId: 'missing', sessionId: decodeToken(pair.accessToken).sessionId });
        await expect(sessions.rotateAuthSession(unknown)).rejects.toThrow();
        expect(fixture.all('userSession')[0].revokedAt).toBeNull();
    });

    it('logs out one family without revoking another device', async () => {
        const one = await sessions.createAuthSession(user), two = await sessions.createAuthSession(user);
        await sessions.revokeAuthSession(user.id, one.refreshToken);
        await expect(sessions.rotateAuthSession(one.refreshToken)).rejects.toThrow();
        await expect(sessions.rotateAuthSession(two.refreshToken)).resolves.toHaveProperty('accessToken');
        expect(await sessions.hasActiveSession(user.id, decodeToken(one.accessToken).sessionId)).toBe(false);
    });

    it('does not permit one account to revoke another account session', async () => {
        const pair = await sessions.createAuthSession(user);
        await expect(sessions.revokeAuthSession('other-user', pair.refreshToken)).rejects.toThrow();
        expect(fixture.all('userSession')[0].revokedAt).toBeNull();
    });

    it('revokes every device on logout-all', async () => {
        const one = await sessions.createAuthSession(user), two = await sessions.createAuthSession(user);
        await sessions.revokeAllAuthSessions(user.id);
        await expect(sessions.rotateAuthSession(one.refreshToken)).rejects.toThrow();
        await expect(sessions.rotateAuthSession(two.refreshToken)).rejects.toThrow();
        expect(fixture.all('refreshToken').every(r => r.revokedAt)).toBe(true);
    });

    it('rejects inactive users and expired persisted sessions', async () => {
        const pair = await sessions.createAuthSession(user);
        const sessionId = decodeToken(pair.accessToken).sessionId;
        await db.userSession.update({ where: { id: sessionId }, data: { expiresAt: new Date(0) } });
        await expect(sessions.rotateAuthSession(pair.refreshToken)).rejects.toThrow();
        expect(await sessions.hasActiveSession(user.id, sessionId)).toBe(false);
        await db.user.update({ where: { id: user.id }, data: { isActive: false } });
        await expect(sessions.createAuthSession(user)).rejects.toThrow();
    });

    it('rolls back consumption if writing the successor fails', async () => {
        const pair = await sessions.createAuthSession(user);
        db.refreshToken.create.mockRejectedValueOnce(new Error('simulated storage failure'));
        await expect(sessions.rotateAuthSession(pair.refreshToken)).rejects.toThrow('simulated storage failure');
        expect(fixture.all('refreshToken')[0].revokedAt).toBeNull();
        await expect(sessions.rotateAuthSession(pair.refreshToken)).resolves.toHaveProperty('refreshToken');
    });

    it('concurrent refresh attempts produce one successor and then revoke the replayed family', async () => {
        const pair = await sessions.createAuthSession(user);
        const result = await Promise.allSettled([
            sessions.rotateAuthSession(pair.refreshToken), sessions.rotateAuthSession(pair.refreshToken)
        ]);
        expect(result.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        expect(result.filter(r => r.status === 'rejected')).toHaveLength(1);
        expect(fixture.all('refreshToken')).toHaveLength(2);
        expect(fixture.all('userSession')[0].revokedAt).toBeInstanceOf(Date);
    });

    it('a concurrent logout-all leaves no refresh successor active', async () => {
        const pair = await sessions.createAuthSession(user);
        await Promise.allSettled([sessions.rotateAuthSession(pair.refreshToken), sessions.revokeAllAuthSessions(user.id)]);
        expect(fixture.all('userSession').every(s => s.revokedAt)).toBe(true);
        expect(fixture.all('refreshToken').every(t => t.revokedAt)).toBe(true);
    });

    it('rejects credentials verified before a concurrent password change', async () => {
        await db.user.update({ where: { id: user.id }, data: { password: 'changed-hash' } });
        await expect(sessions.createAuthSession(user)).rejects.toThrow();
        expect(fixture.all('userSession')).toHaveLength(0);
    });

    it('consumes a one-time linking proof atomically with session issuance', async () => {
        await db.user.update({ where: { id: user.id }, data: { whatsappLinkToken: 'synthetic-proof' } });
        const consume = async (tx, current) => {
            if (!current.whatsappLinkToken) throw new Error('proof consumed');
            await tx.user.update({ where: { id: user.id }, data: { whatsappLinkToken: null } });
        };
        const results = await Promise.allSettled([
            sessions.createAuthSession(user, {}, consume), sessions.createAuthSession(user, {}, consume)
        ]);
        expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        expect(fixture.all('userSession')).toHaveLength(1);
    });

    it('a password reset is one-time and revokes all existing sessions', async () => {
        const pair = await sessions.createAuthSession(user);
        const reset = await auth.generatePasswordReset(user.email);
        await auth.resetPasswordWithToken(reset.token, 'NewPassword123!');
        await expect(auth.resetPasswordWithToken(reset.token, 'AnotherPassword123!')).rejects.toThrow('INVALID_OR_EXPIRED_TOKEN');
        await expect(sessions.rotateAuthSession(pair.refreshToken)).rejects.toThrow();
        expect(fixture.all('user')[0].resetPasswordToken).toBeNull();
        expect((await auth.verifyCredentials(user.email, 'NewPassword123!')).id).toBe(user.id);
    });
});

// SR
