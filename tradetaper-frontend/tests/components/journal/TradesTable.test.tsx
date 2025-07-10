
// tests/components/journal/TradesTable.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import TradesTable from '@/components/journal/TradesTable';
import { Trade, TradeStatus, TradeDirection, AssetType } from '@/types/trade';
import { Account } from '@/store/features/accountSlice';

// Mock the child components to isolate the TradesTable component
jest.mock('@/components/common/CurrencyAmount', () => ({
    CurrencyAmount: ({ amount }: { amount: number }) => <span>{amount}</span>
}));

const mockTrades: Trade[] = [
  {
    id: '1',
    symbol: 'EURUSD',
    entryDate: new Date().toISOString(),
    exitDate: new Date().toISOString(),
    entryPrice: 1.1200,
    exitPrice: 1.1250,
    quantity: 10000,
    status: TradeStatus.CLOSED,
    direction: TradeDirection.LONG,
    profitOrLoss: 50,
    accountId: 'acc1',
    userId: 'user1',
    assetType: AssetType.FOREX,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAccounts: Account[] = [
    { id: 'acc1', name: 'My Forex Account', currency: 'USD', balance: 1000, type: 'REAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: 'user1' }
];

describe('TradesTable', () => {
  it('renders the table with trade data', () => {
    render(<TradesTable trades={mockTrades} accounts={mockAccounts} onRowClick={() => {}} />);

    // Check for table headers
    expect(screen.getByText('Pair')).toBeInTheDocument();
    expect(screen.getByText('P&L')).toBeInTheDocument();

    // Check for trade data
    expect(screen.getByText('EURUSD')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // P&L
    expect(screen.getByText('My Forex Account')).toBeInTheDocument();
  });

  it('renders a message when no trades are provided', () => {
    render(<TradesTable trades={[]} accounts={[]} onRowClick={() => {}} />);
    expect(screen.getByText('No trades to display.')).toBeInTheDocument();
  });
});

