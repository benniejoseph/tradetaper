const fs = require('fs');
const path = require('path');

const filePath = '/Users/benniejoseph/Documents/TradeTaper/tradetaper-frontend/src/app/(app)/analytics/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const returnStatementRegex = /return \(\s*<div className="min-h-screen bg-white dark:bg-black">[\s\S]*?\);\n}/;

const newReturnStatement = `return (
    <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-6 lg:p-4">
      <div className="max-w-[1600px] mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deep performance breakdowns and patterns.</p>
          </div>
        </div>

        {analyticsData?.radarMetrics && (
          <div className="mb-6 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/5">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/20">
              <FaBrain className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Trader Rating & Health</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardCard title="Trader Score Breakdown" icon={FaChartPie}>
                <TraderScoreRadar data={analyticsData.radarMetrics} />
              </DashboardCard>
              <DashboardCard title="Account Health" icon={FaTachometerAlt}>
                <AccountHealthGauge
                  balance={currentBalance}
                  equity={equityCurve[equityCurve.length - 1]?.value || currentBalance}
                  minBalance={gaugeMin}
                  maxBalance={gaugeMax}
                  minEquity={gaugeMin}
                  maxEquity={gaugeMax}
                />
              </DashboardCard>
            </div>
          </div>
        )}

        {/* Section 1: Overview */}
        <div className="mb-6 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/20">
            <FaTachometerAlt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Overview</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <PerformanceStatsCard trades={filteredTrades || []} currentBalance={dashboardStats?.currentBalance || 0} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            <WinRateCard winRate={dashboardStats?.winRate || 0} averageRR={dashboardStats?.averageRR || 0} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            <TradeStatisticsCard closedTrades={dashboardStats?.closedTrades || 0} winningTrades={dashboardStats?.winningTrades || 0} losingTrades={dashboardStats?.losingTrades || 0} breakevenTrades={dashboardStats?.breakevenTrades || 0} avgTradesPerDay={avgTradesPerDay} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            <TradingCostsCard totalCommissions={dashboardStats?.totalCommissions || 0} closedTrades={dashboardStats?.closedTrades || 0} totalNetPnl={dashboardStats?.totalNetPnl || 0} avgFeesPerDay={avgFeesPerDay} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          </div>
        </div>

        {/* Section 2: AI Market Intelligence (Moved here from bottom) */}
        {analyticsData && (
          <div className="mb-6 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/5">
            <FeatureGate feature="advancedAnalytics" blur={true}>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/20">
                <FaBrain className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Market Intelligence</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <DashboardCard title="Performance by Hour" icon={FaClock} gridSpan="lg:col-span-6">
                  <HourlyPerformanceChart data={analyticsData.hourlyPerformance} />
                </DashboardCard>

                <DashboardCard title="Session Performance" icon={FaGlobeAmericas} gridSpan="lg:col-span-3">
                  <SessionBreakdownChart data={analyticsData.sessionPerformance} />
                </DashboardCard>

                <DashboardCard title="Holding Time vs PnL" icon={FaHourglassHalf} gridSpan="lg:col-span-3">
                  <HoldingTimeScatter data={analyticsData.holdingTimeAnalysis} />
                </DashboardCard>
              </div>
            </FeatureGate>
          </div>
        )}

        {/* Section 3: Consistency & Rolling Stats */}
        <div className="mb-6 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/20">
            <FaChartLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rolling Consistency (Last {rollingWindowSize} Trades)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <RollingReturnCard data={rollingReturns} timeRange={timeRange} onTimeRangeChange={setTimeRange} windowSize={rollingWindowSize} onWindowSizeChange={setRollingWindowSize} gridSpan="sm:col-span-2 lg:col-span-2" />
            <RollingProfitFactorCard data={rollingProfitFactor} timeRange={timeRange} onTimeRangeChange={setTimeRange} windowSize={rollingWindowSize} gridSpan="sm:col-span-2 lg:col-span-2" />
            <RollingExpectancyCard data={rollingExpectancy} timeRange={timeRange} onTimeRangeChange={setTimeRange} windowSize={rollingWindowSize} gridSpan="sm:col-span-2 lg:col-span-2" />
          </div>
        </div>

        {/* Section 4: Performance Analysis */}
        <div className="mb-6 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/20">
            <FaListOl className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Analysis</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-6">
              <PairsPerformanceTable data={pairsPerformance} />
            </div>
            <LongShortAnalysisCard trades={filteredTrades || []} gridSpan="lg:col-span-6" />
            <MaeMfeScatterCard pipsData={maeMfePipsData} priceData={maeMfePriceData} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          </div>
        </div>

        {/* Section 5: Trading Activity (Top trades 2 cols, PnL 4 cols) */}
        <div className="mb-6 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/20">
            <FaCalendarAlt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Trading Activity</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <DashboardCard title="Top Performing Trades" icon={FaListOl} gridSpan="lg:col-span-2" showInfoIcon>
              <TopTradesByReturn trades={filteredTrades || []} topN={4} />
            </DashboardCard>
            
            <DashboardCard title="P&L Calendar" icon={FaCalendarDay} gridSpan="lg:col-span-4" showInfoIcon>
              <DashboardPnlCalendar trades={filteredTrades || []} />
            </DashboardCard>
          </div>
        </div>

        {/* Section 6: Equity & Drawdown (Moved to bottom) */}
        <div className="mb-6 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/20">
            <FaChartLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Equity & Drawdown</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-4">
              <AdvancedPerformanceChart data={chartData} />
            </div>
            <div className="lg:col-span-2">
              <DrawdownCurveCard data={drawdownSeries} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </div>
          </div>
        </div>

        {/* Section 7: Trading Activity Heatmap (Moved to bottom) */}
        <div className="mb-6 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-emerald-500/20">
            <FaCalendarAlt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity Heatmap</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            <DashboardCard title="Trading Activity Heatmap" icon={FaCalendarAlt} gridSpan="lg:col-span-1">
              <TradesCalendarHeatmap trades={filteredTrades || []} onDateClick={handleHeatmapDateClick} />
            </DashboardCard>
          </div>
        </div>

        {(!filteredTrades || filteredTrades.length === 0) && !tradesLoading && (
          <div className="text-center py-16 bg-gradient-to-br from-emerald-50/80 to-white/80 dark:from-emerald-950/20 dark:to-black/80 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 mt-8">
            <div className="max-w-md mx-auto space-y-4">
              <FaChartLine className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No trades recorded yet</h3>
              <AnimatedButton
                onClick={() => { window.location.href = '/journal/new'; }}
                variant="gradient"
                size="lg"
                icon={<FaPlus className="w-4 h-4" />}
                iconPosition="left"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                ripple
              >
                Log Your First Trade
              </AnimatedButton>
            </div>
          </div>
        )}

        <TradingActivityModal
          isOpen={isTradingActivityModalOpen}
          onClose={() => setIsTradingActivityModalOpen(false)}
          selectedDate={selectedDateData}
          tradesForDate={selectedDateTrades}
        />
      </div>
    </div>
  );
}`;

content = content.replace(returnStatementRegex, newReturnStatement);

fs.writeFileSync(filePath, content);
console.log('Successfully updated analytics page layout.');
