/**
 * Base Provider
 * Abstract interface that all WhatsApp providers must implement.
 * Ensures Baileys and Meta Cloud API are completely interchangeable.
 */

export class BaseProvider {
  constructor(config) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is abstract and cannot be instantiated directly.');
    }
    this.config = config;
    this._messageCallback = null;
  }

  /**
   * Connect to WhatsApp and start the bot.
   * Must resolve when the connection is established.
   */
  async connect() {
    throw new Error(`${this.constructor.name} must implement connect()`);
  }

  /**
   * Gracefully disconnect from WhatsApp.
   */
  async disconnect() {
    throw new Error(`${this.constructor.name} must implement disconnect()`);
  }

  /**
   * Send a text message to a recipient.
   * @param {string} to - Recipient phone number (E.164 format, e.g. "2348012345678")
   * @param {string} text - Message body
   * @param {object} [options] - Optional provider-specific options
   */
  async sendMessage(to, text, options = {}) {
    throw new Error(`${this.constructor.name} must implement sendMessage()`);
  }

  /**
   * Show a typing indicator to a recipient (best effort — not all providers support this).
   * @param {string} to - Recipient phone number
   */
  async sendTyping(to) {
    // Optional — providers may no-op this
  }

  /**
   * Register the callback invoked whenever a message is received.
   * The callback receives: (phoneNumber: string, text: string, meta: object)
   * @param {function} callback
   */
  onMessage(callback) {
    this._messageCallback = callback;
  }

  /**
   * Internal helper: dispatch an incoming message to the registered callback.
   */
  _dispatch(phoneNumber, text, meta = {}) {
    if (this._messageCallback) {
      this._messageCallback(phoneNumber, text, meta);
    }
  }
}

// SR
