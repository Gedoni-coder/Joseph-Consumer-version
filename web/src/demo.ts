// Explicit product-preview fixtures. These are not Financial State Engine outputs.
export const scenarios = [
  { id: 'week', label: 'A quiet week', purchase: 0, available: 72000, title: 'A little room to breathe.', description: 'In this example, bills and your savings goal are already set aside. The remaining ₦72,000 is your breathing room.' },
  { id: 'dinner', label: 'Dinner with friends', purchase: 18000, available: 54000, title: 'Good food. Clear head.', description: 'An ₦18,000 dinner would leave ₦54,000 in this sample plan. Your bills and savings allocation stay untouched.' },
  { id: 'headphones', label: 'New headphones', purchase: 65000, available: 7000, title: 'A tighter week ahead.', description: 'The ₦65,000 headphones would leave just ₦7,000 in this sample plan. Seeing the trade-off makes it easier to decide.' },
] as const;

export const questions = [
  { question: 'Can I spend ₦18,000 this weekend?', answer: 'In this example, yes—with ₦54,000 left in your spending plan afterwards. Your ₦165,000 for bills and ₦48,000 savings allocation remain set aside.', label: 'Weekend plans' },
  { question: 'What money have I set aside?', answer: 'This sample plan sets aside ₦165,000 for upcoming bills and ₦48,000 towards a new laptop. That leaves ₦72,000 from the ₦285,000 balance.', label: 'My commitments' },
  { question: 'How is my laptop goal looking?', answer: 'You have ₦240,000 of a ₦400,000 target in this demo: 60% of the way there. Your next planned allocation is ₦48,000.', label: 'My next goal' },
] as const;

export const formatMoney = (value: number) => `₦${new Intl.NumberFormat('en-NG').format(value)}`;
