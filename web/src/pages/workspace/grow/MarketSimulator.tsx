import { useState } from "react";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export type CapitalTier = "Beginner" | "Intermediate" | "Expert" | "Genius";

export type PortfolioArchetype = "diverse" | "conservative" | "individual" | "conservative-diverse";

export interface StockTicker {
  symbol: string;
  name: string;
  priceNgn: number;
  changePercent: number;
  sector: string;
  archetype: PortfolioArchetype;
  yieldPercent?: number;
  description: string;
}

export interface PortfolioHolding {
  symbol: string;
  units: number;
  avgBuyPrice: number;
  currentPrice: number;
  archetype: PortfolioArchetype;
}

export const NGX_MARKET_ASSETS: StockTicker[] = [
  // Diverse Equities
  {
    symbol: "GTCO",
    name: "Guaranty Trust Holding Co.",
    priceNgn: 45.5,
    changePercent: 3.2,
    sector: "Banking",
    archetype: "diverse",
    yieldPercent: 8.8,
    description: "Tier-1 Nigerian commercial banking conglomerate.",
  },
  {
    symbol: "MTNN",
    name: "MTN Nigeria Communications",
    priceNgn: 230.0,
    changePercent: 1.8,
    sector: "Telecommunications",
    archetype: "diverse",
    yieldPercent: 6.5,
    description: "Nigeria's largest mobile and data network provider.",
  },
  {
    symbol: "DANGCEM",
    name: "Dangote Cement Plc",
    priceNgn: 650.0,
    changePercent: -0.7,
    sector: "Industrial Goods",
    archetype: "diverse",
    yieldPercent: 5.2,
    description: "Sub-Saharan Africa's leading cement manufacturer.",
  },
  {
    symbol: "ZENITHBANK",
    name: "Zenith Bank Plc",
    priceNgn: 42.0,
    changePercent: 4.5,
    sector: "Banking",
    archetype: "individual",
    yieldPercent: 9.5,
    description: "High-dividend banking giant with solid balance sheet.",
  },
  {
    symbol: "SEPLAT",
    name: "Seplat Energy Plc",
    priceNgn: 3450.0,
    changePercent: 2.1,
    sector: "Oil & Gas",
    archetype: "individual",
    yieldPercent: 7.1,
    description: "Indigenous oil and natural gas producer.",
  },
  // Conservative (Government T-Bills)
  {
    symbol: "TBILL-364D",
    name: "CBN 364-Day Treasury Bill",
    priceNgn: 1000.0,
    changePercent: 0.05,
    sector: "Government Securities",
    archetype: "conservative",
    yieldPercent: 19.8,
    description: "Risk-free sovereign paper backed by the Central Bank of Nigeria.",
  },
  // Conservative Diverse (Mutual Funds)
  {
    symbol: "STANBIC-MMF",
    name: "Stanbic IBTC Money Market Fund",
    priceNgn: 100.0,
    changePercent: 0.12,
    sector: "Asset Management",
    archetype: "conservative-diverse",
    yieldPercent: 16.4,
    description: "Diversified pool of high-quality short-term debt instruments.",
  },
];

export interface MarketSimulatorProps {
  onAwardXp: (xp: number, label: string) => void;
  onBackToAcademy: () => void;
}

export function MarketSimulator({ onAwardXp, onBackToAcademy }: MarketSimulatorProps) {
  const TIER_CAPITAL: Record<CapitalTier, number> = {
    Beginner: 5000,
    Intermediate: 50000,
    Expert: 500000,
    Genius: 5000000,
  };

  const [selectedTier, setSelectedTier] = useState<CapitalTier>("Intermediate");
  const [cashBalanceNgn, setCashBalanceNgn] = useState<number>(50000);
  const [activeArchetypeTab, setActiveArchetypeTab] = useState<"all" | PortfolioArchetype>("all");

  const [holdings, setHoldings] = useState<PortfolioHolding[]>([
    {
      symbol: "GTCO",
      units: 200,
      avgBuyPrice: 42.0,
      currentPrice: 45.5,
      archetype: "diverse",
    },
    {
      symbol: "TBILL-364D",
      units: 20,
      avgBuyPrice: 1000.0,
      currentPrice: 1000.0,
      archetype: "conservative",
    },
  ]);

  const [tradeModalAsset, setTradeModalAsset] = useState<StockTicker | null>(null);
  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy");
  const [tradeUnits, setTradeUnits] = useState<number>(10);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSelectTier = (tier: CapitalTier) => {
    setSelectedTier(tier);
    setCashBalanceNgn(TIER_CAPITAL[tier]);
    setNotification(`Switched to ${tier} Tier: ₦${TIER_CAPITAL[tier].toLocaleString()} virtual cash allocated.`);
  };

  const handleExecuteTrade = () => {
    if (!tradeModalAsset) return;
    const totalCost = tradeModalAsset.priceNgn * tradeUnits;

    if (tradeAction === "buy") {
      if (cashBalanceNgn < totalCost) {
        alert("Insufficient virtual cash balance for this order!");
        return;
      }

      setCashBalanceNgn((prev) => prev - totalCost);
      const existing = holdings.find((h) => h.symbol === tradeModalAsset.symbol);
      if (existing) {
        const totalUnits = existing.units + tradeUnits;
        const totalSpent = existing.units * existing.avgBuyPrice + totalCost;
        const newAvg = totalSpent / totalUnits;
        setHoldings(
          holdings.map((h) =>
            h.symbol === tradeModalAsset.symbol
              ? { ...h, units: totalUnits, avgBuyPrice: newAvg }
              : h
          )
        );
      } else {
        setHoldings([
          ...holdings,
          {
            symbol: tradeModalAsset.symbol,
            units: tradeUnits,
            avgBuyPrice: tradeModalAsset.priceNgn,
            currentPrice: tradeModalAsset.priceNgn,
            archetype: tradeModalAsset.archetype,
          },
        ]);
      }

      onAwardXp(5, `Market Order Executed: Bought ${tradeUnits} units of ${tradeModalAsset.symbol}`);
      triggerXpCelebration(5, `NGX Buy: ${tradeUnits}x ${tradeModalAsset.symbol}`);
      setNotification(`✓ Successfully bought ${tradeUnits} units of ${tradeModalAsset.symbol}! (+5 XP)`);
    } else {
      const existing = holdings.find((h) => h.symbol === tradeModalAsset.symbol);
      if (!existing || existing.units < tradeUnits) {
        alert("You do not own enough units to sell!");
        return;
      }

      setCashBalanceNgn((prev) => prev + totalCost);
      if (existing.units === tradeUnits) {
        setHoldings(holdings.filter((h) => h.symbol !== tradeModalAsset.symbol));
      } else {
        setHoldings(
          holdings.map((h) =>
            h.symbol === tradeModalAsset.symbol
              ? { ...h, units: h.units - tradeUnits }
              : h
          )
        );
      }

      onAwardXp(5, `Market Order Executed: Sold ${tradeUnits} units of ${tradeModalAsset.symbol}`);
      triggerXpCelebration(5, `NGX Sell: ${tradeUnits}x ${tradeModalAsset.symbol}`);
      setNotification(`✓ Successfully sold ${tradeUnits} units of ${tradeModalAsset.symbol}! (+5 XP)`);
    }

    setTradeModalAsset(null);
  };

  const handleEvaluateMarketClose = () => {
    const distinctArchetypes = new Set(holdings.map((h) => h.archetype));
    let bonusXp = 5;
    let breakdown = "Smart Close: Portfolio In Green (+5 XP)";

    if (distinctArchetypes.size >= 2) {
      bonusXp += 14;
      breakdown += " + S3 Risk Diversified across 2+ Archetypes (+14 XP)";
    }

    onAwardXp(bonusXp, breakdown);
    triggerXpCelebration(bonusXp, "Daily NGX Market Close Diversified");
    alert(`🎉 Daily Market Close Evaluated!\n${breakdown}\nTotal Earned: +${bonusXp} XP`);
  };

  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.units * h.currentPrice, 0);
  const totalPortfolioValue = cashBalanceNgn + totalHoldingsValue;
  const initialCap = TIER_CAPITAL[selectedTier];
  const overallPnL = totalPortfolioValue - initialCap;
  const overallPnLPercent = ((overallPnL / initialCap) * 100).toFixed(2);

  const filteredAssets = activeArchetypeTab === "all"
    ? NGX_MARKET_ASSETS
    : NGX_MARKET_ASSETS.filter((a) => a.archetype === activeArchetypeTab);

  return (
    <div
      className="sim-container"
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "36px 20px 90px",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
        color: "#03031d",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .sim-container {
            padding: 14px 12px 100px !important;
          }
          .sim-header {
            padding: 16px 14px !important;
            gap: 14px !important;
            margin-bottom: 16px !important;
          }
          .sim-header h1 {
            font-size: 20px !important;
          }
          .sim-tier-wrap {
            width: 100% !important;
          }
          .sim-tier-dock {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
            overflow-x: visible !important;
            white-space: normal !important;
            box-sizing: border-box !important;
          }
          .sim-tier-dock button {
            min-height: 40px !important;
            padding: 8px 6px !important;
            font-size: 11.5px !important;
            text-align: center !important;
            justify-content: center !important;
            white-space: normal !important;
          }
          .sim-metrics-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin-bottom: 18px !important;
          }
          .sim-metric-card {
            padding: 12px 14px !important;
          }
          .sim-metric-value {
            font-size: 16px !important;
          }
          .sim-archetypes-nav {
            overflow-x: visible !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
            padding-bottom: 0 !important;
          }
          .sim-archetypes-nav button {
            min-height: 38px !important;
            padding: 7px 11px !important;
            font-size: 11.5px !important;
          }
          .sim-assets-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            margin-bottom: 24px !important;
          }
          .sim-holdings-card {
            padding: 16px 14px !important;
          }
          .sim-holdings-table-wrap {
            display: none !important;
          }
          .sim-holdings-mobile-list {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
          }
          .sim-sticky-smart-close {
            display: flex !important;
          }
          .sim-desktop-smart-close {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .sim-holdings-mobile-list {
            display: none !important;
          }
          .sim-sticky-smart-close {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner (Clean White card with Navy accents) */}
      <div
        className="sim-header"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "24px 28px",
          marginBottom: "28px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1.2px",
              color: "#03031d",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "6px",
            }}
          >
            NGX SIMULATOR • CLOSING SESSION
          </span>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 750,
              color: "#03031d",
              margin: 0,
              letterSpacing: "-0.05em",
            }}
          >
            The NGX Trading Floor
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
            Allocate virtual capital across 4 portfolio archetypes driven by real-world NGX closing data.
          </p>
        </div>

        {/* Tier Selector Buttons with Touch Momentum on Mobile */}
        <div className="sim-tier-wrap">
          <span style={{ fontSize: "10px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
            SIMULATION CAPITAL TIER
          </span>
          <div className="sim-tier-dock" style={{ display: "flex", gap: "6px", background: "#f8fafc", padding: "4px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            {(["Beginner", "Intermediate", "Expert", "Genius"] as CapitalTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => handleSelectTier(tier)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: selectedTier === tier ? "1px solid #03031d" : "1px solid transparent",
                  fontSize: "11px",
                  fontWeight: 750,
                  cursor: "pointer",
                  background: selectedTier === tier ? "#03031d" : "transparent",
                  color: selectedTier === tier ? "#ffffff" : "#64748b",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {tier} (₦{TIER_CAPITAL[tier] >= 1000000 ? `${TIER_CAPITAL[tier] / 1000000}M` : `${TIER_CAPITAL[tier] / 1000}k`})
              </button>
            ))}
          </div>
        </div>
      </div>

      {notification && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "6px",
            padding: "10px 16px",
            marginBottom: "20px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#16a34a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: "transparent", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div
        className="sim-metrics-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "28px",
        }}
      >
        <div className="sim-metric-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "18px 20px", boxShadow: "0 2px 6px rgba(3,3,29,0.03)" }}>
          <span style={{ fontSize: "10px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Available Cash</span>
          <div className="sim-metric-value" style={{ fontSize: "22px", fontWeight: 800, color: "#03031d", marginTop: "4px", letterSpacing: "-0.03em" }}>
            ₦{cashBalanceNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>Ready for deployment</span>
        </div>

        <div className="sim-metric-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "18px 20px", boxShadow: "0 2px 6px rgba(3,3,29,0.03)" }}>
          <span style={{ fontSize: "10px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Invested Positions</span>
          <div className="sim-metric-value" style={{ fontSize: "22px", fontWeight: 800, color: "#03031d", marginTop: "4px", letterSpacing: "-0.03em" }}>
            ₦{totalHoldingsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>{holdings.length} Active Holdings</span>
        </div>

        <div className="sim-metric-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "18px 20px", boxShadow: "0 2px 6px rgba(3,3,29,0.03)" }}>
          <span style={{ fontSize: "10px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Total Portfolio Value</span>
          <div className="sim-metric-value" style={{ fontSize: "22px", fontWeight: 800, color: "#03031d", marginTop: "4px", letterSpacing: "-0.03em" }}>
            ₦{totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: "11px", fontWeight: 750, color: overallPnL >= 0 ? "#16a34a" : "#dc2626" }}>
            {overallPnL >= 0 ? "+" : ""}₦{overallPnL.toLocaleString()} ({overallPnLPercent}%)
          </span>
        </div>

        <div className="sim-metric-card sim-desktop-smart-close" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 2px 6px rgba(3,3,29,0.03)" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Daily Market Close</span>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700, display: "block", marginTop: "2px" }}>
              ✓ 2+ Archetypes Active
            </span>
          </div>
          <button
            type="button"
            onClick={handleEvaluateMarketClose}
            style={{
              width: "100%",
              padding: "10px",
              background: "#03031d",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "11px",
              letterSpacing: "0.5px",
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            EVALUATE SMART CLOSE (+19 XP)
          </button>
        </div>
      </div>

      {/* 4 Archetypes Filter Navigation Tabs */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div className="sim-archetypes-nav" style={{ display: "flex", gap: "6px", flexWrap: "wrap", width: "100%" }}>
            {[
              { id: "all", label: "All NGX Assets" },
              { id: "diverse", label: "Diverse Equities" },
              { id: "conservative", label: "Conservative (T-Bills)" },
              { id: "individual", label: "Individual Stocks" },
              { id: "conservative-diverse", label: "Mutual Funds" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveArchetypeTab(tab.id as any)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "4px",
                  border: activeArchetypeTab === tab.id ? "1px solid #03031d" : "1px solid #e2e8f0",
                  background: activeArchetypeTab === tab.id ? "#03031d" : "#ffffff",
                  color: activeArchetypeTab === tab.id ? "#ffffff" : "#64748b",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onBackToAcademy}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#03031d",
              padding: "7px 14px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            ← Return to Stages
          </button>
        </div>
      </div>

      {/* Assets Grid */}
      <div
        className="sim-assets-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
          marginBottom: "36px",
        }}
      >
        {filteredAssets.map((asset) => {
          const isUp = asset.changePercent >= 0;
          return (
            <div
              key={asset.symbol}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                boxShadow: "0 2px 6px rgba(3, 3, 29, 0.04)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#03031d", letterSpacing: "-0.02em" }}>
                      {asset.symbol}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "2px" }}>
                      {asset.name}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#03031d" }}>
                      ₦{asset.priceNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 750,
                        color: isUp ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {isUp ? "+" : ""}{asset.changePercent}%
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: "12px", color: "#64748b", margin: "10px 0 0", lineHeight: 1.5 }}>
                  {asset.description}
                </p>

                {asset.yieldPercent && (
                  <div style={{ marginTop: "8px" }}>
                    <span style={{ fontSize: "10px", background: "#f0fdf4", border: "1px solid #dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "3px", fontWeight: 750 }}>
                      ⚡ Yield: {asset.yieldPercent}% p.a.
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setTradeModalAsset(asset);
                    setTradeAction("buy");
                    setTradeUnits(10);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#03031d",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: 800,
                    fontSize: "11px",
                    cursor: "pointer",
                    letterSpacing: "0.5px",
                  }}
                >
                  BUY {asset.symbol}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTradeModalAsset(asset);
                    setTradeAction("sell");
                    setTradeUnits(10);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#ffffff",
                    color: "#03031d",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontWeight: 750,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  SELL
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Portfolio Holdings Section */}
      <div
        className="sim-holdings-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          padding: "20px 24px",
          boxShadow: "0 2px 6px rgba(3, 3, 29, 0.04)",
          marginBottom: "30px",
        }}
      >
        <span style={{ fontSize: "10px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.2px", display: "block", marginBottom: "4px" }}>
          PORTFOLIO LEDGER
        </span>
        <h3 style={{ fontSize: "18px", fontWeight: 750, color: "#03031d", margin: "0 0 16px", letterSpacing: "-0.04em" }}>
          Active Positions ({holdings.length})
        </h3>

        {holdings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "13px" }}>
            No active positions yet. Select an NGX asset above to place your first trade!
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="sim-holdings-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "10px 8px" }}>Asset</th>
                    <th style={{ padding: "10px 8px" }}>Units</th>
                    <th style={{ padding: "10px 8px" }}>Avg Buy Price</th>
                    <th style={{ padding: "10px 8px" }}>Current Price</th>
                    <th style={{ padding: "10px 8px" }}>Market Value</th>
                    <th style={{ padding: "10px 8px" }}>Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const mktVal = h.units * h.currentPrice;
                    const pnl = mktVal - (h.units * h.avgBuyPrice);
                    const pnlPct = (((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100).toFixed(2);
                    const isGain = pnl >= 0;

                    return (
                      <tr key={h.symbol} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 8px", fontWeight: 800, color: "#03031d" }}>
                          {h.symbol}
                        </td>
                        <td style={{ padding: "12px 8px", color: "#334155" }}>{h.units}</td>
                        <td style={{ padding: "12px 8px", color: "#334155" }}>₦{h.avgBuyPrice.toFixed(2)}</td>
                        <td style={{ padding: "12px 8px", color: "#334155" }}>₦{h.currentPrice.toFixed(2)}</td>
                        <td style={{ padding: "12px 8px", fontWeight: 750, color: "#03031d" }}>₦{mktVal.toLocaleString()}</td>
                        <td style={{ padding: "12px 8px", fontWeight: 750, color: isGain ? "#16a34a" : "#dc2626" }}>
                          {isGain ? "+" : ""}₦{pnl.toFixed(2)} ({pnlPct}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Native Card Rows (No sideways scrolling) */}
            <div className="sim-holdings-mobile-list">
              {holdings.map((h) => {
                const mktVal = h.units * h.currentPrice;
                const pnl = mktVal - (h.units * h.avgBuyPrice);
                const pnlPct = (((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100).toFixed(2);
                const isGain = pnl >= 0;

                return (
                  <div
                    key={h.symbol}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "#03031d" }}>
                          {h.symbol}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 750, background: "#ebebfa", color: "#24248f", padding: "1px 6px", borderRadius: "3px", textTransform: "uppercase" }}>
                          {h.archetype}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: isGain ? "#15803d" : "#b91c1c",
                          background: isGain ? "#dcfce7" : "#fee2e2",
                          padding: "2px 7px",
                          borderRadius: "4px",
                        }}
                      >
                        {isGain ? "+" : ""}₦{pnl.toFixed(0)} ({pnlPct}%)
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11.5px", color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                      <div>Units: <strong style={{ color: "#03031d" }}>{h.units}</strong></div>
                      <div>Avg Buy: <strong style={{ color: "#03031d" }}>₦{h.avgBuyPrice.toFixed(2)}</strong></div>
                      <div>Current: <strong style={{ color: "#03031d" }}>₦{h.currentPrice.toFixed(2)}</strong></div>
                      <div>Position: <strong style={{ color: "#03031d" }}>₦{mktVal.toLocaleString()}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Dock on Mobile for Smart Close */}
      <div
        className="sim-sticky-smart-close"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255, 255, 255, 0.95)",
          borderTop: "1px solid #e2e8f0",
          padding: "10px 16px",
          zIndex: 50,
          backdropFilter: "blur(8px)",
          boxShadow: "0 -4px 14px rgba(3, 3, 29, 0.08)",
        }}
      >
        <button
          type="button"
          onClick={handleEvaluateMarketClose}
          style={{
            width: "100%",
            padding: "13px",
            background: "#03031d",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 800,
            fontSize: "12px",
            letterSpacing: "0.5px",
            minHeight: "46px",
            cursor: "pointer",
          }}
        >
          🎯 EVALUATE DAILY SMART CLOSE (+19 XP)
        </button>
      </div>

      {/* Trade Execution Modal */}
      {tradeModalAsset && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 3, 29, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "26px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 12px 40px rgba(3,3,29,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#03031d", letterSpacing: "-0.03em" }}>
                Order Desk • {tradeAction.toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setTradeModalAsset(null)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 14px", borderRadius: "6px", marginBottom: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#03031d" }}>{tradeModalAsset.symbol}</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{tradeModalAsset.name}</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#16a34a", marginTop: "6px" }}>
                ₦{tradeModalAsset.priceNgn.toFixed(2)} per unit
              </div>
            </div>

            {/* Units Input */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "10px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
                UNITS TO TRADE
              </label>
              <input
                type="number"
                min="1"
                value={tradeUnits}
                onChange={(e) => setTradeUnits(Math.max(1, Number(e.target.value)))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#03031d",
                  fontSize: "15px",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "20px", color: "#64748b" }}>
              <span>Total Capital Required:</span>
              <strong style={{ color: "#03031d", fontSize: "15px" }}>
                ₦{(tradeModalAsset.priceNgn * tradeUnits).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleExecuteTrade}
              style={{
                width: "100%",
                padding: "12px",
                background: tradeAction === "buy" ? "#03031d" : "#dc2626",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                cursor: "pointer",
              }}
            >
              CONFIRM {tradeAction.toUpperCase()} ORDER (+5 XP)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
