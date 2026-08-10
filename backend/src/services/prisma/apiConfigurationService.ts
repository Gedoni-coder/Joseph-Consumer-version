// @ts-nocheck
/**
 * API Configuration Service
 * Handles external API keys and data source settings
 */

import { prisma } from '../../config/prisma.js';

// ==========================================
// API CONFIGURATION OPERATIONS
// ==========================================

/**
 * Get API configuration
 */
export async function getApiConfiguration(userId) {
  let config = await prisma.apiConfiguration.findUnique({
    where: { userId }
  });

  // Create if doesn't exist
  if (!config) {
    config = await prisma.apiConfiguration.create({
      data: { userId }
    });
  }

  return config;
}

/**
 * Update API configuration
 */
export async function updateApiConfiguration(userId, data) {
  const {
    newsApiKey,
    fmdqApiKey,
    commoditiesApiKey,
    cbnApiKey,
    useRealAPIs,
    useBackendAPI,
    dataRefreshInterval
  } = data;

  return await prisma.apiConfiguration.upsert({
    where: { userId },
    update: {
      ...(newsApiKey !== undefined && { newsApiKey }),
      ...(fmdqApiKey !== undefined && { fmdqApiKey }),
      ...(commoditiesApiKey !== undefined && { commoditiesApiKey }),
      ...(cbnApiKey !== undefined && { cbnApiKey }),
      ...(useRealAPIs !== undefined && { useRealAPIs }),
      ...(useBackendAPI !== undefined && { useBackendAPI }),
      ...(dataRefreshInterval !== undefined && { dataRefreshInterval })
    },
    create: {
      userId,
      newsApiKey: newsApiKey || null,
      fmdqApiKey: fmdqApiKey || null,
      commoditiesApiKey: commoditiesApiKey || null,
      cbnApiKey: cbnApiKey || null,
      useRealAPIs: useRealAPIs ?? true,
      useBackendAPI: useBackendAPI ?? true,
      dataRefreshInterval: dataRefreshInterval ?? 3600
    }
  });
}

/**
 * Update specific API key
 */
export async function updateApiKey(userId, keyType, apiKey) {
  const updateData = {};
  updateData[keyType + 'ApiKey'] = apiKey;

  return await prisma.apiConfiguration.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      ...updateData
    }
  });
}

/**
 * Get API key by type
 */
export async function getApiKey(userId, keyType) {
  const config = await getApiConfiguration(userId);
  return config[`${keyType}ApiKey`] || null;
}

/**
 * Toggle data source
 */
export async function toggleDataSource(userId, source) {
  if (source === 'real') {
    return await prisma.apiConfiguration.upsert({
      where: { userId },
      update: { useRealAPIs: true },
      create: { userId, useRealAPIs: true }
    });
  } else if (source === 'backend') {
    return await prisma.apiConfiguration.upsert({
      where: { userId },
      update: { useBackendAPI: true },
      create: { userId, useBackendAPI: true }
    });
  }
}

/**
 * Delete API key
 */
export async function deleteApiKey(userId, keyType) {
  const updateData = {};
  updateData[keyType + 'ApiKey'] = null;

  return await prisma.apiConfiguration.update({
    where: { userId },
    data: updateData
  });
}
