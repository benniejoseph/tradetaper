import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';

export interface KillZone {
  name: string;
  session: 'asian' | 'london' | 'new_york';
  startTime: string; // HH:MM UTC
  endTime: string; // HH:MM UTC
  active: boolean;
  timeUntilStart?: number; // minutes
  timeUntilEnd?: number; // minutes
  description: string;
  tradingCharacteristics: string[];
}

export interface KillZoneAnalysis {
  currentTime: Date;
  currentTimeUTC: string;
  activeKillZone: KillZone | null;
  nextKillZone: KillZone | null;
  allKillZones: KillZone[];
  isOptimalTradingTime: boolean;
  analysis: string[];
  recommendations: string[];
  timestamp: Date;
}

@Injectable()
export class KillZoneService {
  private readonly logger = new Logger(KillZoneService.name);

  // ICT Kill Zones (UTC time)
  private readonly killZones: Omit<
    KillZone,
    'active' | 'timeUntilStart' | 'timeUntilEnd'
  >[] = [
    {
      name: 'Asian Kill Zone',
      session: 'asian',
      startTime: '20:00',
      endTime: '00:00',
      description: 'Asian session - Lower volatility, liquidity building',
      tradingCharacteristics: [
        'Lower volatility compared to London/NY',
        'Good for ranging strategies',
        'Watch for stop hunts before London open',
        'Sets up liquidity pools for London session',
      ],
    },
    {
      name: 'London Open Kill Zone',
      session: 'london',
      startTime: '02:00',
      endTime: '05:00',
      description: 'London morning - HIGH volatility, major moves',
      tradingCharacteristics: [
        'HIGHEST probability trading window',
        'Institutions enter large positions',
        'Liquidity sweeps common',
        'Major trend continuation or reversals',
        'Best for ICT setups (FVG, Order Blocks)',
      ],
    },
    {
      name: 'London Close Kill Zone',
      session: 'london',
      startTime: '10:00',
      endTime: '12:00',
      description: 'London afternoon - Profit taking, position squaring',
      tradingCharacteristics: [
        'London traders closing positions',
        'Can see reversals of morning moves',
        'Moderate volatility',
        'Good for counter-trend plays',
      ],
    },
    {
      name: 'New York Open Kill Zone (Silver Bullet)',
      session: 'new_york',
      startTime: '13:00',
      endTime: '16:00',
      description: 'NY morning - Silver Bullet window, high-probability setups',
      tradingCharacteristics: [
        'SILVER BULLET window (best for precision entries)',
        'US institutions enter market',
        'High volatility',
        'Trend continuation likely',
        'Look for FVG fills and OB retests',
      ],
    },
    {
      name: 'PM Session (New York Afternoon)',
      session: 'new_york',
      startTime: '18:00',
      endTime: '20:00',
      description: 'NY afternoon - Late session moves, less reliable',
      tradingCharacteristics: [
        'Lower volume than morning session',
        'Risk reduction by institutions',
        'Can see end-of-day reversals',
        'Less reliable for new entries',
      ],
    },
  ];

  /**
   * Analyze current Kill Zone status
   */
  analyzeKillZones(): KillZoneAnalysis {
    const now = new Date();
    const currentTimeUTC = this.formatTimeUTC(now);

    this.logger.log(`Analyzing ICT Kill Zones for ${currentTimeUTC} UTC`);

    // Determine which kill zones are active
    const killZonesWithStatus = this.killZones.map((kz) =>
      this.getKillZoneStatus(kz, now),
    );

    // Find active kill zone
    const activeKillZone = killZonesWithStatus.find((kz) => kz.active) || null;

    // Find next kill zone
    const upcomingKillZones = killZonesWithStatus
      .filter((kz) => !kz.active && kz.timeUntilStart !== undefined)
      .sort((a, b) => (a.timeUntilStart || 0) - (b.timeUntilStart || 0));

    const nextKillZone = upcomingKillZones[0] || null;

    // Determine if this is optimal trading time
    const isOptimalTradingTime = this.isOptimalTime(activeKillZone);

    // Generate analysis
    const analysis = this.generateKillZoneAnalysis(
      activeKillZone,
      nextKillZone,
      currentTimeUTC,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      activeKillZone,
      nextKillZone,
      isOptimalTradingTime,
    );

    return {
      currentTime: now,
      currentTimeUTC,
      activeKillZone,
      nextKillZone,
      allKillZones: killZonesWithStatus,
      isOptimalTradingTime,
      analysis,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Get kill zone status
   */
  private getKillZoneStatus(
    kz: Omit<KillZone, 'active' | 'timeUntilStart' | 'timeUntilEnd'>,
    now: Date,
  ): KillZone {
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const [startHour, startMin] = kz.startTime.split(':').map(Number);
    const [endHour, endMin] = kz.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle overnight sessions
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    let active = false;
    let timeUntilStart: number | undefined;
    let timeUntilEnd: number | undefined;

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      // Currently in this kill zone
      active = true;
      timeUntilEnd = endMinutes - currentMinutes;
    } else {
      // Calculate time until start
      if (currentMinutes < startMinutes) {
        timeUntilStart = startMinutes - currentMinutes;
      } else {
        // Next occurrence is tomorrow
        timeUntilStart = 24 * 60 - currentMinutes + startMinutes;
      }
    }

    return {
      ...kz,
      active,
      timeUntilStart,
      timeUntilEnd,
    };
  }

  /**
   * Check if current time is optimal for trading
   */
  private isOptimalTime(activeKillZone: KillZone | null): boolean {
    if (!activeKillZone) return false;

    // London Open and NY Open (Silver Bullet) are optimal
    return (
      activeKillZone.name === 'London Open Kill Zone' ||
      activeKillZone.name === 'New York Open Kill Zone (Silver Bullet)'
    );
  }

  /**
   * Format time as UTC string
   */
  private formatTimeUTC(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} UTC`;
  }

  /**
   * Format minutes as time string
   */
  private formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Generate Kill Zone analysis
   */
  private generateKillZoneAnalysis(
    activeKillZone: KillZone | null,
    nextKillZone: KillZone | null,
    currentTimeUTC: string,
  ): string[] {
    const analysis: string[] = [];

    analysis.push(`🕐 ICT Kill Zone Analysis`);
    analysis.push(`Current Time: ${currentTimeUTC}`);

    if (activeKillZone) {
      analysis.push(`\n✅ ACTIVE KILL ZONE: ${activeKillZone.name}`);
      analysis.push(`   Session: ${activeKillZone.session.toUpperCase()}`);
      analysis.push(
        `   Time Window: ${activeKillZone.startTime} - ${activeKillZone.endTime} UTC`,
      );
      analysis.push(
        `   Time Remaining: ${this.formatMinutes(activeKillZone.timeUntilEnd || 0)}`,
      );
      analysis.push(`   ${activeKillZone.description}`);

      if (
        activeKillZone.name === 'London Open Kill Zone' ||
        activeKillZone.name === 'New York Open Kill Zone (Silver Bullet)'
      ) {
        analysis.push(`   🎯 HIGH-PROBABILITY TRADING WINDOW`);
      }
    } else {
      analysis.push(`\n⏸️ No active Kill Zone`);
      analysis.push(`   Market outside optimal ICT trading windows`);
    }

    if (nextKillZone) {
      analysis.push(`\n⏭️ Next Kill Zone: ${nextKillZone.name}`);
      analysis.push(
        `   Starts in: ${this.formatMinutes(nextKillZone.timeUntilStart || 0)}`,
      );
      analysis.push(
        `   Time Window: ${nextKillZone.startTime} - ${nextKillZone.endTime} UTC`,
      );
    }

    return analysis;
  }

  /**
   * Generate trading recommendations
   */
  private generateRecommendations(
    activeKillZone: KillZone | null,
    nextKillZone: KillZone | null,
    isOptimalTime: boolean,
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`💡 ICT Kill Zone Trading Recommendations:`);

    if (activeKillZone) {
      recommendations.push(`\n${activeKillZone.name}:`);

      // Add characteristics
      activeKillZone.tradingCharacteristics.forEach((char) => {
        recommendations.push(`   • ${char}`);
      });

      // Specific strategies
      if (activeKillZone.name === 'London Open Kill Zone') {
        recommendations.push(`\n🎯 London Open Strategies:`);
        recommendations.push(`   • Look for liquidity sweeps at session open`);
        recommendations.push(`   • Watch for BOS/CHoCH signals`);
        recommendations.push(`   • Enter on FVG fills or Order Block retests`);
        recommendations.push(`   • Set tight stops (volatility is HIGH)`);
        recommendations.push(
          `   • Target nearby liquidity pools or previous day's high/low`,
        );
      } else if (
        activeKillZone.name === 'New York Open Kill Zone (Silver Bullet)'
      ) {
        recommendations.push(`\n⚡ SILVER BULLET Strategies:`);
        recommendations.push(`   • This is the MOST reliable ICT setup window`);
        recommendations.push(
          `   • Wait for 13:00-16:00 UTC for precision entries`,
        );
        recommendations.push(`   • Look for FVG fills within this window`);
        recommendations.push(
          `   • Order Block retests are highly reliable here`,
        );
        recommendations.push(`   • Trend continuation setups work best`);
        recommendations.push(`   • Risk/Reward of 1:3 or better is achievable`);
      } else if (activeKillZone.name === 'Asian Kill Zone') {
        recommendations.push(`\n🌏 Asian Session Strategies:`);
        recommendations.push(
          `   • Lower volatility - use smaller position sizes`,
        );
        recommendations.push(`   • Good for ranging/mean reversion strategies`);
        recommendations.push(`   • Watch for stop hunts before London open`);
        recommendations.push(`   • Mark liquidity pools for London session`);
      }
    } else {
      recommendations.push(`\n⏸️ Outside Kill Zones:`);
      recommendations.push(`   • Avoid new entries during these times`);
      recommendations.push(`   • Manage existing positions only`);
      recommendations.push(`   • Use this time for analysis and planning`);
      recommendations.push(
        `   • Wait for next Kill Zone for optimal entry conditions`,
      );
    }

    if (
      nextKillZone &&
      nextKillZone.timeUntilStart &&
      nextKillZone.timeUntilStart < 60
    ) {
      recommendations.push(
        `\n⏰ ALERT: ${nextKillZone.name} starts in ${this.formatMinutes(nextKillZone.timeUntilStart)}`,
      );
      recommendations.push(`   • Prepare your watchlist`);
      recommendations.push(
        `   • Review key levels (OBs, FVGs, liquidity zones)`,
      );
      recommendations.push(`   • Have your trading plan ready`);
    }

    return recommendations;
  }

  /**
   * Check if we're in Silver Bullet time (NY Open Kill Zone)
   */
  isSilverBulletTime(): boolean {
    const analysis = this.analyzeKillZones();
    return (
      analysis.activeKillZone !== null &&
      analysis.activeKillZone.name === 'New York Open Kill Zone (Silver Bullet)'
    );
  }

  /**
   * Check if we're in London Open time
   */
  isLondonOpenTime(): boolean {
    const analysis = this.analyzeKillZones();
    return (
      analysis.activeKillZone !== null &&
      analysis.activeKillZone.name === 'London Open Kill Zone'
    );
  }

  /**
   * Get optimal trading windows for the day
   */
  getOptimalTradingWindows(): {
    londonOpen: { start: string; end: string };
    newYorkOpen: { start: string; end: string };
  } {
    return {
      londonOpen: { start: '02:00 UTC', end: '05:00 UTC' },
      newYorkOpen: { start: '13:00 UTC', end: '16:00 UTC' },
    };
  }
}
