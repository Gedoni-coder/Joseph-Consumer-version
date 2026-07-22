# Micro Economic Scroll — Value Mapping to Finance Modules

**Purpose:** Map all hardcoded values in the Micro Economic Interpretation scroll to their source element IDs in Personal Finance and Business Finance modules. Values will be updated deterministically by reading from DOM elements.

---

## PERSONAL FINANCE VALUES

| Scroll Value | Source Element ID | Location | Notes |
|:-------------|:------------------|:---------|:------|
| ₦15,000 | `personal-life-balance` | Survival bar | Personal balance |
| ₦620 | `personal-safe-to-spend` | Survival bar | Remaining safe-to-spend |
| ₦7,500 | `split-needs` | Budget split visualization | Needs (50%) |
| ₦3,500 | (needs transaction: hostel) | Budget bucket transaction | Hostel rent |
| ₦1,780 | (needs transaction: food) | Budget bucket transaction | Food & groceries |
| ₦5,280 | (calculated) | Needs bucket | Total needs spent |
| ₦4,500 | `split-wants` | Budget split visualization | Wants (30%) |
| ₦1,890 | (calculated) | Wants bucket | Total wants spent |
| ₦1,200 | (wants transaction: data) | Budget bucket transaction | Data subscription |
| ₦690 | (wants transaction: snacks) | Budget bucket transaction | Snacks |
| ₦3,000 | `split-savings` | Budget split visualization | Savings goal (20%) |
| ₦2,100 | `personal-savings` | Survival bar | Total saved |
| ₦1,500 | (savings transaction: emergency) | Savings goal | Emergency Fund |
| ₦600 | (savings transaction: tech) | Savings goal | Tech Savings |
| 72 | `personal-health-score` | Survival bar | Health score |
| ₦850 | (burn rate display) | Personal Finance page | Daily burn |
| ₦41 | (calculated) | Safe-to-Spend section | Daily safe spend (₦620 ÷ 15) |
| 15 days | (days remaining) | Time reference | Days left in month |
| 18 days | (runway) | Calculated | Personal runway |

---

## BUSINESS FINANCE VALUES

| Scroll Value | Source Element ID | Location | Notes |
|:-------------|:------------------|:---------|:------|
| ₦20,000 | `business-balance` | Survival bar | Total sales/ledger balance |
| ₦14,000 | `fin-locked-vault` | Survival bar | Working capital (70%) |
| ₦6,000 | `business-available` | Survival bar | Available cash (30%) |
| ₦333 | (calculated) | Safe-to-Spend section | Daily safe spend (₦6,000 ÷ 18) |
| 18 days | `fin-runway-days` | Survival bar | Runway |
| ₦2,500 | (expense breakdown) | Business expenses | Restock expense |
| ₦1,500 | (expense breakdown) | Business expenses | Transport expense |
| ₦800 | (expense breakdown) | Business expenses | Marketing expense |
| ₦700 | (expense breakdown) | Business expenses | Packaging expense |
| ₦500 | (expense breakdown) | Business expenses | Fees expense |
| ₦6,000 | (total spent) | Business expenses | Total business expenses |
| ₦1,111 | (burn rate display) | Business Finance page | Daily burn |
| ₦8,500 | `credit-owed` | Credit Ledger | Total credit owed |
| ₦2,500 | (credit entry) | Credit Ledger | Chinedu Okonkwo overdue |
| 5 days | (credit entry) | Credit Ledger | Days overdue |
| ₦3,000 | `credit-due` | Credit Ledger | Fatima Abdullahi amount |
| 2 days | (credit entry) | Credit Ledger | Days until due |

---

## CALCULATED VALUES

These values are computed from other values:

| Scroll Value | Calculation | Source |
|:-------------|:------------|:-------|
| ₦41 | ₦620 ÷ 15 days | personal-safe-to-spend ÷ days remaining |
| ₦333 | ₦6,000 ÷ 18 days | business-available ÷ fin-runway-days |
| ₦5,280 | Sum of needs transactions | hostel rent + food/groceries + other needs |
| ₦1,890 | Sum of wants transactions | data subscription + snacks + other wants |
| ₦850 | Total expenses ÷ 30 | Personal monthly burn rate |
| ₦1,111 | Business expenses ÷ 30 | Business daily burn rate |

---

## IMPLEMENTATION STRATEGY

1. **DOM Reader Function** — Read values from source elements
2. **Value Injector Function** — Replace hardcoded values in scroll text
3. **Trigger Points** — Update on Finance module load and Interpretation page visit
4. **No API Calls** — All values read from already-loaded DOM elements

---

## SCROLL TEXT LOCATIONS TO UPDATE

The scroll text contains these value placeholders that need to be made dynamic:

1. Line 588: "your ₦15,000 budget" → `personal-life-balance`
2. Line 594: "hostel rent (₦3,500) and food/groceries (₦1,780)" → Transaction values
3. Line 594: "₦5,280 out of your ₦7,500 stash" → Calculated ÷ `split-needs`
4. Line 601: "₦1,890 out of your ₦4,500 fun fund" → Calculated ÷ `split-wants`
5. Line 601: "Data subscription took ₦1,200; snacks took ₦690" → Transaction values
6. Line 608: "₦2,100 of your ₦3,000 savings goal" → `personal-savings` ÷ `split-savings`
7. Line 608: "₦1,500 is in your Emergency Fund and ₦600 is in Tech Savings" → Goal values
8. Line 626: "You have ₦620 left" → `personal-safe-to-spend`
9. Line 633: "15 days left in the month" → Days calculation
10. Line 633: "₦41 a day (₦620 ÷ 15 days)" → Calculated
11. Line 652: "₦7,170 this month" → Total personal expenses
12. Line 659: "₦850 a day" → Personal burn rate
13. Line 666: "18 days" → Personal runway
14. Line 676: "You made ₦20,000 in total sales" → `business-balance`
15. Line 682: "₦14,000 is set aside" → `fin-locked-vault`
16. Line 689: "₦6,000 is left" → `business-available`
17. Line 700: "You have ₦6,000 available" → `business-available`
18. Line 707: "₦333 a day for the next 18 days" → Calculated
19. Line 725: "₦6,000 on business costs" → Total business expenses
20. Line 725: "(Restock: ₦2,500, Transport: ₦1,500, Marketing: ₦800, Packaging: ₦700, Fees: ₦500)" → Expense breakdown
21. Line 732: "₦1,111 a day" → Business burn rate
22. Line 735: "18 days" → `fin-runway-days`
23. Line 750: "Customers owe you ₦8,500" → Total credit owed
24. Line 757: "₦2,500 is late from Chinedu Okonkwo" → Credit entry
25. Line 757: "(by 5 days)" → Days overdue
26. Line 764: "₦3,000 is due from Fatima Abdullahi" → Credit entry
27. Line 764: "in 2 days" → Days until due

---

## NEXT STEPS

1. Create JavaScript function to read values from source elements
2. Create function to inject values into scroll text using data attributes or markers
3. Add triggers to update values when Finance modules load
4. Add triggers to update values when Interpretation page is opened
