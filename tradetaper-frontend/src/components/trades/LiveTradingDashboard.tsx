'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  RefreshCw,
  Play,
  Square,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  currency: string;
  profit?: number;
}

interface Position {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  stopLoss?: number;
  takeProfit?: number;
}

interface Order {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  time: string;
  state: string;
}

interface Deal {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: string;
  comment?: string;
}

interface LiveTradeData {
  positions: Position[];
  orders: Order[];
  accountInfo: AccountInfo;
  deals: Deal[];
}

interface AccountStatus {
  isConnected: boolean;
  isStreaming: boolean;
  deploymentState: string;
  connectionState: string;
  lastHeartbeat?: string;
  lastError?: string;
}

interface LiveTradingDashboardProps {
  accountId: string;
  onError?: (error: string) => void;
}

export default function LiveTradingDashboard({ accountId, onError }: LiveTradingDashboardProps) {
  const [liveData, setLiveData] = useState<LiveTradeData | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveData = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/mt5-accounts/${accountId}/live-data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live data');
      }

      const data = await response.json();
      setLiveData(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [accountId, onError]);

  const fetchAccountStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/mt5-accounts/${accountId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account status');
      }

      const status = await response.json();
      setAccountStatus(status);
    } catch (err) {
      console.error('Failed to fetch account status:', err);
    }
  }, [accountId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLiveData(), fetchAccountStatus()]);
    setRefreshing(false);
  };

  const handleStartStreaming = async () => {
    try {
      const response = await fetch(`/api/v1/mt5-accounts/${accountId}/start-streaming`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      await fetchAccountStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start streaming';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleStopStreaming = async () => {
    try {
      const response = await fetch(`/api/v1/mt5-accounts/${accountId}/stop-streaming`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to stop streaming');
      }

      await fetchAccountStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop streaming';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchLiveData(), fetchAccountStatus()]);
      setLoading(false);
    };

    loadInitialData();
  }, [fetchLiveData, fetchAccountStatus]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!refreshing) {
        fetchLiveData();
        fetchAccountStatus();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshing, fetchLiveData, fetchAccountStatus]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConnectionStatusColor = (status: AccountStatus | null) => {
    if (!status) return 'bg-gray-500';
    if (status.isConnected && status.isStreaming) return 'bg-green-500';
    if (status.isConnected) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConnectionStatusText = (status: AccountStatus | null) => {
    if (!status) return 'Unknown';
    if (status.isConnected && status.isStreaming) return 'Live Streaming';
    if (status.isConnected) return 'Connected';
    return 'Disconnected';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading live trading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Live Trading Dashboard</h2>
          <div className="flex items-center space-x-2">
            <div className={cn("w-3 h-3 rounded-full", getConnectionStatusColor(accountStatus))} />
            <span className="text-sm font-medium">{getConnectionStatusText(accountStatus)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            Auto Refresh
          </Button>
          
          {accountStatus?.isStreaming ? (
            <Button variant="outline" size="sm" onClick={handleStopStreaming}>
              <Square className="h-4 w-4 mr-2" />
              Stop Streaming
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleStartStreaming}>
              <Play className="h-4 w-4 mr-2" />
              Start Streaming
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Account Information Cards */}
      {liveData?.accountInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(liveData.accountInfo.balance, liveData.accountInfo.currency)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equity</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(liveData.accountInfo.equity, liveData.accountInfo.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margin Level: {liveData.accountInfo.marginLevel?.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free Margin</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(liveData.accountInfo.freeMargin, liveData.accountInfo.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Used: {formatCurrency(liveData.accountInfo.margin, liveData.accountInfo.currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leverage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1:{liveData.accountInfo.leverage}</div>
              <p className="text-xs text-muted-foreground">
                Currency: {liveData.accountInfo.currency}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trading Data Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">
            Positions ({liveData?.positions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="orders">
            Orders ({liveData?.orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="deals">
            Recent Deals ({liveData?.deals?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {liveData?.positions?.length ? (
                <div className="space-y-4">
                  {liveData.positions.map((position) => (
                    <div key={position.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={position.type === 'buy' ? 'default' : 'secondary'}>
                            {position.type.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">{position.symbol}</span>
                          <span className="text-sm text-muted-foreground">
                            {position.volume} lots
                          </span>
                        </div>
                        <div className={cn(
                          "text-right",
                          position.profit >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          <div className="font-semibold">
                            {formatCurrency(position.profit, liveData.accountInfo.currency)}
                          </div>
                          <div className="text-sm">
                            {position.profit >= 0 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Open Price:</span>
                          <div className="font-medium">{position.openPrice}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current Price:</span>
                          <div className="font-medium">{position.currentPrice}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stop Loss:</span>
                          <div className="font-medium">{position.stopLoss || 'None'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Take Profit:</span>
                          <div className="font-medium">{position.takeProfit || 'None'}</div>
                        </div>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Opened: {formatDateTime(position.openTime)}</span>
                        <span>
                          Swap: {formatCurrency(position.swap, liveData.accountInfo.currency)} | 
                          Commission: {formatCurrency(position.commission, liveData.accountInfo.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No open positions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {liveData?.orders?.length ? (
                <div className="space-y-4">
                  {liveData.orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{order.type}</Badge>
                          <span className="font-semibold">{order.symbol}</span>
                          <span className="text-sm text-muted-foreground">
                            {order.volume} lots
                          </span>
                        </div>
                        <Badge variant={order.state === 'PLACED' ? 'default' : 'secondary'}>
                          {order.state}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Order Price:</span>
                          <div className="font-medium">{order.openPrice}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current Price:</span>
                          <div className="font-medium">{order.currentPrice || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stop Loss:</span>
                          <div className="font-medium">{order.stopLoss || 'None'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Take Profit:</span>
                          <div className="font-medium">{order.takeProfit || 'None'}</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        Placed: {formatDateTime(order.time)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending orders
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deals (Last 24 Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              {liveData?.deals?.length ? (
                <div className="space-y-2">
                  {liveData.deals.slice(0, 20).map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Badge variant={deal.type.includes('BUY') ? 'default' : 'secondary'}>
                          {deal.type}
                        </Badge>
                        <div>
                          <div className="font-medium">{deal.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {deal.volume} lots @ {deal.price}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={cn(
                          "font-medium",
                          deal.profit >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(deal.profit, liveData.accountInfo.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(deal.time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent deals
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Status Details */}
      {accountStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Deployment:</span>
                <div className="font-medium">{accountStatus.deploymentState}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Connection:</span>
                <div className="font-medium">{accountStatus.connectionState}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Streaming:</span>
                <div className="font-medium">{accountStatus.isStreaming ? 'Active' : 'Inactive'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Heartbeat:</span>
                <div className="font-medium">
                  {accountStatus.lastHeartbeat ? formatDateTime(accountStatus.lastHeartbeat) : 'Never'}
                </div>
              </div>
            </div>
            
            {accountStatus.lastError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{accountStatus.lastError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 