/**
 * Economic Indicators Seeder
 * Seeds the database with 85+ Nigerian economic indicators
 */

import EconomicIndicator from '../models/EconomicIndicator.js';
import EconomicEvent from '../models/EconomicEvent.js';

// ==========================================
// INDICATORS DATA
// ==========================================

const INDICATORS = [
  // === OVERVIEW ===
  {
    code: 'CURRENCY_USD',
    category: 'overview',
    name: 'Currency (USD to NGN)',
    description: 'Official USD to Naira exchange rate',
    unit: 'NGN/USD',
    value: 1370,
    previous: 1370,
    highest: 1718,
    lowest: 73.1,
    frequency: 'daily',
    priority: 10
  },
  {
    code: 'STOCK_MARKET',
    category: 'overview',
    name: 'Nigeria Stock Market Index',
    description: ' NGX All Share Index',
    unit: 'points',
    value: 229240,
    previous: 224322,
    highest: 254067,
    lowest: 4792,
    frequency: 'daily',
    priority: 9
  },
  {
    code: 'GDP_GROWTH_RATE',
    category: 'overview',
    name: 'GDP Growth Rate',
    description: 'Quarterly GDP growth rate',
    unit: 'percent',
    value: -19.87,
    previous: 12.16,
    highest: 13.11,
    lowest: -19.87,
    frequency: 'quarterly',
    priority: 10
  },
  {
    code: 'INFLATION_RATE',
    category: 'overview',
    name: 'Inflation Rate',
    description: 'Consumer price inflation rate',
    unit: 'percent',
    value: 15.93,
    previous: 15.69,
    highest: 47.56,
    lowest: -2.49,
    frequency: 'monthly',
    priority: 10
  },
  {
    code: 'INTEREST_RATE',
    category: 'overview',
    name: 'Interest Rate',
    description: 'CBN Monetary Policy Rate',
    unit: 'percent',
    value: 26.5,
    previous: 26.5,
    highest: 27.5,
    lowest: 6,
    frequency: 'monthly',
    priority: 10
  },
  {
    code: 'CASH_RESERVE_RATIO',
    category: 'overview',
    name: 'Cash Reserve Ratio',
    description: 'CBN Cash Reserve Ratio for banks',
    unit: 'percent',
    value: 45,
    previous: 45,
    highest: 50,
    lowest: 1,
    frequency: 'monthly',
    priority: 8
  },
  {
    code: 'BALANCE_OF_TRADE',
    category: 'overview',
    name: 'Balance of Trade',
    description: 'Trade balance difference',
    unit: 'NGN Million',
    value: 4142169,
    previous: 1431197,
    highest: 4142169,
    lowest: -975441,
    frequency: 'monthly',
    priority: 7
  },

  // === GDP ===
  {
    code: 'GDP_ANNUAL_GROWTH',
    category: 'gdp',
    name: 'GDP Annual Growth Rate',
    description: 'Year-over-year GDP growth',
    unit: 'percent',
    value: 3.89,
    previous: 4.07,
    highest: 6.88,
    lowest: -6.1,
    frequency: 'yearly',
    priority: 9
  },
  {
    code: 'GDP_TOTAL',
    category: 'gdp',
    name: 'GDP',
    description: 'Gross Domestic Product total',
    unit: 'USD Billion',
    value: 188,
    previous: 364,
    highest: 574,
    lowest: 4.2,
    frequency: 'yearly',
    priority: 8
  },
  {
    code: 'GDP_CONSTANT_PRICES',
    category: 'gdp',
    name: 'GDP Constant Prices',
    description: 'GDP at constant prices',
    unit: 'NGN Million',
    value: 51261306,
    previous: 63969485,
    highest: 63969485,
    lowest: 46785319,
    frequency: 'quarterly',
    priority: 6
  },
  {
    code: 'GROSS_FIXED_CAPITAL',
    category: 'gdp',
    name: 'Gross Fixed Capital Formation',
    description: 'Investment in fixed assets',
    unit: 'NGN Million',
    value: 2914571,
    previous: 2617119,
    highest: 3480268,
    lowest: 17237,
    frequency: 'quarterly',
    priority: 5
  },
  {
    code: 'GDP_PER_CAPITA',
    category: 'gdp',
    name: 'GDP Per Capita',
    description: 'GDP per person',
    unit: 'USD',
    value: 2448,
    previous: 2416,
    highest: 2586,
    lowest: 1218,
    frequency: 'yearly',
    priority: 7
  },
  {
    code: 'GDP_PER_CAPITA_PPP',
    category: 'gdp',
    name: 'GDP Per Capita PPP',
    description: 'GDP per capita at purchasing power parity',
    unit: 'USD',
    value: 5665,
    previous: 5593,
    highest: 5985,
    lowest: 3218,
    frequency: 'yearly',
    priority: 6
  },
  {
    code: 'FULL_YEAR_GDP_GROWTH',
    category: 'gdp',
    name: 'Full Year GDP Growth',
    description: 'Annual GDP growth rate',
    unit: 'percent',
    value: 3.9,
    previous: 3.4,
    highest: 14.6,
    lowest: -1.92,
    frequency: 'yearly',
    priority: 8
  },
  {
    code: 'GDP_NON_OIL_GROWTH',
    category: 'gdp',
    name: 'GDP Growth Non-Oil Sector',
    description: 'Non-oil sector GDP growth',
    unit: 'percent',
    value: 3.94,
    previous: 3.99,
    highest: 8.92,
    lowest: -6.05,
    frequency: 'quarterly',
    priority: 6
  },
  {
    code: 'GDP_OIL_GROWTH',
    category: 'gdp',
    name: 'GDP Growth Oil Sector',
    description: 'Oil sector GDP growth',
    unit: 'percent',
    value: 2.57,
    previous: 6.79,
    highest: 24.21,
    lowest: -26.04,
    frequency: 'quarterly',
    priority: 5
  },
  {
    code: 'GDP_AGRICULTURE',
    category: 'gdp',
    name: 'GDP from Agriculture',
    description: 'Agriculture sector contribution to GDP',
    unit: 'NGN Million',
    value: 11872704,
    previous: 18332955,
    highest: 18332955,
    lowest: 11502426,
    frequency: 'quarterly',
    priority: 7
  },
  {
    code: 'GDP_CONSTRUCTION',
    category: 'gdp',
    name: 'GDP from Construction',
    description: 'Construction sector contribution',
    unit: 'NGN Million',
    value: 2485699,
    previous: 2504246,
    highest: 2504246,
    lowest: 1682672,
    frequency: 'quarterly',
    priority: 5
  },
  {
    code: 'GDP_MANUFACTURING',
    category: 'gdp',
    name: 'GDP from Manufacturing',
    description: 'Manufacturing sector contribution',
    unit: 'NGN Million',
    value: 4905644,
    previous: 4735499,
    highest: 4905644,
    lowest: 3891511,
    frequency: 'quarterly',
    priority: 7
  },
  {
    code: 'GDP_MINING',
    category: 'gdp',
    name: 'GDP from Mining',
    description: 'Mining sector contribution',
    unit: 'NGN Million',
    value: 2121388,
    previous: 2024411,
    highest: 2163618,
    lowest: 1665252,
    frequency: 'quarterly',
    priority: 5
  },
  {
    code: 'GDP_PUBLIC_ADMIN',
    category: 'gdp',
    name: 'GDP from Public Administration',
    description: 'Public administration contribution',
    unit: 'NGN Million',
    value: 1077320,
    previous: 1675215,
    highest: 1675215,
    lowest: 1014159,
    frequency: 'quarterly',
    priority: 5
  },
  {
    code: 'GDP_SERVICES',
    category: 'gdp',
    name: 'GDP from Services',
    description: 'Services sector contribution',
    unit: 'NGN Million',
    value: 29594541,
    previous: 35770834,
    highest: 35770834,
    lowest: 26133661,
    frequency: 'quarterly',
    priority: 7
  },
  {
    code: 'GDP_TRANSPORT',
    category: 'gdp',
    name: 'GDP from Transport',
    description: 'Transport sector contribution',
    unit: 'NGN Million',
    value: 524841,
    previous: 651203,
    highest: 651203,
    lowest: 272830,
    frequency: 'quarterly',
    priority: 5
  },
  {
    code: 'GDP_UTILITIES',
    category: 'gdp',
    name: 'GDP from Utilities',
    description: 'Utilities sector contribution',
    unit: 'NGN Million',
    value: 281330,
    previous: 601539,
    highest: 854307,
    lowest: 246971,
    frequency: 'quarterly',
    priority: 5
  },

  // === LABOUR ===
  {
    code: 'UNEMPLOYMENT_RATE',
    category: 'labour',
    name: 'Unemployment Rate',
    description: 'Percentage of unemployed labor force',
    unit: 'percent',
    value: 4.9,
    previous: 4.6,
    highest: 10.7,
    lowest: 3.7,
    frequency: 'quarterly',
    priority: 9
  },
  {
    code: 'POPULATION',
    category: 'labour',
    name: 'Population',
    description: 'Total population',
    unit: 'Million',
    value: 238,
    previous: 233,
    highest: 238,
    lowest: 45.05,
    frequency: 'yearly',
    priority: 7
  },
  {
    code: 'EMPLOYMENT_RATE',
    category: 'labour',
    name: 'Employment Rate',
    description: 'Percentage of employed labor force',
    unit: 'percent',
    value: 75.7,
    previous: 75.4,
    highest: 93.6,
    lowest: 66.7,
    frequency: 'quarterly',
    priority: 7
  },
  {
    code: 'MINIMUM_WAGE',
    category: 'labour',
    name: 'Minimum Wages',
    description: 'National minimum wage',
    unit: 'NGN/Month',
    value: 70000,
    previous: 70000,
    highest: 70000,
    lowest: 18000,
    frequency: 'yearly',
    priority: 8
  },

  // === PRICES ===
  {
    code: 'CPI',
    category: 'prices',
    name: 'Consumer Price Index CPI',
    description: 'Overall consumer price index',
    unit: 'points',
    value: 141,
    previous: 138,
    highest: 141,
    lowest: 86.7,
    frequency: 'monthly',
    priority: 8
  },
  {
    code: 'CORE_CONSUMER_PRICES',
    category: 'prices',
    name: 'Core Consumer Prices',
    description: 'Core inflation excluding food & energy',
    unit: 'points',
    value: 141,
    previous: 138,
    highest: 141,
    lowest: 3.6,
    frequency: 'monthly',
    priority: 6
  },
  {
    code: 'CORE_INFLATION_RATE',
    category: 'prices',
    name: 'Core Inflation Rate',
    description: 'Core inflation percentage',
    unit: 'percent',
    value: 16.82,
    previous: 15.86,
    highest: 29.28,
    lowest: 0.49,
    frequency: 'monthly',
    priority: 8
  },
  {
    code: 'FOOD_INFLATION',
    category: 'prices',
    name: 'Food Inflation',
    description: 'Food price inflation rate',
    unit: 'percent',
    value: 16.96,
    previous: 16.06,
    highest: 40.87,
    lowest: -17.5,
    frequency: 'monthly',
    priority: 9
  },
  {
    code: 'CPI_CLOTHING',
    category: 'prices',
    name: 'CPI Clothing',
    description: 'Clothing price index',
    unit: 'points',
    value: 127,
    previous: 126,
    highest: 127,
    lowest: 92.08,
    frequency: 'monthly',
    priority: 5
  },
  {
    code: 'CPI_EDUCATION',
    category: 'prices',
    name: 'CPI Education',
    description: 'Education cost index',
    unit: 'points',
    value: 136,
    previous: 135,
    highest: 136,
    lowest: 91.66,
    frequency: 'monthly',
    priority: 5
  },
  {
    code: 'CPI_FOOD',
    category: 'prices',
    name: 'CPI Food',
    description: 'Food price index',
    unit: 'points',
    value: 138,
    previous: 134,
    highest: 138,
    lowest: 85.1,
    frequency: 'monthly',
    priority: 7
  },
  {
    code: 'CPI_RECREATION',
    category: 'prices',
    name: 'CPI Recreation and Culture',
    description: 'Recreation cost index',
    unit: 'points',
    value: 115,
    previous: 113,
    highest: 117,
    lowest: 95.19,
    frequency: 'monthly',
    priority: 5
  },
  {
    code: 'CPI_RESTAURANTS',
    category: 'prices',
    name: 'CPI Restaurants and Hotels',
    description: 'Restaurant and hotel cost index',
    unit: 'points',
    value: 153,
    previous: 151,
    highest: 153,
    lowest: 86.51,
    frequency: 'monthly',
    priority: 5
  },
  {
    code: 'CPI_HOUSING',
    category: 'prices',
    name: 'CPI Housing Utilities',
    description: 'Housing and utilities cost index',
    unit: 'points',
    value: 144,
    previous: 140,
    highest: 144,
    lowest: 88.2,
    frequency: 'monthly',
    priority: 6
  },
  {
    code: 'CPI_TRANSPORTATION',
    category: 'prices',
    name: 'CPI Transportation',
    description: 'Transportation cost index',
    unit: 'points',
    value: 139,
    previous: 138,
    highest: 139,
    lowest: 88.2,
    frequency: 'monthly',
    priority: 6
  },
  {
    code: 'GDP_DEFLATOR',
    category: 'prices',
    name: 'GDP Deflator',
    description: 'GDP price deflator',
    unit: 'points',
    value: 216,
    previous: 192,
    highest: 276,
    lowest: 0.6,
    frequency: 'quarterly',
    priority: 6
  },
  {
    code: 'INFLATION_MOM',
    category: 'prices',
    name: 'Inflation Rate MoM',
    description: 'Month-over-month inflation',
    unit: 'percent',
    value: 1.75,
    previous: 2.13,
    highest: 10.7,
    lowest: -3.5,
    frequency: 'monthly',
    priority: 6
  },

  // === MONEY ===
  {
    code: 'INTERBANK_RATE',
    category: 'money',
    name: 'Interbank Rate',
    description: 'Interbank lending rate',
    unit: 'percent',
    value: 22.76,
    previous: 22.74,
    highest: 194,
    lowest: 0,
    frequency: 'daily',
    priority: 7
  },
  {
    code: 'MONEY_SUPPLY_M0',
    category: 'money',
    name: 'Money Supply M0',
    description: 'Monetary base',
    unit: 'NGN Million',
    value: 5689981,
    previous: 5646391,
    highest: 5732860,
    lowest: 38580,
    frequency: 'monthly',
    priority: 6
  },
  {
    code: 'MONEY_SUPPLY_M1',
    category: 'money',
    name: 'Money Supply M1',
    description: 'Narrow money supply',
    unit: 'NGN Million',
    value: 44618639,
    previous: 43757782,
    highest: 44618639,
    lowest: 74221,
    frequency: 'monthly',
    priority: 6
  },
  {
    code: 'MONEY_SUPPLY_M2',
    category: 'money',
    name: 'Money Supply M2',
    description: 'Broad money supply',
    unit: 'NGN Million',
    value: 129201005,
    previous: 124976277,
    highest: 129201005,
    lowest: 648507,
    frequency: 'monthly',
    priority: 7
  },
  {
    code: 'FOREX_RESERVES',
    category: 'money',
    name: 'Foreign Exchange Reserves',
    description: 'External reserves',
    unit: 'USD Million',
    value: 51290,
    previous: 49580,
    highest: 62082,
    lowest: 63.22,
    frequency: 'monthly',
    priority: 9
  },
  {
    code: 'DEPOSIT_INTEREST_RATE',
    category: 'money',
    name: 'Deposit Interest Rate',
    description: 'Bank deposit rate',
    unit: 'percent',
    value: 9.89,
    previous: 9.17,
    highest: 27,
    lowest: 2,
    frequency: 'monthly',
    priority: 6
  },
  {
    code: 'LENDING_RATE',
    category: 'money',
    name: 'Lending Rate',
    description: 'Bank prime lending rate',
    unit: 'percent',
    value: 19.1,
    previous: 18.87,
    highest: 37.8,
    lowest: 6,
    frequency: 'monthly',
    priority: 7
  },
  {
    code: 'MONEY_SUPPLY_M3',
    category: 'money',
    name: 'Money Supply M3',
    description: 'Broadest money measure',
    unit: 'NGN Million',
    value: 129210667,
    previous: 124985937,
    highest: 129210667,
    lowest: 10478417,
    frequency: 'monthly',
    priority: 5
  },

  // === TRADE ===
  {
    code: 'CURRENT_ACCOUNT',
    category: 'trade',
    name: 'Current Account',
    description: 'Current account balance',
    unit: 'USD Million',
    value: 1397,
    previous: 4061,
    highest: 10384,
    lowest: -6119,
    frequency: 'quarterly',
    priority: 7
  },
  {
    code: 'CURRENT_ACCOUNT_GDP',
    category: 'trade',
    name: 'Current Account to GDP',
    description: 'Current account as % of GDP',
    unit: 'percent of GDP',
    value: 5.1,
    previous: 6.8,
    highest: 15.3,
    lowest: -18.7,
    frequency: 'quarterly',
    priority: 6
  },
  {
    code: 'EXPORTS',
    category: 'trade',
    name: 'Exports',
    description: 'Total exports',
    unit: 'NGN Million',
    value: 8879064,
    previous: 5940717,
    highest: 8879064,
    lowest: 323,
    frequency: 'monthly',
    priority: 8
  },
  {
    code: 'IMPORTS',
    category: 'trade',
    name: 'Imports',
    description: 'Total imports',
    unit: 'NGN Million',
    value: 4736895,
    previous: 4509520,
    highest: 6356593,
    lowest: 168,
    frequency: 'monthly',
    priority: 8
  },
  {
    code: 'TERMS_OF_TRADE',
    category: 'trade',
    name: 'Terms of Trade',
    description: 'Export prices relative to import prices',
    unit: 'points',
    value: 102,
    previous: 102,
    highest: 160,
    lowest: 49.48,
    frequency: 'quarterly',
    priority: 6
  },
  {
    code: 'CAPITAL_FLOWS',
    category: 'trade',
    name: 'Capital Flows',
    description: 'Net capital flows',
    unit: 'USD Million',
    value: -1962,
    previous: -788,
    highest: 20303,
    lowest: -16473,
    frequency: 'quarterly',
    priority: 6
  },
  {
    code: 'FDI',
    category: 'trade',
    name: 'Foreign Direct Investment',
    description: 'Net foreign direct investment',
    unit: 'USD Million',
    value: 1113,
    previous: 1456,
    highest: 3085,
    lowest: -558,
    frequency: 'quarterly',
    priority: 7
  },
  {
    code: 'CRUDE_OIL_PRODUCTION',
    category: 'trade',
    name: 'Crude Oil Production',
    description: 'Daily crude oil production',
    unit: 'BBL/D/1K',
    value: 1530,
    previous: 1489,
    highest: 2475,
    lowest: 675,
    frequency: 'monthly',
    priority: 8
  },
  {
    code: 'EXTERNAL_DEBT',
    category: 'trade',
    name: 'External Debt',
    description: 'Total external debt',
    unit: 'USD Million',
    value: 51856,
    previous: 48463,
    highest: 51856,
    lowest: 3288,
    frequency: 'quarterly',
    priority: 8
  },
  {
    code: 'NON_OIL_EXPORTS',
    category: 'trade',
    name: 'Non Oil Exports',
    description: 'Non-oil export value',
    unit: 'NGN Million',
    value: 4041787,
    previous: 2974810,
    highest: 4041787,
    lowest: 29676,
    frequency: 'monthly',
    priority: 7
  },
  {
    code: 'OIL_EXPORTS',
    category: 'trade',
    name: 'Oil Exports',
    description: 'Crude oil export value',
    unit: 'NGN Million',
    value: 4837277,
    previous: 2965907,
    highest: 5483536,
    lowest: 46192,
    frequency: 'monthly',
    priority: 7
  },
  {
    code: 'REMITTANCES',
    category: 'trade',
    name: 'Remittances',
    description: 'Diaspora remittances',
    unit: 'USD Million',
    value: 5724,
    previous: 5452,
    highest: 6284,
    lowest: 3384,
    frequency: 'quarterly',
    priority: 6
  },
  {
    code: 'TERRORISM_INDEX',
    category: 'trade',
    name: 'Terrorism Index',
    description: 'Global terrorism index score',
    unit: 'Points',
    value: 7.79,
    previous: 7.66,
    highest: 9.12,
    lowest: 3.86,
    frequency: 'yearly',
    priority: 5
  },

  // === GOVERNMENT ===
  {
    code: 'GOVT_DEBT_TO_GDP',
    category: 'government',
    name: 'Government Debt to GDP',
    description: 'Public debt as percentage of GDP',
    unit: 'percent of GDP',
    value: 52.9,
    previous: 48.7,
    highest: 75,
    lowest: 7.3,
    frequency: 'yearly',
    priority: 9
  },
  {
    code: 'GOVT_BUDGET',
    category: 'government',
    name: 'Government Budget',
    description: 'Budget balance/surplus',
    unit: 'percent of GDP',
    value: -3.87,
    previous: -3.88,
    highest: 0.8,
    lowest: -8.6,
    frequency: 'yearly',
    priority: 8
  },
  {
    code: 'GOVT_REVENUES',
    category: 'government',
    name: 'Government Revenues',
    description: 'Federal government revenue',
    unit: 'NGN Billion',
    value: 8626,
    previous: 11926,
    highest: 11926,
    lowest: 1119,
    frequency: 'quarterly',
    priority: 7
  },
  {
    code: 'CORRUPTION_INDEX',
    category: 'government',
    name: 'Corruption Index',
    description: 'Corruption perceptions score',
    unit: 'Points',
    value: 26,
    previous: 26,
    highest: 28,
    lowest: 6.9,
    frequency: 'yearly',
    priority: 6
  },
  {
    code: 'CORRUPTION_RANK',
    category: 'government',
    name: 'Corruption Rank',
    description: 'Corruption perceptions ranking',
    unit: 'Rank',
    value: 142,
    previous: 140,
    highest: 154,
    lowest: 52,
    frequency: 'yearly',
    priority: 5
  },
  {
    code: 'CREDIT_RATING',
    category: 'government',
    name: 'Credit Rating',
    description: 'Sovereign credit rating',
    unit: 'Rating',
    value: 26,
    previous: null,
    highest: null,
    lowest: null,
    frequency: 'yearly',
    priority: 7
  },
  {
    code: 'GOVT_DEBT',
    category: 'government',
    name: 'Government Debt',
    description: 'Total public debt',
    unit: 'USD Million',
    value: 110974,
    previous: 103938,
    highest: 114350,
    lowest: 48361,
    frequency: 'quarterly',
    priority: 8
  },
  {
    code: 'GOVT_SPENDING',
    category: 'government',
    name: 'Government Spending',
    description: 'Federal government expenditure',
    unit: 'NGN Million',
    value: 1652430,
    previous: 1542963,
    highest: 2304793,
    lowest: 609792,
    frequency: 'quarterly',
    priority: 7
  },
  {
    code: 'MILITARY_SPENDING',
    category: 'government',
    name: 'Military Expenditure',
    description: 'Defense spending',
    unit: 'USD Million',
    value: 2102,
    previous: 1135,
    highest: 4445,
    lowest: 23.4,
    frequency: 'yearly',
    priority: 5
  },

  // === BUSINESS ===
  {
    code: 'CORPORATE_TAX_RATE',
    category: 'business',
    name: 'Corporate Tax Rate',
    description: 'Company income tax rate',
    unit: 'percent',
    value: 30,
    previous: 30,
    highest: 30,
    lowest: 30,
    frequency: 'yearly',
    priority: 8
  },
  {
    code: 'PERSONAL_INCOME_TAX',
    category: 'business',
    name: 'Personal Income Tax Rate',
    description: 'Personal income tax rate',
    unit: 'percent',
    value: 24,
    previous: 24,
    highest: 24,
    lowest: 24,
    frequency: 'yearly',
    priority: 6
  },
  {
    code: 'SALES_TAX_RATE',
    category: 'business',
    name: 'Sales Tax Rate',
    description: 'VAT rate',
    unit: 'percent',
    value: 7.5,
    previous: 7.5,
    highest: 7.5,
    lowest: 5,
    frequency: 'yearly',
    priority: 7
  },
  {
    code: 'WITHHOLDING_TAX',
    category: 'business',
    name: 'Withholding Tax Rate',
    description: 'Withholding tax rate',
    unit: 'percent',
    value: 10,
    previous: 10,
    highest: 10,
    lowest: 10,
    frequency: 'yearly',
    priority: 5
  }
];

// ==========================================
// EVENTS DATA
// ==========================================

const EVENTS = [
  {
    code: 'CBN_MPC_JUL2026',
    title: 'CBN MPC Meeting',
    description: 'Central Bank Monetary Policy Committee meeting to decide interest rates',
    category: 'mpc',
    importance: 'high',
    source: 'CBN',
    eventDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    eventTime: '9:00 AM',
    duration: '2 days',
    expectedValue: 26.5,
    previousValue: 26.5,
    affectedIndicators: ['INTEREST_RATE', 'INFLATION_RATE', 'FX_RATE'],
    status: 'upcoming',
    isRecurring: true,
    recurringPattern: 'Every 6 weeks',
    location: 'CBN Headquarters, Abuja',
    isVirtual: false
  },
  {
    code: 'INFLATION_RELEASE_JUL2026',
    title: 'Inflation Rate Release',
    description: 'NBS release of July 2026 inflation figures',
    category: 'inflation',
    importance: 'high',
    source: 'NBS',
    eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    eventTime: '10:00 AM',
    expectedValue: 16.2,
    previousValue: 15.93,
    expectedRange: { min: 15.8, max: 16.5 },
    affectedIndicators: ['INFLATION_RATE', 'FOOD_INFLATION', 'CORE_INFLATION_RATE'],
    status: 'upcoming',
    isRecurring: true,
    recurringPattern: 'Monthly',
    isVirtual: true
  },
  {
    code: 'GDP_Q2_2026',
    title: 'Q2 2026 GDP Release',
    description: 'NBS release of Q2 2026 GDP figures',
    category: 'gdp',
    importance: 'high',
    source: 'NBS',
    eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    eventTime: '11:00 AM',
    expectedValue: 3.5,
    previousValue: -19.87,
    affectedIndicators: ['GDP_GROWTH_RATE', 'GDP_ANNUAL_GROWTH', 'GDP_NON_OIL_GROWTH'],
    status: 'upcoming',
    isRecurring: true,
    recurringPattern: 'Quarterly',
    isVirtual: true
  },
  {
    code: 'EMPLOYMENT_Q2_2026',
    title: 'Q2 2026 Employment Report',
    description: 'NBS release of Q2 2026 unemployment statistics',
    category: 'employment',
    importance: 'medium',
    source: 'NBS',
    eventDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days from now
    eventTime: '10:00 AM',
    expectedValue: 5.0,
    previousValue: 4.9,
    affectedIndicators: ['UNEMPLOYMENT_RATE', 'EMPLOYMENT_RATE'],
    status: 'upcoming',
    isRecurring: true,
    recurringPattern: 'Quarterly',
    isVirtual: true
  },
  {
    code: 'FX_REFILL_JUL2026',
    title: 'FX Market Injection',
    description: 'Expected CBN intervention in official FX market',
    category: 'policy',
    importance: 'medium',
    source: 'CBN',
    eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    description: 'CBN to inject additional USD into official market',
    affectedIndicators: ['CURRENCY_USD', 'FOREX_RESERVES'],
    status: 'upcoming',
    isVirtual: true
  }
];

// ==========================================
// SEEDER FUNCTIONS
// ==========================================

/**
 * Seed economic indicators
 */
export async function seedIndicators(options = {}) {
  const { force = false, dryRun = false } = options;

  console.log('🌱 Seeding Economic Indicators...');

  if (dryRun) {
    console.log(`   Would seed ${INDICATORS.length} indicators`);
    return { success: true, count: INDICATORS.length };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const indicator of INDICATORS) {
    try {
      const existing = await EconomicIndicator.findOne({ code: indicator.code });

      if (existing) {
        if (force) {
          // Update existing
          await EconomicIndicator.updateOne(
            { code: indicator.code },
            {
              $set: {
                ...indicator,
                highest: indicator.highest,
                lowest: indicator.lowest,
                highestDate: indicator.highest ? new Date() : null,
                lowestDate: indicator.lowest ? new Date() : null
              }
            }
          );
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Calculate change
        const change = indicator.previous !== null ? indicator.value - indicator.previous : 0;
        const changePercent = indicator.previous !== null && indicator.previous !== 0
          ? ((indicator.value - indicator.previous) / Math.abs(indicator.previous)) * 100
          : 0;

        let trend = 'stable';
        if (change > 0.001) trend = 'up';
        else if (change < -0.001) trend = 'down';

        await EconomicIndicator.create({
          ...indicator,
          change,
          changePercent,
          trend,
          highestDate: indicator.highest ? new Date() : null,
          lowestDate: indicator.lowest ? new Date() : null,
          history: [{
            value: indicator.value,
            timestamp: new Date(),
            source: 'Initial Seeding'
          }]
        });
        created++;
      }
    } catch (error) {
      console.error(`   Error seeding ${indicator.code}:`, error.message);
    }
  }

  console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  return { success: true, created, updated, skipped };
}

/**
 * Seed economic events
 */
export async function seedEvents(options = {}) {
  const { force = false, dryRun = false } = options;

  console.log('🌱 Seeding Economic Events...');

  if (dryRun) {
    console.log(`   Would seed ${EVENTS.length} events`);
    return { success: true, count: EVENTS.length };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const event of EVENTS) {
    try {
      const existing = await EconomicEvent.findOne({ code: event.code });

      if (existing) {
        if (force) {
          await EconomicEvent.updateOne(
            { code: event.code },
            { $set: event }
          );
          updated++;
        } else {
          skipped++;
        }
      } else {
        await EconomicEvent.create(event);
        created++;
      }
    } catch (error) {
      console.error(`   Error seeding event ${event.code}:`, error.message);
    }
  }

  console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  return { success: true, created, updated, skipped };
}

/**
 * Seed all dream module data
 */
export async function seedAll(options = {}) {
  console.log('\n🌱=== Seeding Dream Module Data ===\n');

  const indicatorsResult = await seedIndicators(options);
  const eventsResult = await seedEvents(options);

  console.log('\n✅ Dream Module Seeding Complete!\n');

  return {
    success: true,
    indicators: indicatorsResult,
    events: eventsResult
  };
}

export default {
  seedIndicators,
  seedEvents,
  seedAll,
  INDICATORS,
  EVENTS
};

// SR
