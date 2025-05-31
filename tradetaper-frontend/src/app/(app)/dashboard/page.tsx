/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/page.tsx
"use client";
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId } from '@/store/features/accountSlice';
import Link from 'next/link';
import { calculateDashboardStats, DashboardStats, calculateEquityCurveData } from '@/utils/analytics';
import { useTheme } from '@/context/ThemeContext';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { Trade, TradeStatus } from '@/types/trade';
import { format as formatDateFns, subDays, isAfter, parseISO } from 'date-fns';
import { 
    FaDollarSign, FaChartLine as FaReturnIcon, FaPercentage, 
    FaCrosshairs, FaBullseye, FaFileInvoiceDollar, FaTasks, FaInfoCircle, 
    FaDotCircle, FaChartLine, FaPlus, FaBookOpen, FaCalendarAlt, FaListOl,
    FaChartPie, FaExchangeAlt, FaSync, FaCog, FaShareAlt, FaBell, FaCalendarDay
} from 'react-icons/fa'; 
import { 
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
    Tooltip, Area, ComposedChart, CartesianGrid, Legend,
    RadialBarChart, RadialBar, PolarAngleAxis 
} from 'recharts'; 
import SetTargetModal from '@/components/dashboard/SetTargetModal';
import TradesCalendarHeatmap from '@/components/dashboard/TradesCalendarHeatmap';
import TopTradesByReturn from '@/components/dashboard/TopPairsTraded';
import DashboardPnlCalendar from '@/components/dashboard/DashboardPnlCalendar';

// Define time range options and their corresponding days
const timeRangeDaysMapping: { [key: string]: number } = {
  '7d': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'All': Infinity, // Special case for all trades
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading: tradesLoading } = useSelector((state: RootState) => state.trades);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('All'); // Default to 'All'
  const [isSetTargetModalOpen, setIsSetTargetModalOpen] = useState(false);
  const [personalTargetCurrent, setPersonalTargetCurrent] = useState(0); // Initialize with 0 or fetched P&L
  const [personalTargetGoal, setPersonalTargetGoal] = useState(1000);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTrades(selectedAccountId || undefined));
    }
  }, [dispatch, isAuthenticated, selectedAccountId]);

  const filteredTrades = useMemo(() => {
    const days = timeRangeDaysMapping[timeRange];
    if (days === Infinity || !trades || trades.length === 0) {
      return trades;
    }
    const cutOffDate = subDays(new Date(), days);
    return trades.filter(trade => {
      // Use exitDate for closed trades, entryDate for open/pending trades
      const tradeDateString = trade.status === TradeStatus.CLOSED && trade.exitDate ? trade.exitDate : trade.entryDate;
      if (!tradeDateString) return false; // Should not happen if data is clean
      try {
        const tradeDate = parseISO(tradeDateString); // Ensure date is parsed correctly
        return isAfter(tradeDate, cutOffDate);
      } catch (error) {
        console.error("Error parsing trade date:", tradeDateString, error);
        return false;
      }
    });
  }, [trades, timeRange]);

  const dashboardStats = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) {
      return calculateDashboardStats(filteredTrades);
    }
    return null;
  }, [filteredTrades]);

  const equityCurve = useMemo(() => {
    if (filteredTrades && filteredTrades.length > 0) {
      const curveData = calculateEquityCurveData(filteredTrades);
      if (curveData.length > 0) {
        return curveData.map(point => ({...point, date: formatDateFns(new Date(point.date), 'MMM dd')}));
      }
    }
    // Default: a single point at today with value 0 if no trades or no curve data
    return [{ date: formatDateFns(new Date(), 'MMM dd'), value: 0 }]; 
  }, [filteredTrades]);

  const periodMetrics = useMemo(() => {
    const initialBalanceForPeriod = equityCurve[0]?.value;
    const currentBalance = dashboardStats?.currentBalance;
    const totalNetPnlForPeriod = dashboardStats?.totalNetPnl;

    let balancePercentageChange = 0;
    if (initialBalanceForPeriod !== undefined && initialBalanceForPeriod !== 0 && currentBalance !== undefined) {
      balancePercentageChange = ((currentBalance - initialBalanceForPeriod) / initialBalanceForPeriod) * 100;
    } else if (currentBalance !== undefined && currentBalance > 0 && initialBalanceForPeriod === 0) {
      balancePercentageChange = Infinity; // Represent as effectively infinite growth from 0
    }

    let roiPercentage = 0;
    if (initialBalanceForPeriod !== undefined && initialBalanceForPeriod !== 0 && totalNetPnlForPeriod !== undefined) {
      roiPercentage = (totalNetPnlForPeriod / initialBalanceForPeriod) * 100;
    } else if (totalNetPnlForPeriod !== undefined && totalNetPnlForPeriod > 0 && initialBalanceForPeriod === 0){
        roiPercentage = Infinity; // Infinite ROI if PNL > 0 and initial was 0
    }

    return {
      balancePercentageChange,
      roiPercentage,
      initialBalanceForPeriod
    };
  }, [equityCurve, dashboardStats]);

  const personalTargetProgress = useMemo(() => {
    if (personalTargetGoal === 0) return 0;
    // personalTargetCurrent is now updated by useEffect
    return (personalTargetCurrent / personalTargetGoal) * 100;
  }, [personalTargetCurrent, personalTargetGoal]);

  const averageRRDisplay = dashboardStats?.averageRR?.toFixed(2) || '0.00';

  const winrateChartData = useMemo(() => [
    { name: 'Winrate', value: parseFloat((dashboardStats?.winRate || 0).toFixed(1)), fill: 'var(--color-accent-green)' }
  ], [dashboardStats?.winRate]);

  const numberOfTradingDays = useMemo(() => {
    if (!dashboardStats || dashboardStats.closedTrades === 0 || !filteredTrades) return 1;
    const closedTradesWithExitDate = filteredTrades.filter(trade => trade.status === TradeStatus.CLOSED && trade.exitDate);
    if (closedTradesWithExitDate.length === 0) return 1; 
    const uniqueDays = new Set(closedTradesWithExitDate.map(trade => {
        try { return new Date(trade.exitDate!).toDateString(); } catch { return null; }
    }).filter(Boolean));
    return uniqueDays.size > 0 ? uniqueDays.size : 1;
  }, [filteredTrades, dashboardStats]);

  const avgFeesPerDay = (dashboardStats?.totalCommissions && numberOfTradingDays) ? (dashboardStats.totalCommissions / numberOfTradingDays) : 0;
  const avgTradesPerDay = (dashboardStats?.closedTrades && numberOfTradingDays) ? (dashboardStats.closedTrades / numberOfTradingDays) : 0;
  
  const rechartsTextFill = theme === 'dark' ? 'var(--color-text-light-secondary)' : 'var(--color-text-dark-secondary)';
  const rechartsGridStroke = theme === 'dark' ? 'var(--color-gray-700)' : 'var(--color-light-border)';
  
  const handleOpenSetTargetModal = () => setIsSetTargetModalOpen(true);
  const handleCloseSetTargetModal = () => setIsSetTargetModalOpen(false);
  const handleSaveTarget = (newGoal: number) => {
    setPersonalTargetGoal(newGoal);
    setIsSetTargetModalOpen(false);
  };

  // Update personalTargetCurrent when dashboardStats.totalNetPnl changes
  useEffect(() => {
    if (dashboardStats?.totalNetPnl !== undefined) {
        setPersonalTargetCurrent(dashboardStats.totalNetPnl);
    }
  }, [dashboardStats?.totalNetPnl]);

  if (tradesLoading && trades.length === 0 && !dashboardStats) {
    return (
        <div className="min-h-screen flex items-center justify-center text-center p-4 
                        text-[var(--color-text-dark-primary)] dark:text-text-light-primary 
                        bg-[var(--color-light-secondary)] dark:bg-dark-primary">
            Loading dashboard data...
        </div>
    );
  }

  const quickActionBaseClasses = "w-full sm:w-auto flex-grow sm:flex-none px-6 py-3 font-semibold rounded-lg focus:outline-none transition-all duration-150 ease-in-out text-center shadow-md hover:shadow-lg flex items-center justify-center space-x-2";
  const quickActionPrimaryClasses = `bg-accent-green hover:bg-accent-green-darker text-dark-primary 
                                   focus:ring-2 focus:ring-offset-2 
                                   focus:ring-offset-[var(--color-light-primary)] dark:focus:ring-offset-dark-secondary 
                                   focus:ring-accent-green`;
  const quickActionSecondaryClasses = `border hover:text-accent-green 
                                     bg-[var(--color-light-secondary)] hover:bg-[var(--color-light-hover)] text-[var(--color-text-dark-primary)] border-[var(--color-light-border)] hover:border-accent-green focus:ring-offset-[var(--color-light-primary)] 
                                     dark:bg-dark-secondary dark:hover:bg-dark-primary dark:text-text-light-primary dark:border-text-light-secondary dark:hover:border-accent-green dark:focus:ring-offset-dark-secondary 
                                     focus:ring-2 focus:ring-accent-green`;

  return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="container mx-auto space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold mb-4 md:mb-0 text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
              Welcome, {user?.firstName || user?.email || 'Trader'}!
            </h1>
          </div>
          <div className="p-4 bg-[var(--color-light-primary)] dark:bg-dark-secondary rounded-xl shadow-lg dark:shadow-card-modern">
            <div className="flex flex-col sm:flex-row justify-around items-center gap-3">
              <Link href="/trades/new" className={`${quickActionBaseClasses} ${quickActionPrimaryClasses}`}> <FaPlus /> <span>Log New Trade</span> </Link>
              <Link href="/trades" className={`${quickActionBaseClasses} ${quickActionSecondaryClasses}`}> <FaBookOpen /> <span>View Full Journal</span> </Link>
              <Link href="/analytics" className={`${quickActionBaseClasses} ${quickActionSecondaryClasses}`}> <FaChartLine /> <span>Performance Analytics</span> </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">

            <DashboardCard 
              title="Balance" 
              icon={FaDollarSign}
              showMenuIcon 
              showTimeRangeSelector 
              selectedTimeRange={timeRange} 
              onTimeRangeChange={setTimeRange} 
              gridSpan="sm:col-span-1 lg:col-span-2"
            >
              <div className="space-y-2 h-full flex flex-col justify-between">
                <div>
                  <p className="text-3xl font-bold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                    ${dashboardStats?.currentBalance?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'} 
                    <span className={`text-sm font-medium ml-2 ${periodMetrics.balancePercentageChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {periodMetrics.balancePercentageChange === Infinity ? '∞' : periodMetrics.balancePercentageChange.toFixed(2)}%
                    </span> 
                  </p>
                  <p className="text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                    Initial: ${periodMetrics.initialBalanceForPeriod?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'} / Net P&L: ${dashboardStats?.totalNetPnl?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                  </p>
              </div>
                <div className="h-24 md:h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={equityCurve} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent-green)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-accent-green)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                        <Tooltip
                        contentStyle={{ backgroundColor: theme === 'dark' ? 'var(--color-dark-primary)' : 'var(--color-light-primary)' , border: '1px solid var(--color-light-border)', borderRadius: '0.375rem'}} 
                        labelStyle={{color: rechartsTextFill, fontWeight: 'bold'}}
                        itemStyle={{color: 'var(--color-accent-green)'}}
                        wrapperClassName="!shadow-lg !rounded-md"
                        labelFormatter={(label: string) => label} 
                        formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, "Balance"]}
                      />
                      <Line type="monotone" dataKey="value" stroke="var(--color-accent-green)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="value" stroke={false} fillOpacity={1} fill="url(#balanceGradient)" />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard 
              title="Personal target" 
              icon={FaBullseye}
              showInfoIcon={true} 
              showMenuIcon={true} 
              gridSpan="sm:col-span-1 lg:col-span-2"
            >
              <div className="space-y-3 h-full flex flex-col justify-between">
                <p className="text-3xl font-bold">
                  ${personalTargetCurrent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  <span className="text-sm font-normal text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary"> / ${personalTargetGoal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </p>
                <div className="w-full bg-[var(--color-light-border)] dark:bg-dark-primary rounded-full h-2.5">
                  <div 
                    className="bg-accent-green h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(personalTargetProgress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                  <span>-$1,000.00</span> { /* Placeholder scales */}
                  <span>$0.00</span>
                  <span>+$1,000.00</span>
                </div>
                 <button 
                  onClick={handleOpenSetTargetModal}
                  className="w-full text-sm py-2 px-4 rounded-lg bg-accent-green text-dark-primary hover:bg-accent-green-darker transition-colors font-semibold">
                  Set Target
                </button>
              </div>
            </DashboardCard>
            
            <DashboardCard 
              title="Return" 
              icon={FaReturnIcon}
              showInfoIcon 
              showMenuIcon 
              showTimeRangeSelector 
              selectedTimeRange={timeRange} 
              onTimeRangeChange={setTimeRange}
              gridSpan="sm:col-span-1 lg:col-span-2" 
            >
              <div className="space-y-1">
                <p className={`text-3xl font-bold ${ (dashboardStats?.totalNetPnl || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {(dashboardStats?.totalNetPnl || 0) >= 0 ? '+' : ''}${dashboardStats?.totalNetPnl?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '$0.00'}
                  <span className={`text-xs font-medium bg-opacity-20 px-1.5 py-0.5 rounded-full ml-2 align-middle ${(periodMetrics.roiPercentage >= 0 ? 'bg-accent-green text-accent-green' : 'bg-accent-red text-accent-red')}`}>
                     {periodMetrics.roiPercentage === Infinity ? '∞' : periodMetrics.roiPercentage.toFixed(2)}%
                  </span>
                </p>
                {[ 
                  { label: 'Avg Win', value: dashboardStats?.averageWin, isPositive: true },
                  { label: 'Avg Loss', value: dashboardStats?.averageLoss, isPositive: false },
                  { label: 'Largest Win', value: dashboardStats?.largestWin, isPositive: true },
                  { label: 'Largest Loss', value: dashboardStats?.largestLoss, isPositive: false },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center text-sm py-1 border-b border-[var(--color-light-border)] dark:border-dark-primary last:border-b-0">
                    <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">{item.label}</span>
                    <span className={`${item.isPositive ? 'text-accent-green' : 'text-accent-red'} font-medium`}>
                      {item.value !== undefined && item.value !== null ? 
                        `${item.isPositive && item.value > 0 ? '+' : ''}$${Math.abs(item.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}
                    </span>
                  </div>
                ))}
                <div className="mt-3 p-3 bg-accent-green bg-opacity-10 rounded-md">
                  <p className="text-xs text-accent-green">
                    <FaInfoCircle className="inline mr-1 mb-0.5"/> 
                    Profit factor is {dashboardStats?.profitFactor?.toFixed(2) || 'N/A'}. 
                    {(dashboardStats?.profitFactor && dashboardStats?.profitFactor >=1) ? `You earn $${dashboardStats?.profitFactor.toFixed(2)} for every $1 lost.` : (dashboardStats?.profitFactor ? `You lose $${(1/dashboardStats.profitFactor).toFixed(2)} for every $1 earned.` : 'Not enough data.')}
                  </p>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard 
              title="Account Balance" 
              icon={FaChartLine}
              showInfoIcon 
              showMenuIcon 
              showTimeRangeSelector
              selectedTimeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              gridSpan="sm:col-span-2 lg:col-span-3"
            >
              <div className="h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={equityCurve} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="accountBalanceFillChart" x1="0" y1="0" x2="0" y2="1"> 
                          <stop offset="5%" stopColor="var(--color-accent-green)" stopOpacity={0.3}/> 
                          <stop offset="95%" stopColor="var(--color-accent-green)" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={rechartsGridStroke} strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="date" stroke={rechartsTextFill} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis stroke={rechartsTextFill} tickFormatter={(value) => `$${value/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? 'var(--color-dark-primary)' : 'var(--color-light-primary)', border: '1px solid var(--color-light-border)', borderRadius: '0.375rem'}} 
                          labelStyle={{color: rechartsTextFill, fontWeight: 'bold'}}
                          itemStyle={{color: 'var(--color-accent-green)'}}
                          labelFormatter={(label: string) => label} 
                          formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, "Balance"]} 
                          wrapperClassName="!shadow-lg !rounded-md"
                      />
                      <Area type="monotone" dataKey="value" stroke="var(--color-accent-green)" fill="url(#accountBalanceFillChart)" strokeWidth={2.5} activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--color-accent-green)' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>
          
            <DashboardCard 
              title="Winrate" 
              icon={FaPercentage}
              showInfoIcon 
              showMenuIcon 
              showTimeRangeSelector
              selectedTimeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              gridSpan="sm:col-span-2 lg:col-span-3"
            >
              <div className="flex flex-col items-center justify-around h-full space-y-2">
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="65%"
                          outerRadius="90%"
                          barSize={16}
                          data={winrateChartData} 
                          startAngle={90}
                          endAngle={-270}
                      >
                          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                          <RadialBar 
                              dataKey='value' 
                              cornerRadius={8}
                              angleAxisId={0}
                          />
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold fill-[var(--color-text-dark-primary)] dark:fill-text-light-primary">
                              {(dashboardStats?.winRate || 0).toFixed(1)}%
                          </text>
                          <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-[var(--color-text-dark-secondary)] dark:fill-text-light-secondary">
                              Winrate
                          </text>
                      </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full px-4">
                  <label htmlFor="avgRR" className="text-sm text-center text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-1 block">Average R:R</label>
                  <div className="relative h-2.5 bg-[var(--color-light-border)] dark:bg-dark-primary rounded-full">
                    <div 
                      className="absolute top-0 left-0 h-2.5 bg-accent-green rounded-full"
                      style={{ width: `${Math.min(( (dashboardStats?.averageRR || 0) / 5) * 100, 100)}%`}}
                    ></div>
                    <div 
                      className="absolute top-1/2 h-5 w-5 bg-accent-green border-2 border-[var(--color-light-primary)] dark:border-dark-secondary rounded-full -translate-y-1/2 -translate-x-1/2 shadow-md flex items-center justify-center text-xs font-semibold text-dark-primary"
                      style={{ left: `${Math.min(( (dashboardStats?.averageRR || 0) / 5) * 100, 100)}%`}}
                    >
                      {averageRRDisplay} 
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mt-1.5">
                    <span>0</span>
                    <span className="font-semibold text-accent-green">{averageRRDisplay}</span>
                    <span>5</span>
                  </div>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard 
              title="Commissions and Fees" 
              icon={FaFileInvoiceDollar}
              gridSpan="sm:col-span-1 lg:col-span-3" 
              showMenuIcon 
              showTimeRangeSelector 
              selectedTimeRange={timeRange} 
              onTimeRangeChange={setTimeRange} 
              showInfoIcon
            >
              <div className="space-y-2.5 text-sm py-2">
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Total Commissions:</span>
                  <span className="font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                    ${dashboardStats?.totalCommissions?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">AVG Fees per Trade:</span>
                  <span className="font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                    ${(dashboardStats?.totalCommissions && dashboardStats?.closedTrades ? dashboardStats.totalCommissions / dashboardStats.closedTrades : 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">PNL / Fees Ratio:</span>
                  <span className={`font-semibold ${(dashboardStats?.totalNetPnl && dashboardStats?.totalCommissions && (dashboardStats.totalNetPnl / dashboardStats.totalCommissions) < 1 && dashboardStats.totalCommissions !==0) ? 'text-accent-red' : 'text-accent-green'}`}>
                    {(dashboardStats?.totalNetPnl && dashboardStats?.totalCommissions && dashboardStats.totalCommissions !== 0 ? (dashboardStats.totalNetPnl / dashboardStats.totalCommissions) : 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">AVG Fees per Day:</span>
                  <span className="font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                    ${avgFeesPerDay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Funding (Placeholder):</span>
                  <span className="font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">$0.00</span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard 
              title="Trades Performance" 
              icon={FaTasks}
              gridSpan="sm:col-span-1 lg:col-span-3" 
              showMenuIcon 
              showTimeRangeSelector 
              selectedTimeRange={timeRange} 
              onTimeRangeChange={setTimeRange} 
              showInfoIcon
            >
              <div className="space-y-2.5 text-sm py-2">
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Total Trades:</span>
                  <span className="font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                    {dashboardStats?.closedTrades || 0} 
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Winning Trades:</span>
                  <span className="font-semibold text-accent-green">
                    {dashboardStats?.winningTrades || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Losing Trades:</span>
                  <span className="font-semibold text-accent-red">
                    {dashboardStats?.losingTrades || 0}
                  </span>
                </div>
                 <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Breakeven Trades:</span>
                  <span className="font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                    {dashboardStats?.breakevenTrades || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary">
                  <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">AVG Trades per Day:</span>
                  <span className="font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                    {avgTradesPerDay.toFixed(2)}
                  </span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Top-5 Trades on Return"
              icon={FaListOl}
              gridSpan="lg:col-span-3"
              showTimeRangeSelector={true}
              selectedTimeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              showInfoIcon={true}
              showMenuIcon={true}
            >
              <TopTradesByReturn trades={filteredTrades} topN={5} />
            </DashboardCard>

            <DashboardCard
              title="Calendar"
              gridSpan="lg:col-span-3"
              showTimeRangeSelector={false}
              showInfoIcon={true}
              showMenuIcon={true}
            >
              <DashboardPnlCalendar trades={filteredTrades} />
            </DashboardCard>
            
            <DashboardCard
              title="Trading Activity Calendar"
              icon={FaCalendarAlt}
              gridSpan="lg:col-span-6"
              showTimeRangeSelector={true}
              selectedTimeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            >
              <TradesCalendarHeatmap trades={filteredTrades} />
            </DashboardCard>
          </div>

          {(!filteredTrades || filteredTrades.length === 0) && !tradesLoading && (
              <div className="text-center py-10 bg-[var(--color-light-primary)] dark:bg-dark-secondary rounded-xl shadow-lg dark:shadow-card-modern p-6">
                  <p className="text-xl text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                      No trades recorded for the selected period. Add some trades or adjust the time range!
                  </p>
              </div>
          )}
        </div>
        <SetTargetModal 
          isOpen={isSetTargetModalOpen}
          onClose={handleCloseSetTargetModal}
          currentGoal={personalTargetGoal}
          onSave={handleSaveTarget}
        />
      </div>
  );
}