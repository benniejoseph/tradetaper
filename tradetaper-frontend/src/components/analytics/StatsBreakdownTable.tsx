// src/components/analytics/StatsBreakdownTable.tsx
"use client";
import { useState, useMemo } from 'react'; // Import useState and useMemo
import { StatsByTag } from '@/utils/analytics';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'; // For sort icons

// Helper for sort icons
const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => {
  if (direction === 'asc') return <FaSortUp className="inline ml-1" />;
  if (direction === 'desc') return <FaSortDown className="inline ml-1" />;
  return <FaSort className="inline ml-1 text-gray-500" />; // Default sort icon
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
    return <p className="text-gray-400 text-center py-4">No data to display for {title.toLowerCase()}.</p>;
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


  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mb-8">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700 ${header.isNumeric ? 'text-right' : 'text-left'}`}
                  onClick={() => requestSort(header.key)}
                >
                  {header.label}
                  <SortIcon direction={getSortDirectionForColumn(header.key)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {sortedData.map((item) => (
              <tr key={item.tag} className="hover:bg-gray-750 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">{item.tag}</td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${item.totalNetPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.totalNetPnl.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">{item.closedTrades}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">{item.winRate.toFixed(2)}%</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-green-400 text-right">{item.averageWin.toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-red-400 text-right">{item.averageLoss.toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">{item.profitFactor.toFixed(2)}</td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${item.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.expectancy.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-red-400 text-right">{item.maxDrawdown.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsBreakdownTable;