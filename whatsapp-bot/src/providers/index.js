/**
 * Provider Factory
 * Reads WHATSAPP_PROVIDER from .env and returns the correct provider instance.
 *
 * Usage:
 *   import { createProvider } from './providers/index.js';
 *   const provider = createProvider(config);
 *
 * To switch providers, change ONE line in .env:
 *   WHATSAPP_PROVIDER=baileys   ← current (development)
 *   WHATSAPP_PROVIDER=meta      ← future  (production)
 */

import { BaileysProvider } from './baileys-provider.js';
import { MetaProvider }    from './meta-provider.js';

const SUPPORTED_PROVIDERS = {
  baileys: BaileysProvider,
  meta:    MetaProvider
};

/**
 * @param {object} config - The shared bot config object
 * @returns {BaseProvider} A fully-constructed provider instance
 */
export function createProvider(config) {
  const providerName = (process.env.WHATSAPP_PROVIDER || 'baileys').toLowerCase().trim();

  const ProviderClass = SUPPORTED_PROVIDERS[providerName];

  if (!ProviderClass) {
    const valid = Object.keys(SUPPORTED_PROVIDERS).join(', ');
    throw new Error(
      `Unknown WHATSAPP_PROVIDER="${providerName}". Valid options are: ${valid}`
    );
  }

  console.log(`[Provider Factory] Loading provider: ${providerName}`);
  return new ProviderClass(config);
}

export { BaileysProvider, MetaProvider };

// SR
