// src/components/analytics/StatsBreakdownTable.tsx
"use client";
import { useState, useMemo } from 'react'; // Import useState and useMemo
import { StatsByTag } from '@/utils/analytics';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'; // For sort icons

// Helper for sort icons
const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => {
  if (direction === 'asc') return <FaSortUp className="inline ml-1 text-accent-green" />;
  if (direction === 'desc') return <FaSortDown className="inline ml-1 text-accent-green" />;
  // Themed default sort icon
  return <FaSort className="inline ml-1 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary opacity-70" />;
};


interface StatsBreakdownTableProps {
  title: string;
  data: StatsByTag[];
  groupingKeyHeader?: string;
}

// Define which columns are sortable and how to access their data
type SortableColumn = keyof Pick<StatsByTag, 'tag' | 'totalNetPnl' | 'closedTrades' | 'winRate' | 'averageWin' | 'averageLoss' | 'profitFactor' | 'expectancy' | 'maxDrawdown'>;

interface SortConfig {
  key: SortableColumn;
  direction: 'asc' | 'desc';
}

const StatsBreakdownTable = ({ title, data, groupingKeyHeader = "Group" }: StatsBreakdownTableProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const sortedData = useMemo(() => {
    if (!data) return [];
    const sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        // Handle string and number sorting
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        // Fallback for mixed types or other types (should ideally not happen with StatsByTag)
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: SortableColumn) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirectionForColumn = (key: SortableColumn) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction;
  };


  if (!data || data.length === 0) {
    return <p className="text-center py-4 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">No data to display for {title.toLowerCase()}.</p>;
  }

  // Define headers with their sort key
  const headers: { key: SortableColumn; label: string; isNumeric?: boolean }[] = [
    { key: 'tag', label: groupingKeyHeader },
    { key: 'totalNetPnl', label: 'Net P&L', isNumeric: true },
    { key: 'closedTrades', label: 'Trades', isNumeric: true },
    { key: 'winRate', label: 'Win Rate', isNumeric: true },
    { key: 'averageWin', label: 'Avg Win', isNumeric: true },
    { key: 'averageLoss', label: 'Avg Loss', isNumeric: true },
    { key: 'profitFactor', label: 'Profit Factor', isNumeric: true },
    { key: 'expectancy', label: 'Expectancy', isNumeric: true },
    { key: 'maxDrawdown', label: 'Max Drawdown', isNumeric: true },
  ];

  // Define themed classes
  const tableContainerClasses = "overflow-x-auto rounded-lg shadow-lg dark:shadow-card-modern bg-[var(--color-light-primary)] dark:bg-dark-secondary border border-[var(--color-light-border)] dark:border-gray-700";
  const tableClasses = "min-w-full divide-y divide-[var(--color-light-border)] dark:divide-gray-700";
  const tableHeadClasses = "bg-[var(--color-light-secondary)] dark:bg-dark-primary";
  const tableHeaderCellClasses = "px-4 py-3 text-xs font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary uppercase tracking-wider cursor-pointer hover:bg-[var(--color-light-hover)] dark:hover:bg-gray-700 transition-colors";
  const tableBodyClasses = "divide-y divide-[var(--color-light-border)] dark:divide-gray-700";
  const tableRowEvenClasses = "bg-[var(--color-light-primary)] dark:bg-dark-secondary";
  const tableRowOddClasses = "bg-[var(--color-light-secondary)] dark:bg-dark-primary"; // Slightly different for zebra
  const tableRowHoverClasses = "hover:bg-[var(--color-light-hover)] dark:hover:bg-gray-700 transition-colors";
  const tableCellDefaultText = "text-[var(--color-text-dark-primary)] dark:text-text-light-primary";
  const tableCellSecondaryText = "text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary";

  return (
    <div className="w-full">
      <div className={tableContainerClasses}>
        <table className={tableClasses}>
          <thead className={tableHeadClasses}>
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className={`${tableHeaderCellClasses} ${header.isNumeric ? 'text-right' : 'text-left'}`}
                  onClick={() => requestSort(header.key)}
                >
                  {header.label}
                  <SortIcon direction={getSortDirectionForColumn(header.key)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tableBodyClasses}>
            {sortedData.map((item, index) => (
              <tr 
                key={item.tag} 
                className={`${index % 2 === 0 ? tableRowEvenClasses : tableRowOddClasses} ${tableRowHoverClasses}`}
              >
                <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${tableCellDefaultText}`}>{item.tag}</td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${item.totalNetPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {item.totalNetPnl.toFixed(2)}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${tableCellSecondaryText}`}>{item.closedTrades}</td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${tableCellSecondaryText}`}>{item.winRate.toFixed(2)}%</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-accent-green text-right">{item.averageWin.toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-accent-red text-right">{item.averageLoss.toFixed(2)}</td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${tableCellSecondaryText}`}>{item.profitFactor.toFixed(2)}</td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${item.expectancy >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {item.expectancy.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-accent-red text-right">{item.maxDrawdown.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsBreakdownTable;