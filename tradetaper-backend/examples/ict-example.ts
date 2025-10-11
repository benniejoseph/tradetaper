/**
 * ICT System - Practical Examples
 * 
 * This file shows you exactly how to use the ICT services
 * Copy and paste these examples into your code!
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 1: Simple Kill Zone Check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { KillZoneService } from '../src/market-intelligence/ict/kill-zone.service';

async function checkKillZone() {
  const killZoneService = new KillZoneService();
  const killZones = killZoneService.analyzeKillZones();

  console.log('\n🕐 KILL ZONE CHECK:');
  console.log(killZones.analysis.join('\n'));
  console.log('\n' + killZones.recommendations.join('\n'));

  // Quick decision
  if (killZones.isOptimalTradingTime) {
    console.log('\n✅ OPTIMAL TIME - Ready to trade!');
  } else {
    console.log('\n⏸️ WAIT - Outside optimal windows');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 2: Complete ICT Analysis with Price Data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { ICTMasterService } from '../src/market-intelligence/ict/ict-master.service';
import { LiquidityAnalysisService } from '../src/market-intelligence/ict/liquidity-analysis.service';
import { MarketStructureService } from '../src/market-intelligence/ict/market-structure.service';
import { FairValueGapService } from '../src/market-intelligence/ict/fair-value-gap.service';
import { OrderBlockService } from '../src/market-intelligence/ict/order-block.service';
import { PremiumDiscountService } from '../src/market-intelligence/ict/premium-discount.service';
import { PowerOfThreeService } from '../src/market-intelligence/ict/power-of-three.service';

async function completeICTAnalysis() {
  // Sample price data (replace with real data from Yahoo Finance, Binance, etc.)
  const priceData = [
    { timestamp: '2024-01-01T00:00:00Z', open: 1.0800, high: 1.0850, low: 1.0780, close: 1.0820, volume: 10000 },
    { timestamp: '2024-01-01T01:00:00Z', open: 1.0820, high: 1.0880, low: 1.0810, close: 1.0860, volume: 12000 },
    { timestamp: '2024-01-01T02:00:00Z', open: 1.0860, high: 1.0900, low: 1.0850, close: 1.0870, volume: 15000 },
    // ... add more candles (at least 50-100 for good analysis)
  ];

  // Initialize services
  const liquidityService = new LiquidityAnalysisService();
  const structureService = new MarketStructureService();
  const fvgService = new FairValueGapService();
  const obService = new OrderBlockService();
  const killZoneService = new KillZoneService();
  const pdService = new PremiumDiscountService();
  const potService = new PowerOfThreeService();

  const ictMaster = new ICTMasterService(
    liquidityService,
    structureService,
    fvgService,
    obService,
    killZoneService
  );

  // Run complete ICT analysis
  const analysis = await ictMaster.analyzeComplete('EURUSD', priceData, '1H');

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          ICT COMPLETE ANALYSIS                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`ICT Score: ${analysis.ictScore}/100`);
  console.log(`Overall Bias: ${analysis.overallBias.toUpperCase()}`);
  console.log(`Confidence: ${analysis.confidence}%`);
  console.log(`Primary Setup: ${analysis.primarySetup}`);

  console.log('\n📍 ENTRY ZONES:');
  analysis.entryZones.forEach((zone, i) => {
    console.log(`\n${i + 1}. ${zone.type}:`);
    console.log(`   Direction: ${zone.direction}`);
    console.log(`   Range: ${zone.range.low.toFixed(2)} - ${zone.range.high.toFixed(2)}`);
    console.log(`   ${zone.description}`);
  });

  console.log('\n📊 ANALYSIS:');
  analysis.analysis.forEach(line => console.log(line));

  console.log('\n🎯 TRADING PLAN:');
  analysis.tradingPlan.forEach(line => console.log(line));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 3: ICT AI Agent (Pure ICT Signals)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { ICTAIAgentService } from '../src/market-intelligence/ict/ict-ai-agent.service';

async function getICTSignal() {
  const priceData = [
    // Your price data here
  ];

  const liquidityService = new LiquidityAnalysisService();
  const structureService = new MarketStructureService();
  const fvgService = new FairValueGapService();
  const obService = new OrderBlockService();
  const killZoneService = new KillZoneService();
  const pdService = new PremiumDiscountService();
  const potService = new PowerOfThreeService();

  const ictAgent = new ICTAIAgentService(
    liquidityService,
    structureService,
    fvgService,
    obService,
    killZoneService,
    pdService,
    potService
  );

  const signal = await ictAgent.analyze('EURUSD', priceData, '1H');

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          ICT AI AGENT DECISION                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`Signal: ${signal.signal.toUpperCase()}`);
  console.log(`Confidence: ${signal.confidence}%`);
  console.log(`ICT Score: ${signal.ictScore}/100`);

  console.log('\n📖 THE ICT STORY:');
  signal.ictNarrative.forEach(line => console.log(line));

  console.log(`\n🎯 PRIMARY SETUP:\n${signal.primarySetup}`);

  if (signal.entryZone) {
    console.log('\n📍 ENTRY ZONE:');
    console.log(`   Type: ${signal.entryZone.type}`);
    console.log(`   Price: ${signal.entryZone.price.toFixed(2)}`);
    console.log(`   Range: ${signal.entryZone.range.low.toFixed(2)} - ${signal.entryZone.range.high.toFixed(2)}`);
    console.log(`   ${signal.entryZone.description}`);
  }

  console.log('\n🛑 STOP LOSS:');
  console.log(`   ${signal.stopLoss.price.toFixed(2)}`);
  console.log(`   ${signal.stopLoss.reasoning}`);

  console.log('\n🎯 TAKE PROFIT:');
  signal.takeProfit.forEach(tp => {
    console.log(`   TP${tp.level}: ${tp.target.toFixed(2)} - ${tp.reasoning}`);
  });

  console.log(`\n💰 RISK/REWARD: ${signal.riskReward.toFixed(2)}:1`);

  // Trading decision
  console.log('\n🎯 DECISION:');
  if (signal.confidence >= 70 && signal.killZoneStatus.isOptimal) {
    console.log('   ✅ EXECUTE TRADE');
  } else {
    console.log('   ⏸️ WAIT FOR BETTER SETUP');
    if (!signal.killZoneStatus.isOptimal) {
      console.log('   Reason: Outside Kill Zone');
    }
    if (signal.confidence < 70) {
      console.log(`   Reason: Low confidence (${signal.confidence}%)`);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 4: Premium/Discount Analysis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function checkPremiumDiscount() {
  const priceData = [
    // Your price data
  ];

  const pdService = new PremiumDiscountService();
  const pd = await pdService.analyzePremiumDiscount('EURUSD', priceData, '1H');

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          PREMIUM/DISCOUNT ANALYSIS                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`Current Price: ${pd.currentPrice.toFixed(2)}`);
  console.log(`Current Zone: ${pd.currentZone.toUpperCase()}`);
  console.log(`Position in Range: ${pd.percentageInRange.toFixed(1)}%`);
  console.log(`Trading Bias: ${pd.tradingBias}`);

  console.log('\n📊 FIBONACCI LEVELS:');
  console.log(`   0%:    ${pd.fibLevels.level_0.toFixed(2)} (Full Discount)`);
  console.log(`   23.6%: ${pd.fibLevels.level_236.toFixed(2)}`);
  console.log(`   38.2%: ${pd.fibLevels.level_382.toFixed(2)}`);
  console.log(`   50%:   ${pd.fibLevels.level_50.toFixed(2)} ⭐ Equilibrium`);
  console.log(`   61.8%: ${pd.fibLevels.level_618.toFixed(2)} ⭐ OTE`);
  console.log(`   78.6%: ${pd.fibLevels.level_786.toFixed(2)} ⭐ OTE`);
  console.log(`   100%:  ${pd.fibLevels.level_100.toFixed(2)} (Full Premium)`);

  console.log('\n💡 REASONING:');
  pd.reasoning.forEach(line => console.log(line));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 5: Power of Three (AMD Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function checkPowerOfThree() {
  const priceData = [
    // Your price data
  ];

  const potService = new PowerOfThreeService();
  const pot = await potService.analyzePowerOfThree('EURUSD', priceData, '1H');

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          POWER OF THREE ANALYSIS                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`Current Phase: ${pot.currentPhase.toUpperCase()}`);
  console.log(`Confidence: ${pot.phaseConfidence}%`);
  console.log(`Time in Phase: ${pot.timeInPhase} candles`);

  console.log(`\n${pot.phaseDescription}`);

  console.log('\n📈 EXPECTED NEXT MOVE:');
  console.log(pot.expectedNextMove);

  console.log('\n🎯 TRADING STRATEGY:');
  pot.tradingStrategy.forEach(line => console.log(line));

  if (pot.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    pot.warnings.forEach(warning => console.log(warning));
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 6: Complete Trading Dashboard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function tradingDashboard(symbol: string, priceData: any[]) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log(`║          ICT TRADING DASHBOARD - ${symbol}                 ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Initialize all services
  const killZoneService = new KillZoneService();
  const liquidityService = new LiquidityAnalysisService();
  const structureService = new MarketStructureService();
  const fvgService = new FairValueGapService();
  const obService = new OrderBlockService();
  const pdService = new PremiumDiscountService();
  const potService = new PowerOfThreeService();
  const ictAgent = new ICTAIAgentService(
    liquidityService,
    structureService,
    fvgService,
    obService,
    killZoneService,
    pdService,
    potService
  );

  // 1. Kill Zone
  const killZone = killZoneService.analyzeKillZones();
  console.log(`🕐 KILL ZONE: ${killZone.activeKillZone?.name || 'Outside'}`);
  console.log(`   ${killZone.isOptimalTradingTime ? '✅ OPTIMAL TIME' : '⏸️ Wait for London/NY'}\n`);

  // 2. Power of Three
  const pot = await potService.analyzePowerOfThree(symbol, priceData, '1H');
  console.log(`⚡ POWER OF THREE: ${pot.currentPhase.toUpperCase()}`);
  console.log(`   Confidence: ${pot.phaseConfidence}%\n`);

  // 3. Premium/Discount
  const pd = await pdService.analyzePremiumDiscount(symbol, priceData, '1H');
  console.log(`💰 PREMIUM/DISCOUNT: ${pd.currentZone.toUpperCase()}`);
  console.log(`   Bias: ${pd.tradingBias}\n`);

  // 4. Market Structure
  const structure = await structureService.analyzeMarketStructure(symbol, priceData, '1H');
  console.log(`📐 MARKET STRUCTURE: ${structure.trend.toUpperCase()}`);
  console.log(`   Bias: ${structure.tradingBias}\n`);

  // 5. ICT AI Decision
  const signal = await ictAgent.analyze(symbol, priceData, '1H');
  console.log(`🤖 ICT AI AGENT:`);
  console.log(`   Signal: ${signal.signal.toUpperCase()}`);
  console.log(`   Confidence: ${signal.confidence}%`);
  console.log(`   ICT Score: ${signal.ictScore}/100\n`);

  // 6. Trading Decision
  console.log(`🎯 TRADING DECISION:`);
  if (signal.confidence >= 70 && killZone.isOptimalTradingTime) {
    console.log('   ✅ EXECUTE TRADE');
    console.log(`   Setup: ${signal.primarySetup}`);
    if (signal.entryZone) {
      console.log(`   Entry: ${signal.entryZone.price.toFixed(2)}`);
    }
    console.log(`   Stop: ${signal.stopLoss.price.toFixed(2)}`);
    if (signal.takeProfit.length > 0) {
      console.log(`   Target: ${signal.takeProfit[0].target.toFixed(2)}`);
    }
    console.log(`   R:R: ${signal.riskReward.toFixed(2)}:1`);
  } else {
    console.log('   ⏸️ WAIT FOR BETTER SETUP');
    if (!killZone.isOptimalTradingTime) {
      console.log('   Reason: Outside Kill Zone');
    }
    if (signal.confidence < 70) {
      console.log(`   Reason: Low confidence (${signal.confidence}%)`);
    }
  }

  console.log('\n' + '═'.repeat(60) + '\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUN EXAMPLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Uncomment to run examples:

// checkKillZone();
// completeICTAnalysis();
// getICTSignal();
// checkPremiumDiscount();
// checkPowerOfThree();
// tradingDashboard('EURUSD', priceData);

// Run dashboard every 5 minutes
// setInterval(() => tradingDashboard('EURUSD', priceData), 5 * 60 * 1000);

export {
  checkKillZone,
  completeICTAnalysis,
  getICTSignal,
  checkPremiumDiscount,
  checkPowerOfThree,
  tradingDashboard,
};

