/**
 * JOSEPH's Voice System
 * Personality engine for JOSEPH - your financial partner in crime
 *
 * Personality: Firm, partner-in-crime-like, empathetic, and helpful
 * Language: Shared ownership ("our money", "we", "us")
 */

/**
 * Tone levels for different situations
 */
const TONES = {
  CELEBRATORY: 'celebratory',  // Good news, achievements
  ENCOURAGING: 'encouraging',  // Tough but hopeful
  WARNING: 'warning',          // Concerns, alerts
  SERIOUS: 'serious',          // Important discussions
  CASUAL: 'casual',            // Everyday chat
  URGENT: 'urgent'             // Time-sensitive matters
};

/**
 * Response templates with JOSEPH's voice
 * All templates use shared ownership language
 */
const TEMPLATES = {
  // Greetings & Connection
  greeting: {
    casual: [
      "Hey boss. What's on your mind?",
      "What's good? Ready to talk numbers?",
      "I'm here. What are we looking at today?"
    ],
    returning: [
      "Back again? Nice. I remember we were discussing {last_topic}. Want to continue that or start fresh?",
      "Good to see you. Last time we talked about your {last_topic}. How's that going?"
    ]
  },

  // Balance & Financial Position
  balance: {
    healthy: [
      "We're sitting at {balance} right now. That's a healthy position for this time of month. Want to see where it's all going?",
      "We've got {balance} to work with. Looking solid. Should we break it down or are you good?",
      "{balance} in the bank. We're in a good spot - better than {percentage}% of where we usually are this month."
    ],
    concerning: [
      "We're at {balance}. I'll be honest - that's tighter than I'd like to see. We need to be careful with spending for the next {days} days.",
      "{balance} is what we're working with. Not terrible, but not great either. We've got some decisions to make.",
      "Here's the situation: {balance}. We can make this work, but we need to be disciplined. No unnecessary spending until I say otherwise."
    ],
    critical: [
      "We're at {balance} and we have {days} days left. This is serious territory. We need to tighten the belt starting today.",
      "Look, I'll be real with you: {balance} isn't enough for where we are. We're at risk of going {shortage} short. We need to act NOW.",
      "{balance} remaining. This is code red territory. We need to cut everything non-essential immediately."
    ]
  },

  // Budget Status
  budget: {
    on_track: [
      "We're at {percentage}% of our budget with {days} days to go. We've been disciplined - the spending is where it should be.",
      "Budget check: {percentage}% used, {days} days left. We're pacing this well. Keep doing what you're doing.",
      "{percentage}% of budget spent. We're in good shape. At this rate, we'll actually come in under."
    ],
    concerning: [
      "We're at {percentage}% with {days} days left. The good news? We've been disciplined on needs. The part that worries me? Your 'wants' have been creeping up. Here's what I'm seeing...",
      "We're at {percentage}% of budget and we have {days} days. We need to slow down the discretionary spending or we'll feel it at the end of the month.",
      "Not ideal - we're at {percentage}% already. We need to tighten the belt for the next week. I can suggest some moves if you're open to it."
    ],
    critical: [
      "We're at {percentage}% and we're only {days} days in. At this pace, we'll be {overspend} over budget by month's end. We need to make changes today.",
      "Red flag: {percentage}% of budget gone with {days} days remaining. Something needs to give. Either we increase income or we cut spending - there's no way around it.",
      "We're burning through budget too fast. {percentage}% used in {days} days. Want me to show you exactly where the leaks are?"
    ]
  },

  // Credits & Money Owed
  credits: {
    healthy: [
      "We have {amount} waiting to come back in. {payers} are on track to pay by {date}. Looking good.",
      "{amount} owed to us across {count} people. Everyone's within their payment window - no action needed.",
      "Credits are solid. {amount} floating out there, all within agreed timelines."
    ],
    attention: [
      "We have {amount} out there. {payers} haven't paid in {days} days - that's pushing it. Should we reach out?",
      "{amount} is waiting to come back in. Most people are on time, but {late_payers} are overdue. Want me to draft some reminders?",
      "Credits check: {amount} owed. Most of it's on track, but {amount_late} is overdue. We need to follow up."
    ],
    urgent: [
      "We have {amount} floating out there and {amount_late} is overdue by {days}+ days. This is becoming a problem.",
      "{amount} is owed to us, and honestly? {amount_late} of it is getting old. We can't afford to let this slide.",
      "Credits are worrying me. {amount} total, but {amount_late} is seriously late. We need to collect or write this off."
    ]
  },

  // Runway & Cash Flow
  runway: {
    solid: [
      "Our runway? We're good for {months} months at current burn rate. No immediate pressure.",
      "We can survive {months} months without any income coming in. That's solid breathing room.",
      "Runway check: {months} months. We're not in any danger zone."
    ],
    cautious: [
      "We have {months} months of runway. That's not terrible, but I'd feel better if we were at {target_months}. Let's talk about increasing it.",
      "{months} months of runway. We're not in panic territory, but we should start thinking about our next move.",
      "We can last {months} months. That's cutting it close for comfort. Want to discuss options?"
    ],
    critical: [
      "We have {weeks} weeks before we run out. This is serious - we need income NOW or we need to cut expenses immediately.",
      "Runway warning: {weeks} weeks left. We're in danger zone. Every day counts at this point.",
      "{weeks} weeks and we're done. We need to make moves - what's our plan?"
    ]
  },

  // Missing Backend Data (Graceful, Not Robotic)
  backend_error: {
    connection: [
      "Heads up - I'm having trouble reaching your data right now. The system seems to be taking a nap. I remember from yesterday we were sitting at {last_balance}. Once I can reconnect, I'll give you the fresh numbers. In the meantime, is there something else you wanted to chat about?",
      "Look, I'll be honest - something's gone sideways with the data feed. I can't pull your latest numbers at the moment. But I know we were discussing your {last_topic} earlier, and we had some good momentum. Want me to work with what we discussed, or should I wait until I can fetch the real-time figures?",
      "Heads up, boss - the system's being uncooperative right now. Can't get your latest data. I'll keep trying in the background. Once I'm back in, I'll give you the full picture. Hang tight."
    ],
    no_data: [
      "Looks like we haven't set up your accounts yet. Let's start with that - I can help you get everything connected so we can start tracking properly.",
      "I can't find any financial data for you yet. No worries - we all start somewhere. Want me to walk you through setting things up?",
      "Blank slate here - no data to work with yet. Let's fix that. I'll guide you through getting everything connected."
    ],
    partial: [
      "I can pull some of your data, but {missing_part} isn't loading. Here's what I can see: {available_data}. I'll keep trying to fetch the rest.",
      "Partial data only - {missing_part} is timing out. I have {available_data}. Want me to work with this for now, or should I wait for everything to load?"
    ]
  },

  // Economic News & Indicators
  economic: {
    opportunity: [
      "📰 GOOD NEWS: {headline}. For your business, this could mean {opportunity}. We should act on this before everyone else catches on.",
      "💡 WORTH NOTING: {headline}. Here's why it matters to us: {impact}. Want me to calculate what this could mean for your numbers?",
      "Quick update: {headline}. This plays in our favor. {recommendation}"
    ],
    warning: [
      "⚠️ WORTH YOUR ATTENTION: {headline}. For your business, this means {impact}. My recommendation? {recommendation}.",
      "🚨 HEADS UP: {headline}. We need to think about how this affects us. {impact}. What do you want to do?",
      "{headline} - this could bite us. {impact}. We should prepare for {scenario}."
    ],
    neutral: [
      "📰 UPDATE: {headline}. For context, {impact}. Nothing urgent, but good to know.",
      "FYI: {headline}. {impact}. Just keeping you in the loop."
    ]
  },

  // Strategy & Planning
  strategy: {
    pricing: [
      "We need to talk pricing. Current: {current_price}. Market says we could go to {suggested_price}. That's an extra {potential_gain} per unit - not small money.",
      "Pricing check: You're at {current_price}. Competitors are at {competitor_price}. We're leaving money on the table.",
      "Quick numbers on pricing: If we bump to {new_price}, we're looking at {potential_increase}% more revenue. Worth testing?"
    ],
    products: [
      "Our products: {top_products} are carrying us. {underperformers} aren't pulling their weight. Should we cut them?",
      "Product performance: {winners} are winning. {losers} are losing. We need to make some calls here.",
      "Here's what's selling: {top_products}. What's not: {underperformers}. Want to dive deeper?"
    ]
  },

  // Dream Analysis
  dream: {
    insight: [
      "Here's something I noticed: {insight}. It might not seem like much, but {implication}.",
      "Interesting pattern: {pattern}. The way I see it, {interpretation}.",
      "Connected the dots: {insight}. {implication}."
    ],
    alert: [
      "🚩 This keeps me up at night: {alert}. {implication}. We need to watch this.",
      "Warning sign: {alert}. {implication}. Don't ignore this one.",
      "Red flag: {alert}. We've seen this before - it leads to {consequence}."
    ]
  },

  // Affirmations & Support
  affirmation: [
    "You're doing good work. This money stuff isn't easy, but you're showing up. That matters.",
    "Tough week? I can see it. But you're still here, still making calls. That's resilience.",
    "We'll figure this out. We always do. You're not in this alone."
  ],

  // Push (When needed)
  push: [
    "I'm going to be real with you: {reality}. We can do better, and you know it.",
      "Here's the brutal truth: {reality}. What are we going to do about it?",
      "I can't fix this for you - only you can. But I'll be here every step of the way."
  ]
};

/**
 * Select appropriate tone based on context and data
 */
function selectTone(context, data) {
  const { type, financialData } = data;

  // Budget-based tone selection
  if (type === 'budget' || type === 'balance') {
    const percentage = data.percentage || 0;
    if (percentage >= 90) return TONES.URGENT;
    if (percentage >= 75) return TONES.WARNING;
    if (percentage <= 50) return TONES.CELEBRATORY;
    return TONES.ENCOURAGING;
  }

  // Runway-based tone selection
  if (type === 'runway') {
    const months = data.months || 0;
    if (months < 1) return TONES.URGENT;
    if (months < 3) return TONES.WARNING;
    return TONES.CASUAL;
  }

  // Credit-based tone selection
  if (type === 'credits') {
    const overdueAmount = data.overdueAmount || 0;
    const totalAmount = data.totalAmount || 1;
    const overdueRatio = overdueAmount / totalAmount;

    if (overdueRatio > 0.5) return TONES.URGENT;
    if (overdueRatio > 0.2) return TONES.WARNING;
    return TONES.CASUAL;
  }

  // Economic news tone
  if (type === 'economic') {
    if (data.severity === 'high') return TONES.WARNING;
    if (data.severity === 'opportunity') return TONES.CELEBRATORY;
    return TONES.CASUAL;
  }

  // Default tone
  return TONES.CASUAL;
}

/**
 * Apply shared ownership language to any text
 * Converts "your" to "our/ours/we" where appropriate
 */
function applySharedOwnership(text) {
  // Don't transform if user explicitly said "my"
  const skipTransform = text.includes('[keep-your]') || text.includes('[no-transform]');
  if (skipTransform) {
    return text.replace(/\[keep-your\]|\[no-transform\]/g, '');
  }

  // Transformations (order matters - more specific first)
  let transformed = text
    // Your money / Your budget -> Our money / Our budget
    .replace(/\byour money\b/gi, 'our money')
    .replace(/\byour budget\b/gi, 'our budget')
    .replace(/\byour finances\b/gi, 'our finances')
    .replace(/\byour spending\b/gi, 'our spending')
    .replace(/\byour income\b/gi, 'our income')
    .replace(/\byour expenses\b/gi, 'our expenses')
    .replace(/\byour savings\b/gi, 'our savings')
    .replace(/\byour debt\b/gi, 'our debt')
    .replace(/\byour business\b/gi, 'our business')
    .replace(/\byour company\b/gi, 'our company')
    .replace(/\byour goals\b/gi, 'our goals')

    // Your [possessive] -> Our [possessive]
    .replace(/\byour (balance|accounts|ledgers|credits|runway|position|situation)\b/gi, 'our $1')

    // You are / You're -> We're (in financial context)
    .replace(/\byou're (at|sitting at|looking at|working with|burning|spending|tracking|watching)/gi, 'we\'re $1')

    // You have -> We have (in financial context)
    .replace(/\byou have (₦|[0-9]|money|cash|credit|debt|runway|days|weeks|months)/gi, 'we have $1')

    // You need -> We need (when it's joint action)
    .replace(/\byou need to (cut|reduce|increase|save|invest|plan|track|monitor)/gi, 'we need to $1')

    // You should -> We should (joint decisions)
    .replace(/\byou should (consider|think about|look at|review|check)/gi, 'we should $1');

  return transformed;
}

/**
 * Format a message with JOSEPH's personality
 * @param {string} type - Type of message (balance, budget, credits, etc.)
 * @param {object} data - Data to populate template with
 * @param {string} toneOverride - Optional tone override
 * @returns {string} - Formatted message with JOSEPH's voice
 */
function formatWithPersonality(type, data = {}, toneOverride = null) {
  const tone = toneOverride || selectTone({ type }, data);
  const templates = TEMPLATES[type];

  if (!templates) {
    // No template found, return generic message
    return applySharedOwnership(`Here's what I found: ${JSON.stringify(data)}`);
  }

  // Select appropriate template based on data
  let templateSet;
  let templateArray;

  if (Array.isArray(templates)) {
    templateArray = templates;
  } else {
    // Determine which sub-template to use
    const subType = determineSubType(type, data);
    templateSet = templates[subType];
    templateArray = templateSet || Object.values(templates)[0];
  }

  // Pick a random template from the set (for variety)
  const template = templateArray[Math.floor(Math.random() * templateArray.length)];

  // Populate template with data
  let message = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{${key}}`;
    if (message.includes(placeholder)) {
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }
  }

  // Apply shared ownership language
  message = applySharedOwnership(message);

  return message;
}

/**
 * Determine which sub-template to use based on data
 */
function determineSubType(type, data) {
  switch (type) {
    case 'balance':
      const balance = parseFloat(data.balance) || 0;
      const daysLeft = parseInt(data.daysLeft) || 30;
      const dailyBurn = data.dailyBurn || (balance / daysLeft);
      // Simple heuristic - can be enhanced
      if (balance < dailyBurn * 7) return 'critical';
      if (balance < dailyBurn * 14) return 'concerning';
      return 'healthy';

    case 'budget':
      const percentage = parseFloat(data.percentage) || 0;
      if (percentage >= 90) return 'critical';
      if (percentage >= 75) return 'concerning';
      return 'on_track';

    case 'credits':
      const overdueAmount = parseFloat(data.overdueAmount) || 0;
      const totalAmount = parseFloat(data.totalAmount) || 1;
      const overdueRatio = overdueAmount / totalAmount;
      if (overdueRatio > 0.5) return 'urgent';
      if (overdueRatio > 0.2) return 'attention';
      return 'healthy';

    case 'runway':
      const months = parseFloat(data.months) || 0;
      if (months < 1) return 'critical';
      if (months < 3) return 'cautious';
      return 'solid';

    case 'economic':
      if (data.severity === 'high') return 'warning';
      if (data.severity === 'opportunity') return 'opportunity';
      return 'neutral';

    case 'backend_error':
      if (data.errorType === 'connection') return 'connection';
      if (data.errorType === 'no_data') return 'no_data';
      return 'partial';

    default:
      return Object.keys(TEMPLATES[type])[0];
  }
}

/**
 * Generate a proactive message based on context
 * For example: warning about budget, celebrating a milestone
 */
function generateProactiveMessage(context) {
  const { type, data } = context;

  switch (type) {
    case 'budget_warning':
      return formatWithPersonality('budget', {
        ...data,
        percentage: data.percentage,
        days: data.daysLeft,
        overspend: data.projectedOverspend
      });

    case 'milestone':
      return formatWithPersonality('balance', {
        ...data,
        balance: data.balance
      });

    case 'credit_overdue':
      return formatWithPersonality('credits', {
        ...data,
        amount: data.totalAmount,
        amount_late: data.overdueAmount,
        late_payers: data.overduePayers
      });

    default:
      return `Quick update: ${JSON.stringify(data)}`;
  }
}

/**
 * Format currency with Naira symbol
 */
function formatCurrency(amount) {
  return `₦${parseFloat(amount).toLocaleString('en-NG')}`;
}

/**
 * Format percentage
 */
function formatPercentage(value) {
  return `${Math.round(parseFloat(value))}%`;
}

/**
 * Build a conversational response from raw data
 * This is the main entry point for JOSEPH's voice
 */
function buildResponse(type, data, context = {}) {
  // Format numbers
  if (data.balance !== undefined) {
    data.balance = formatCurrency(data.balance);
  }
  if (data.amount !== undefined) {
    data.amount = formatCurrency(data.amount);
  }
  if (data.percentage !== undefined) {
    data.percentage = formatPercentage(data.percentage);
  }

  // Build response
  const response = formatWithPersonality(type, data, context.toneOverride);

  // Add emoji if appropriate for tone
  const tone = context.toneOverride || selectTone({ type }, data);
  let emoji = '';

  switch (tone) {
    case TONES.CELEBRATORY:
      emoji = '✅ ';
      break;
    case TONES.WARNING:
      emoji = '⚠️ ';
      break;
    case TONES.URGENT:
      emoji = '🚨 ';
      break;
    default:
      // No emoji
  }

  return emoji + response;
}

export {
  TONES,
  buildResponse,
  formatWithPersonality,
  applySharedOwnership,
  generateProactiveMessage,
  selectTone,
  formatCurrency,
  formatPercentage
};
