import { createHash, randomUUID } from 'node:crypto';
import type { Prisma, User, UserSession } from '@prisma/client';
import { createAppError } from '@app-core/errors';
import { prisma } from '../../config/prisma';
import { generateTokenPair, verifyRefreshToken } from '../../config/jwt';

type DeviceInfo = { deviceId?: string; userAgent?: string; ip?: string };
type VerifiedUser = Pick<User, 'id' | 'email'> & Partial<Pick<User, 'password'>>;
type RefreshClaims = { userId: string; tokenId: string; sessionId: string };
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const invalidSession = () => createAppError('Invalid or expired session. Please sign in again.', 'UNAUTHORIZED');
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const bounded = (value: unknown, length: number) => typeof value === 'string' ? value.slice(0, length) : undefined;

/** Every auth mutation takes this PostgreSQL user-row lock first, so a
 * concurrent refresh cannot escape logout-all or a password change. */
export const withLockedUser = <T>(
    userId: string,
    operation: (tx: Prisma.TransactionClient, user: User) => Promise<T>
): Promise<T> => prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw invalidSession();
    return operation(tx, user);
});

const issueTokens = async (
    tx: Prisma.TransactionClient, user: User, session: UserSession, parentId?: string
) => {
    const tokenId = randomUUID();
    const pair = generateTokenPair(
        { userId: user.id, email: user.email, sessionId: session.id }, tokenId, session.expiresAt
    );
    // Preserve the existing column name; store a digest, never a bearer token.
    await tx.refreshToken.create({ data: {
        id: tokenId, userId: user.id, sessionId: session.id, parentId,
        token: hashToken(pair.refreshToken), expiresAt: session.expiresAt
    } });
    return pair;
};

/** Linking/OTP proof consumption can share the issuance transaction. */
export const createAuthSession = (
    verifiedUser: VerifiedUser, device: DeviceInfo = {},
    consumeProof?: (tx: Prisma.TransactionClient, user: User) => Promise<void>
) => withLockedUser(verifiedUser.id, async (tx, user) => {
    // Reject a login verified just before a concurrent password reset.
    if (verifiedUser.password !== undefined && verifiedUser.password !== user.password) throw invalidSession();
    if (consumeProof) await consumeProof(tx, user);
    const now = new Date();
    const session = await tx.userSession.create({ data: {
        userId: user.id, expiresAt: new Date(now.getTime() + SESSION_LIFETIME_MS),
        deviceInfo: bounded(device.deviceId, 256), userAgent: bounded(device.userAgent, 1024),
        ipAddress: bounded(device.ip, 128)
    } });
    const pair = await issueTokens(tx, user, session);
    await tx.user.update({ where: { id: user.id }, data: { lastLogin: now, lastActivity: now } });
    return pair;
});

const refreshClaims = (token: string): RefreshClaims => {
    try {
        const value = verifyRefreshToken(token);
        if (!value || typeof value === 'string' ||
            typeof value.userId !== 'string' || typeof value.tokenId !== 'string' ||
            typeof value.sessionId !== 'string') throw invalidSession();
        return value as RefreshClaims;
    } catch { throw invalidSession(); }
};

const revokeFamily = async (tx: Prisma.TransactionClient, userId: string, sessionId: string) => {
    const now = new Date();
    await tx.userSession.updateMany({
        where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: now }
    });
    await tx.refreshToken.updateMany({
        where: { userId, sessionId, revokedAt: null }, data: { revokedAt: now }
    });
};

export const rotateAuthSession = async (token: string) => {
    const claims = refreshClaims(token);
    const pair = await withLockedUser(claims.userId, async (tx, user) => {
        const record = await tx.refreshToken.findUnique({ where: { id: claims.tokenId } });
        if (!record || record.userId !== user.id || record.sessionId !== claims.sessionId ||
            record.token !== hashToken(token)) return null;
        const session = await tx.userSession.findUnique({ where: { id: claims.sessionId } });
        if (!session || session.userId !== user.id || session.revokedAt || session.expiresAt <= new Date()) return null;
        if (record.revokedAt) {
            // Throw only after commit: throwing here would roll back revocation.
            await revokeFamily(tx, user.id, session.id);
            return null;
        }
        if (record.expiresAt <= new Date()) return null;
        const now = new Date();
        await tx.refreshToken.update({ where: { id: record.id }, data: { revokedAt: now } });
        await tx.userSession.update({ where: { id: session.id }, data: { lastActive: now } });
        return issueTokens(tx, user, session, record.id);
    });
    if (!pair) throw invalidSession();
    return pair;
};

export const revokeAuthSession = async (userId: string, token: string) => {
    const claims = refreshClaims(token);
    if (claims.userId !== userId) throw invalidSession();
    return withLockedUser(userId, async tx => {
        const record = await tx.refreshToken.findUnique({ where: { id: claims.tokenId } });
        if (!record || record.userId !== userId || record.sessionId !== claims.sessionId ||
            record.token !== hashToken(token)) throw invalidSession();
        await revokeFamily(tx, userId, claims.sessionId);
    });
};

export const revokeUserSessionsInTransaction = async (tx: Prisma.TransactionClient, userId: string) => {
    const now = new Date();
    await tx.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
    await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
};

export const revokeAllAuthSessions = (userId: string) =>
    withLockedUser(userId, tx => revokeUserSessionsInTransaction(tx, userId));

export const hasActiveSession = async (userId: string, sessionId: unknown): Promise<boolean> => {
    if (typeof sessionId !== 'string' || !sessionId) return false;
    const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
    return Boolean(session && session.userId === userId && !session.revokedAt && session.expiresAt > new Date());
};

// SR
