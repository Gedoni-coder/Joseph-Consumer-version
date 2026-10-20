/**
 * Conversation Memory System
 * Manages conversation history and context for JOSEPH
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memory storage
const MEMORY_DIR = path.join(__dirname, '../../data/memory');
const MEMORY_FILE = path.join(MEMORY_DIR, 'conversations.json');

// In-memory cache
const memoryCache = new Map();

// ==========================================
// INITIALIZATION
// ==========================================

function ensureMemoryDir() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

function loadMemoryFromFile() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const data = fs.readFileSync(MEMORY_FILE, 'utf8');
      const parsed = JSON.parse(data);

      // Load into cache
      for (const [phoneNumber, conversations] of Object.entries(parsed)) {
        memoryCache.set(phoneNumber, conversations);
      }

      return true;
    }
  } catch (error) {
    console.error('Failed to load conversation memory:', error.message);
  }
  return false;
}

function saveMemoryToFile() {
  try {
    ensureMemoryDir();

    const obj = {};
    for (const [phoneNumber, conversations] of memoryCache.entries()) {
      obj[phoneNumber] = conversations;
    }

    fs.writeFileSync(MEMORY_FILE, JSON.stringify(obj, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save conversation memory:', error.message);
    return false;
  }
}

// Initialize on load
loadMemoryFromFile();

// ==========================================
// MEMORY MANAGEMENT
// ==========================================

/**
 * Get conversation history for a phone number
 * @param {string} phoneNumber - User's phone number
 * @param {number} limit - Maximum conversations to return (default: 20)
 * @returns {Array} Conversation history
 */
export function getConversationHistory(phoneNumber, limit = 20) {
  const conversations = memoryCache.get(phoneNumber) || [];
  return conversations.slice(-limit);
}

/**
 * Add a conversation exchange to memory
 * @param {string} phoneNumber - User's phone number
 * @param {object} exchange - Conversation exchange
 */
export function addConversation(phoneNumber, exchange) {
  const conversations = memoryCache.get(phoneNumber) || [];

  // Add new exchange
  conversations.push({
    ...exchange,
    timestamp: new Date().toISOString()
  });

  // Keep only last 20 conversations
  const trimmed = conversations.slice(-20);
  memoryCache.set(phoneNumber, trimmed);

  // Persist to file
  saveMemoryToFile();

  return trimmed;
}

/**
 * Clear conversation history for a phone number
 * @param {string} phoneNumber - User's phone number
 */
export function clearConversation(phoneNumber) {
  memoryCache.delete(phoneNumber);
  saveMemoryToFile();
}

/**
 * Get conversation context for generating responses
 * @param {string} phoneNumber - User's phone number
 * @returns {object} Conversation context
 */
export function getConversationContext(phoneNumber) {
  const conversations = memoryCache.get(phoneNumber) || [];

  if (conversations.length === 0) {
    return {
      hasHistory: false,
      recentTopics: [],
      lastTopic: null,
      lastMessageTime: null,
      exchangeCount: 0
    };
  }

  // Extract context
  const recentTopics = [];
  const topics = new Set();

  for (const conv of conversations.slice(-5)) {
    if (conv.topic) {
      topics.add(conv.topic);
      recentTopics.push(conv.topic);
    }
  }

  const lastConv = conversations[conversations.length - 1];

  return {
    hasHistory: true,
    recentTopics: Array.from(topics),
    lastTopic: lastConv.topic || null,
    lastMessageTime: lastConv.timestamp,
    exchangeCount: conversations.length,
    lastUserMessage: lastConv.userMessage,
    lastBotResponse: lastConv.botResponse
  };
}

/**
 * Search conversation history for specific topic
 * @param {string} phoneNumber - User's phone number
 * @param {string} topic - Topic to search for
 * @returns {Array} Matching conversations
 */
export function searchByTopic(phoneNumber, topic) {
  const conversations = memoryCache.get(phoneNumber) || [];
  const normalizedTopic = topic.toLowerCase();

  return conversations.filter(conv => {
    if (!conv.topic) return false;
    return conv.topic.toLowerCase().includes(normalizedTopic);
  });
}

/**
 * Get what was discussed in a specific time period
 * @param {string} phoneNumber - User's phone number
 * @param {number} days - Number of days back to look
 * @returns {Array} Conversations from the period
 */
export function getRecentDays(phoneNumber, days = 7) {
  const conversations = memoryCache.get(phoneNumber) || [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return conversations.filter(conv => {
    if (!conv.timestamp) return false;
    return new Date(conv.timestamp) >= cutoffDate;
  });
}

/**
 * Check if a topic was recently discussed
 * @param {string} phoneNumber - User's phone number
 * @param {string} topic - Topic to check
 * @param {number} withinMinutes - Minutes back to check
 * @returns {boolean}
 */
export function wasRecentlyDiscussed(phoneNumber, topic, withinMinutes = 60) {
  const conversations = memoryCache.get(phoneNumber) || [];
  const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);
  const normalizedTopic = topic.toLowerCase();

  return conversations.some(conv => {
    if (!conv.topic || !conv.timestamp) return false;
    const convDate = new Date(conv.timestamp);
    return convDate >= cutoffTime && conv.topic.toLowerCase().includes(normalizedTopic);
  });
}

/**
 * Get user preferences from conversation patterns
 * @param {string} phoneNumber - User's phone number
 * @returns {object} User preferences
 */
export function getUserPreferences(phoneNumber) {
  const conversations = memoryCache.get(phoneNumber) || [];

  const preferences = {
    usesMyLanguage: false, // User explicitly says "my" instead of "our"
    prefersBrief: false,    // User prefers brief responses
    prefersDetail: false,  // User wants detailed breakdowns
    talkative: false,      // User likes to chat
    direct: false          // User wants straight answers
  };

  // Analyze conversation patterns
  let myWordCount = 0;
  let briefRequests = 0;
  let detailRequests = 0;
  let longMessages = 0;

  for (const conv of conversations) {
    if (conv.userMessage) {
      const msg = conv.userMessage.toLowerCase();

      // Check for "my" vs "our" language
      const myMatches = (msg.match(/\b(my\b|mine)\b/gi) || []).length;
      const ourMatches = (msg.match(/\b(our|ours|we)\b/gi) || []).length;

      if (myMatches > ourMatches * 2) {
        myWordCount++;
      }

      // Check for brief/detail preferences
      if (msg.includes('brief') || msg.includes('short') || msg.includes('summary')) {
        briefRequests++;
      }
      if (msg.includes('detail') || msg.includes('breakdown') || msg.includes('explain')) {
        detailRequests++;
      }

      // Check message length preference
      if (conv.userMessage.length > 100) {
        longMessages++;
      }
    }
  }

  // Determine preferences
  const totalConvs = conversations.length || 1;
  preferences.usesMyLanguage = myWordCount >= 3;
  preferences.prefersBrief = briefRequests >= 2;
  preferences.prefersDetail = detailRequests >= 2;
  preferences.talkative = longMessages >= totalConvs * 0.5;

  return preferences;
}

/**
 * Clean up old conversations (older than 1 month)
 * Call this periodically to keep memory size manageable
 */
export function cleanupOldConversations() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  let cleaned = 0;

  for (const [phoneNumber, conversations] of memoryCache.entries()) {
    const originalLength = conversations.length;
    const filtered = conversations.filter(conv => {
      if (!conv.timestamp) return true; // Keep if no timestamp
      return new Date(conv.timestamp) >= oneMonthAgo;
    });

    if (filtered.length < originalLength) {
      memoryCache.set(phoneNumber, filtered);
      cleaned += (originalLength - filtered.length);
    }
  }

  if (cleaned > 0) {
    saveMemoryToFile();
    console.log(`Cleaned up ${cleaned} old conversations`);
  }

  return cleaned;
}

// Export utilities
export default {
  getConversationHistory,
  addConversation,
  clearConversation,
  getConversationContext,
  searchByTopic,
  getRecentDays,
  wasRecentlyDiscussed,
  getUserPreferences,
  cleanupOldConversations
};

// SR
