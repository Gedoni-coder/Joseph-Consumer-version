import { prisma } from '../config/prisma';
import economicDataUpdater, { DATA_SOURCES } from '../services/prisma/economicDataUpdater';

export const updateIndicator = async (req, res) => {
  try {
    const { code } = req.params;
    const { value, source, metadata } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ success: false, message: 'Value is required' });
    }

    const result = await economicDataUpdater.updateIndicator(code, Number(value), source || 'ADMIN', metadata);
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json({
      success: true,
      message: `Indicator ${code} updated successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update indicator',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const batchUpdateIndicators = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'Updates must be an array' });
    }

    const results = [];
    const errors = [];
    for (const update of updates) {
      const result = await economicDataUpdater.updateIndicator(
        update.code,
        Number(update.value),
        update.source || 'ADMIN',
        update.metadata
      );
      if (result.success) results.push(result);
      else errors.push(result);
    }

    return res.json({
      success: true,
      message: `Updated ${results.length} indicators`,
      data: { updated: results.length, failed: errors.length, results, errors }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to batch update indicators',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const refreshFromSources = async (_req, res) => {
  const result = await economicDataUpdater.updateAllIndicators();
  return res.json({
    success: result.success,
    message: result.success ? 'Data refresh completed' : 'Data refresh completed with errors',
    data: result
  });
};

export const getUpdateStats = async (_req, res) =>
  res.json({
    success: true,
    data: {
      ...economicDataUpdater.getStats(),
      recentHistory: economicDataUpdater.getHistory(10)
    }
  });

export const getAllIndicators = async (req, res) => {
  const { category, source } = req.query;
  const indicators = await prisma.economicIndicator.findMany({
    where: {
      ...(category ? { category: String(category) } : {}),
      ...(source ? { source: String(source) } : {})
    },
    orderBy: [{ category: 'asc' }, { code: 'asc' }]
  });

  return res.json({ success: true, data: indicators });
};

const getDefaultThresholdSettings = () => ({
  customThresholds: {},
  notifyOnThreshold: true,
  notifyOnNewEvents: true,
  notificationMethods: ['in_app']
});

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (_error) {
    return fallback;
  }
};

export const getThresholdSettings = async (req, res) => {
  const userId = req.userId || req.user?.id;
  const settings = await prisma.userThresholdSettings.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });

  return res.json({
    success: true,
    data: {
      settings: {
        ...settings,
        customThresholds: parseJson(settings.customThresholds, {}),
        notificationMethods: parseJson(settings.notificationMethods, ['in_app'])
      },
      defaults: getDefaultThresholdSettings()
    }
  });
};

export const updateThresholdSettings = async (req, res) => {
  const userId = req.userId || req.user?.id;
  const updates = req.body;
  const settings = await prisma.userThresholdSettings.upsert({
    where: { userId },
    update: {
      ...(updates.customThresholds ? { customThresholds: JSON.stringify(updates.customThresholds) } : {}),
      ...(updates.notifyOnThreshold !== undefined ? { notifyOnThreshold: Boolean(updates.notifyOnThreshold) } : {}),
      ...(updates.notifyOnNewEvents !== undefined ? { notifyOnNewEvents: Boolean(updates.notifyOnNewEvents) } : {}),
      ...(updates.notificationMethods ? { notificationMethods: JSON.stringify(updates.notificationMethods) } : {})
    },
    create: {
      userId,
      customThresholds: updates.customThresholds ? JSON.stringify(updates.customThresholds) : undefined,
      notifyOnThreshold: updates.notifyOnThreshold ?? true,
      notifyOnNewEvents: updates.notifyOnNewEvents ?? true,
      notificationMethods: updates.notificationMethods ? JSON.stringify(updates.notificationMethods) : '["in_app"]'
    }
  });

  return res.json({ success: true, message: 'Threshold settings updated', data: settings });
};

export const setCustomThreshold = async (req, res) => {
  const userId = req.userId || req.user?.id;
  const { indicatorCode } = req.params;
  const existing = await prisma.userThresholdSettings.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });
  const thresholds = parseJson<Record<string, unknown>>(existing.customThresholds, {});
  thresholds[indicatorCode] = req.body;

  await prisma.userThresholdSettings.update({
    where: { userId },
    data: { customThresholds: JSON.stringify(thresholds) }
  });

  return res.json({
    success: true,
    message: `Custom threshold set for ${indicatorCode}`,
    data: { indicatorCode, threshold: req.body }
  });
};

export const removeCustomThreshold = async (req, res) => {
  const userId = req.userId || req.user?.id;
  const { indicatorCode } = req.params;
  const existing = await prisma.userThresholdSettings.findUnique({ where: { userId } });
  const thresholds = parseJson<Record<string, unknown>>(existing?.customThresholds, {});
  delete thresholds[indicatorCode];

  await prisma.userThresholdSettings.upsert({
    where: { userId },
    update: { customThresholds: JSON.stringify(thresholds) },
    create: { userId, customThresholds: JSON.stringify(thresholds) }
  });

  return res.json({ success: true, message: `Custom threshold removed for ${indicatorCode}` });
};

export const toggleRule = async (req, res) => {
  const { ruleCode } = req.params;
  const { disabled } = req.body;
  await prisma.interpretationRule.update({
    where: { code: ruleCode },
    data: { isEnabled: !disabled }
  });

  return res.json({
    success: true,
    message: `Rule ${ruleCode} ${disabled ? 'disabled' : 'enabled'}`
  });
};

export const getDataSources = async (_req, res) =>
  res.json({
    success: true,
    data: Object.entries(DATA_SOURCES).map(([key, config]) => ({
      key,
      name: config.name,
      enabled: config.enabled,
      rateLimit: 'rateLimit' in config ? config.rateLimit : null
    }))
  });

export const updateDataSource = async (req, res) => {
  const { source } = req.params;
  const { enabled, rateLimit, apiKey } = req.body;

  if (!DATA_SOURCES[source]) {
    return res.status(404).json({ success: false, message: 'Data source not found' });
  }

  if (enabled !== undefined) DATA_SOURCES[source].enabled = Boolean(enabled);
  if (rateLimit !== undefined) DATA_SOURCES[source].rateLimit = Number(rateLimit);
  if (apiKey) DATA_SOURCES[source].apiKey = apiKey;

  return res.json({
    success: true,
    message: `Data source ${source} updated`,
    data: { source, config: DATA_SOURCES[source] }
  });
};

export const getTemplates = async (req, res) => {
  const templates = await prisma.insightTemplate.findMany({
    where: req.query.ruleCode ? { ruleCode: String(req.query.ruleCode) } : {},
    orderBy: [{ ruleCode: 'asc' }, { name: 'asc' }]
  });

  return res.json({ success: true, data: templates });
};

export const getTemplate = async (req, res) => {
  const template = await prisma.insightTemplate.findFirst({
    where: { ruleCode: req.params.ruleCode }
  });

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  return res.json({ success: true, data: template });
};

export const upsertTemplate = async (req, res) => {
  const { ruleCode } = req.params;
  const { name = 'default', titleTemplate, bodyTemplate, actionTemplate, variables } = req.body;
  const template = await prisma.insightTemplate.upsert({
    where: { ruleCode_name: { ruleCode, name } },
    update: { titleTemplate, bodyTemplate, actionTemplate, variables: variables ? JSON.stringify(variables) : undefined },
    create: {
      ruleCode,
      name,
      titleTemplate,
      bodyTemplate,
      actionTemplate,
      variables: variables ? JSON.stringify(variables) : undefined
    }
  });

  return res.status(201).json({ success: true, message: 'Template saved', data: template });
};

export const deleteTemplate = async (req, res) => {
  await prisma.insightTemplate.delete({ where: { id: req.params.templateId } });
  return res.json({ success: true, message: 'Template deleted' });
};

export const resetTemplate = async (_req, res) =>
  res.json({ success: true, message: 'Template reset is not needed for Prisma templates' });

export const previewTemplate = async (req, res) => {
  const template = await prisma.insightTemplate.findFirst({
    where: { ruleCode: req.params.ruleCode }
  });

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found for this rule' });
  }

  return res.json({
    success: true,
    data: {
      ruleCode: req.params.ruleCode,
      templates: template,
      preview: {
        title: template.titleTemplate,
        body: template.bodyTemplate,
        action: template.actionTemplate
      }
    }
  });
};

export const seedIndustryTemplates = async (_req, res) =>
  res.json({ success: true, message: 'Template seeding should run through Prisma seed scripts', data: { seeded: 0 } });

export default {
  updateIndicator,
  batchUpdateIndicators,
  refreshFromSources,
  getUpdateStats,
  getAllIndicators,
  getThresholdSettings,
  updateThresholdSettings,
  setCustomThreshold,
  removeCustomThreshold,
  toggleRule,
  getDataSources,
  updateDataSource,
  getTemplates,
  getTemplate,
  upsertTemplate,
  deleteTemplate,
  resetTemplate,
  previewTemplate,
  seedIndustryTemplates
};

// SR
