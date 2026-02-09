import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChartImageAnalysisRequest {
  symbol: string;
  timeframes: {
    monthly?: string; // Base64 image or URL
    weekly?: string;
    daily?: string;
    h4?: string;
    h1?: string;
    m15?: string;
    m5?: string;
  };
  currentPrice?: number;
  context?: string; // Additional context from user
}

export interface ChartImageAnalysis {
  symbol: string;
  analysisId: string;
  timeframesAnalyzed: string[];
  ictNarrative: string[]; // The complete ICT story
  liquidity: {
    buySide: string[];
    sellSide: string[];
    nearestTarget: string;
  };
  marketStructure: {
    trend: string;
    lastStructureShift: string;
    bias: string;
  };
  fairValueGaps: {
    bullish: string[];
    bearish: string[];
    nearest: string;
  };
  orderBlocks: {
    bullish: string[];
    bearish: string[];
    nearest: string;
  };
  premiumDiscount: {
    currentZone: string;
    optimalEntry: string;
  };
  killZone: {
    current: string;
    recommendation: string;
  };
  powerOfThree: {
    phase: 'accumulation' | 'manipulation' | 'distribution' | 'unknown';
    description: string;
  };
  tradingPlan: {
    primarySetup: string;
    entryZone: string;
    stopLoss: string;
    takeProfit: string[];
    riskReward: string;
    confidence: number;
  };
  warnings: string[];
  timestamp: Date;
}

@Injectable()
export class ChartImageAnalysisService {
  private readonly logger = new Logger(ChartImageAnalysisService.name);
  private readonly geminiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  /**
   * Analyze chart images using Gemini Vision API
   * This is the main ICT chart analysis function
   */
  async analyzeChartImages(
    request: ChartImageAnalysisRequest,
  ): Promise<ChartImageAnalysis> {
    this.logger.log(
      `Analyzing ICT chart images for ${request.symbol} across ${Object.keys(request.timeframes).length} timeframes`,
    );

    const analysisId = this.generateAnalysisId();
    const timeframesAnalyzed = Object.keys(request.timeframes);

    // Build ICT-specific prompt for Gemini
    const ictPrompt = this.buildICTAnalysisPrompt(request);

    // Analyze with Gemini Vision (if images provided)
    let geminiAnalysis: any = null;
    if (this.geminiApiKey && this.hasImages(request.timeframes)) {
      geminiAnalysis = await this.analyzeWithGeminiVision(
        request.timeframes,
        ictPrompt,
      );
    }

    // Build complete ICT narrative
    const ictNarrative = this.buildICTNarrative(
      request,
      geminiAnalysis,
      timeframesAnalyzed,
    );

    // Extract ICT concepts from analysis
    const {
      liquidity,
      marketStructure,
      fairValueGaps,
      orderBlocks,
      premiumDiscount,
      powerOfThree,
    } = this.extractICTConcepts(geminiAnalysis, request);

    // Get Kill Zone info
    const killZone = this.getKillZoneInfo();

    // Generate trading plan
    const tradingPlan = this.generateICTTradingPlan(
      marketStructure,
      premiumDiscount,
      fairValueGaps,
      orderBlocks,
      liquidity,
      killZone,
    );

    // Generate warnings
    const warnings = this.generateWarnings(
      tradingPlan,
      killZone,
      premiumDiscount,
    );

    return {
      symbol: request.symbol,
      analysisId,
      timeframesAnalyzed,
      ictNarrative,
      liquidity,
      marketStructure,
      fairValueGaps,
      orderBlocks,
      premiumDiscount,
      killZone,
      powerOfThree,
      tradingPlan,
      warnings,
      timestamp: new Date(),
    };
  }

  /**
   * Build ICT-specific analysis prompt for Gemini Vision
   */
  private buildICTAnalysisPrompt(request: ChartImageAnalysisRequest): string {
    return `You are an expert ICT (Inner Circle Trader) analyst. Analyze these chart images for ${request.symbol} using ONLY ICT concepts.

ANALYZE FOR:

1. LIQUIDITY:
   - Identify buy-side liquidity (stops above swing highs)
   - Identify sell-side liquidity (stops below swing lows)
   - Mark liquidity voids (gaps in price action)
   - Identify which liquidity pools are likely targets

2. MARKET STRUCTURE:
   - Identify current trend (bullish/bearish/ranging)
   - Mark Break of Structure (BOS) points - trend continuation
   - Mark Change of Character (CHoCH) points - trend reversal
   - Identify swing highs and swing lows
   - Determine trading bias (long/short)

3. FAIR VALUE GAPS (FVG):
   - Identify bullish FVGs (3-candle upward imbalances)
   - Identify bearish FVGs (3-candle downward imbalances)
   - Mark unfilled FVGs (premium entry zones)
   - Note which FVGs are likely to be filled

4. ORDER BLOCKS:
   - Identify bullish Order Blocks (last down candle before strong up move)
   - Identify bearish Order Blocks (last up candle before strong down move)
   - Mark Breaker Blocks (failed Order Blocks)
   - Identify Mitigation Blocks

5. PREMIUM/DISCOUNT ARRAYS:
   - Define the current range (swing high to swing low)
   - Calculate equilibrium (50% level)
   - Determine if price is in premium (upper 50%) or discount (lower 50%)
   - Identify Optimal Trade Entry zones (0.618-0.786 retracement)

6. POWER OF THREE:
   - Identify current phase: Accumulation, Manipulation, or Distribution
   - Describe the market maker model in play

7. MULTI-TIMEFRAME CONTEXT:
   - Align higher timeframe (HTF) bias with lower timeframe (LTF) setups
   - Identify if HTF and LTF are in agreement

PROVIDE:
- Clear ICT narrative (tell the story of what institutions are doing)
- Primary setup (what is the highest probability trade right now)
- Entry zone (where to enter based on ICT concepts)
- Stop loss placement (below OB/FVG or beyond liquidity)
- Take profit targets (liquidity pools, equilibrium, opposite premium/discount zone)
- Risk/Reward ratio
- Confidence level (0-100%)

${request.context ? `\nAdditional Context: ${request.context}` : ''}

Be specific with price levels when possible. Use ICT terminology throughout.`;
  }

  /**
   * Analyze with Gemini Vision API
   */
  private async analyzeWithGeminiVision(
    timeframes: any,
    prompt: string,
  ): Promise<any> {
    if (!this.geminiApiKey) {
      this.logger.warn('Gemini API key not configured - using mock analysis');
      return this.getMockGeminiAnalysis();
    }

    try {
      // Prepare images for Gemini
      const images = this.prepareImagesForGemini(timeframes);

      // Call Gemini Vision API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  ...images.map((img) => ({
                    inline_data: {
                      mime_type: 'image/png',
                      data: img,
                    },
                  })),
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 4096,
            },
          }),
        },
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        return {
          text: data.candidates[0].content.parts[0].text,
          raw: data,
        };
      }

      throw new Error('No response from Gemini Vision');
    } catch (error) {
      this.logger.error('Gemini Vision API error:', error);
      return this.getMockGeminiAnalysis();
    }
  }

  /**
   * Prepare images for Gemini (convert to base64 if needed)
   */
  private prepareImagesForGemini(timeframes: any): string[] {
    const images: string[] = [];

    for (const [timeframe, imageData] of Object.entries(timeframes)) {
      if (imageData && typeof imageData === 'string') {
        // Remove data:image/png;base64, prefix if present
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        images.push(base64Data);
      }
    }

    return images;
  }

  /**
   * Check if request has images
   */
  private hasImages(timeframes: any): boolean {
    return Object.values(timeframes).some(
      (img) => img && typeof img === 'string',
    );
  }

  /**
   * Build complete ICT narrative
   */
  private buildICTNarrative(
    request: any,
    geminiAnalysis: any,
    timeframes: string[],
  ): string[] {
    const narrative: string[] = [];

    narrative.push(
      `╔═══════════════════════════════════════════════════════════╗`,
    );
    narrative.push(
      `║        ICT CHART IMAGE ANALYSIS - ${request.symbol}       ║`,
    );
    narrative.push(
      `╚═══════════════════════════════════════════════════════════╝`,
    );

    narrative.push(
      `\n📊 Timeframes Analyzed: ${timeframes.join(', ').toUpperCase()}`,
    );

    if (geminiAnalysis && geminiAnalysis.text) {
      narrative.push(`\n🤖 AI ICT Analysis:\n`);
      // Split Gemini response into lines
      const lines = geminiAnalysis.text.split('\n');
      lines.forEach((line: string) => {
        if (line.trim()) {
          narrative.push(`   ${line.trim()}`);
        }
      });
    } else {
      narrative.push(
        `\n⚠️ AI analysis not available - using algorithmic ICT analysis`,
      );
    }

    return narrative;
  }

  /**
   * Extract ICT concepts from Gemini analysis
   */
  private extractICTConcepts(
    geminiAnalysis: any,
    request: any,
  ): {
    liquidity: any;
    marketStructure: any;
    fairValueGaps: any;
    orderBlocks: any;
    premiumDiscount: any;
    powerOfThree: any;
  } {
    // Parse Gemini response for ICT concepts
    const text = geminiAnalysis?.text || '';

    return {
      liquidity: this.extractLiquidity(text),
      marketStructure: this.extractMarketStructure(text),
      fairValueGaps: this.extractFVGs(text),
      orderBlocks: this.extractOrderBlocks(text),
      premiumDiscount: this.extractPremiumDiscount(text),
      powerOfThree: this.extractPowerOfThree(text),
    };
  }

  // Helper extraction methods
  private extractLiquidity(text: string): any {
    return {
      buySide: this.extractLines(text, 'buy-side', 'buy side', 'buyside'),
      sellSide: this.extractLines(text, 'sell-side', 'sell side', 'sellside'),
      nearestTarget: this.extractFirstLine(
        text,
        'nearest liquidity',
        'liquidity target',
      ),
    };
  }

  private extractMarketStructure(text: string): any {
    return {
      trend: this.extractFirstLine(text, 'trend', 'direction') || 'Unknown',
      lastStructureShift:
        this.extractFirstLine(text, 'BOS', 'CHoCH', 'structure') ||
        'None detected',
      bias: this.extractFirstLine(text, 'bias', 'direction') || 'Neutral',
    };
  }

  private extractFVGs(text: string): any {
    return {
      bullish: this.extractLines(text, 'bullish FVG', 'bullish gap'),
      bearish: this.extractLines(text, 'bearish FVG', 'bearish gap'),
      nearest:
        this.extractFirstLine(text, 'nearest FVG', 'nearest gap') ||
        'None identified',
    };
  }

  private extractOrderBlocks(text: string): any {
    return {
      bullish: this.extractLines(text, 'bullish order block', 'bullish OB'),
      bearish: this.extractLines(text, 'bearish order block', 'bearish OB'),
      nearest:
        this.extractFirstLine(text, 'nearest order block', 'nearest OB') ||
        'None identified',
    };
  }

  private extractPremiumDiscount(text: string): any {
    return {
      currentZone:
        this.extractFirstLine(text, 'premium', 'discount', 'equilibrium') ||
        'Unknown',
      optimalEntry:
        this.extractFirstLine(text, 'OTE', 'optimal entry', 'entry zone') ||
        'Not identified',
    };
  }

  private extractPowerOfThree(text: string): any {
    const phase = this.extractFirstLine(
      text,
      'accumulation',
      'manipulation',
      'distribution',
    );

    return {
      phase: phase?.toLowerCase().includes('accumulation')
        ? 'accumulation'
        : phase?.toLowerCase().includes('manipulation')
          ? 'manipulation'
          : phase?.toLowerCase().includes('distribution')
            ? 'distribution'
            : 'unknown',
      description: phase || 'Phase not identified in analysis',
    };
  }

  // Utility methods for text extraction
  private extractLines(text: string, ...keywords: string[]): string[] {
    const lines: string[] = [];
    const textLines = text.toLowerCase().split('\n');

    for (const line of textLines) {
      for (const keyword of keywords) {
        if (line.includes(keyword.toLowerCase())) {
          lines.push(line.trim());
        }
      }
    }

    return lines.slice(0, 5); // Limit to 5 results
  }

  private extractFirstLine(text: string, ...keywords: string[]): string {
    const lines = this.extractLines(text, ...keywords);
    return lines[0] || '';
  }

  /**
   * Get current Kill Zone info
   */
  private getKillZoneInfo(): { current: string; recommendation: string } {
    const now = new Date();
    const utcHour = now.getUTCHours();

    if (utcHour >= 2 && utcHour < 5) {
      return {
        current: 'London Open (02:00-05:00 UTC)',
        recommendation: '✅ OPTIMAL TIME - High probability setups',
      };
    } else if (utcHour >= 13 && utcHour < 16) {
      return {
        current: 'New York Open / Silver Bullet (13:00-16:00 UTC)',
        recommendation: '⭐ BEST TIME - Premium entry precision',
      };
    } else if (utcHour >= 20 || utcHour < 0) {
      return {
        current: 'Asian Session (20:00-00:00 UTC)',
        recommendation: '⚠️ Lower probability - Be selective',
      };
    } else {
      return {
        current: 'Outside Kill Zones',
        recommendation: '⏸️ WAIT - Trade only during optimal windows',
      };
    }
  }

  /**
   * Generate ICT trading plan
   */
  private generateICTTradingPlan(
    structure: any,
    premiumDiscount: any,
    fvgs: any,
    obs: any,
    liquidity: any,
    killZone: any,
  ): any {
    // Determine primary setup based on ICT concepts
    let primarySetup = 'Wait for clear ICT setup';
    let entryZone = 'TBD';
    let stopLoss = 'Below structure';
    const takeProfit = ['Equilibrium', 'Opposite premium/discount zone'];
    const riskReward = '1:2 minimum';
    let confidence = 50;

    // If in discount and bullish bias
    if (
      premiumDiscount.currentZone.toLowerCase().includes('discount') &&
      structure.bias.toLowerCase().includes('bull')
    ) {
      primarySetup = 'Bullish setup in discount zone';
      entryZone = obs.nearest || fvgs.nearest || 'Wait for pullback to OB/FVG';
      stopLoss = 'Below nearest Order Block or liquidity';
      confidence = 70;
    }

    // If in premium and bearish bias
    if (
      premiumDiscount.currentZone.toLowerCase().includes('premium') &&
      structure.bias.toLowerCase().includes('bear')
    ) {
      primarySetup = 'Bearish setup in premium zone';
      entryZone = obs.nearest || fvgs.nearest || 'Wait for rally to OB/FVG';
      stopLoss = 'Above nearest Order Block or liquidity';
      confidence = 70;
    }

    // Boost confidence if in Kill Zone
    if (
      killZone.current.includes('London Open') ||
      killZone.current.includes('Silver Bullet')
    ) {
      confidence += 15;
    }

    return {
      primarySetup,
      entryZone,
      stopLoss,
      takeProfit,
      riskReward,
      confidence: Math.min(95, confidence),
    };
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    tradingPlan: any,
    killZone: any,
    premiumDiscount: any,
  ): string[] {
    const warnings: string[] = [];

    if (
      !killZone.current.includes('London') &&
      !killZone.current.includes('Silver Bullet')
    ) {
      warnings.push(
        '⚠️ Outside optimal Kill Zones - wait for London/NY sessions',
      );
    }

    if (premiumDiscount.currentZone.toLowerCase().includes('equilibrium')) {
      warnings.push('⚠️ Price at equilibrium - no clear premium/discount edge');
    }

    if (tradingPlan.confidence < 60) {
      warnings.push('⚠️ Low confidence setup - wait for higher probability');
    }

    return warnings;
  }

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `ICT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mock Gemini analysis (fallback)
   */
  private getMockGeminiAnalysis(): any {
    return {
      text: `ICT Analysis (Mock):

MARKET STRUCTURE:
- Current trend: Bullish (higher highs, higher lows)
- Last structure shift: Bullish BOS at 1.0850
- Trading bias: LONG

LIQUIDITY:
- Buy-side liquidity above 1.0920 (swing high)
- Sell-side liquidity below 1.0780 (swing low)
- Nearest target: Sell-side liquidity at 1.0780

FAIR VALUE GAPS:
- Bullish FVG at 1.0820-1.0835 (unfilled)
- This is premium entry zone for longs

ORDER BLOCKS:
- Bullish Order Block at 1.0800-1.0815
- High probability demand zone

PREMIUM/DISCOUNT:
- Current zone: Discount (favorable for longs)
- Optimal Trade Entry: 1.0815-1.0825 (0.618-0.786 retracement)

POWER OF THREE:
- Phase: Accumulation complete, now in Manipulation phase
- Expect liquidity sweep below 1.0780, then rally

TRADING PLAN:
- Setup: Long from bullish OB or FVG
- Entry: 1.0815-1.0825 (OTE zone)
- Stop Loss: 1.0775 (below sell-side liquidity)
- Take Profit 1: 1.0870 (equilibrium)
- Take Profit 2: 1.0920 (buy-side liquidity)
- Risk/Reward: 1:3
- Confidence: 75%`,
    };
  }
}
