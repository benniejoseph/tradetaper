// src/components/trades/TradeFiltersComponent.tsx
"use client";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { setTradeFilters, resetTradeFilters } from '@/store/features/tradesSlice';
import { AssetType, TradeDirection, TradeStatus } from '@/types/trade'; // Ensure enums are correctly imported
import { FaUndo, FaFilter } from 'react-icons/fa'; // Icons for buttons

export default function TradeFiltersComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useSelector((state: RootState) => state.trades.filters);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setTradeFilters({ [name]: value }));
  };

  const handleReset = () => {
    dispatch(resetTradeFilters());
  };

  // Base classes for form inputs and selects
  const formElementBaseClasses = 
    "mt-1 block w-full rounded-lg shadow-sm p-2.5 transition-colors duration-150 ease-in-out";
  
  // Theme-specific classes for form elements
  const formElementThemeClasses = 
    `bg-[var(--color-light-secondary)] border-[var(--color-light-border)] text-[var(--color-text-dark-primary)] 
     dark:bg-dark-primary dark:border-gray-700 dark:text-text-light-primary`;

  const formElementFocusClasses = 
    "focus:ring-2 focus:ring-accent-green focus:border-accent-green focus:outline-none";
  
  const placeholderClasses = 
    "placeholder:text-[var(--color-text-dark-secondary)] placeholder:opacity-70 dark:placeholder:text-text-light-secondary dark:placeholder:opacity-60";
  
  const labelClasses = "block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-1";

  const inputClasses = `${formElementBaseClasses} ${formElementThemeClasses} ${formElementFocusClasses} ${placeholderClasses}`;
  const selectClasses = `${formElementBaseClasses} ${formElementThemeClasses} ${formElementFocusClasses}`;
  
  // Option theme classes (could be moved to globals.css if <option> styling becomes complex or shared)
  const optionDefaultClass = "bg-[var(--color-light-primary)] text-[var(--color-text-dark-secondary)] dark:bg-dark-primary dark:text-text-light-secondary";
  const optionValueClass = "bg-[var(--color-light-primary)] text-[var(--color-text-dark-primary)] dark:bg-dark-primary dark:text-text-light-primary";

  const resetButtonClasses = 
    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-150 ease-in-out 
     border hover:border-accent-red hover:text-accent-red 
     bg-transparent text-[var(--color-text-dark-secondary)] border-[var(--color-light-border)] 
     dark:bg-dark-primary dark:text-text-light-secondary dark:border-gray-600 
     focus:outline-none focus:ring-2 focus:ring-accent-red 
     focus:ring-offset-2 focus:ring-offset-[var(--color-light-primary)] dark:focus:ring-offset-dark-secondary`;

  return (
    <div className="bg-[var(--color-light-primary)] dark:bg-dark-secondary p-6 rounded-xl shadow-lg dark:shadow-card-modern mb-8">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[var(--color-light-border)] dark:border-dark-primary">
        <h2 className="text-2xl font-bold text-[var(--color-text-dark-primary)] dark:text-text-light-primary flex items-center"><FaFilter className="mr-3 opacity-70"/>Filter Trades</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        <div>
          <label htmlFor="dateFrom" className={labelClasses}>Date From (Entry)</label>
          <input type="date" name="dateFrom" id="dateFrom" value={filters.dateFrom || ''} onChange={handleChange}
                 className={inputClasses}/>
        </div>
        <div>
          <label htmlFor="dateTo" className={labelClasses}>Date To (Entry)</label>
          <input type="date" name="dateTo" id="dateTo" value={filters.dateTo || ''} onChange={handleChange}
                 className={inputClasses}/>
        </div>
        <div>
          <label htmlFor="symbol" className={labelClasses}>Symbol</label>
          <input type="text" name="symbol" id="symbol" placeholder="e.g., AAPL, BTCUSD" value={filters.symbol || ''} onChange={handleChange}
                 className={inputClasses}/>
        </div>
        <div>
          <label htmlFor="assetType" className={labelClasses}>Asset Type</label>
          <select name="assetType" id="assetType" value={filters.assetType || ''} onChange={handleChange}
                  className={selectClasses}>
            <option value="" className={optionDefaultClass}>All Types</option>
            {Object.values(AssetType).map(type => <option key={type} value={type} className={optionValueClass}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="direction" className={labelClasses}>Direction</label>
          <select name="direction" id="direction" value={filters.direction || ''} onChange={handleChange}
                  className={selectClasses}>
            <option value="" className={optionDefaultClass}>All Directions</option>
            {Object.values(TradeDirection).map(dir => <option key={dir} value={dir} className={optionValueClass}>{dir}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelClasses}>Status</label>
          <select name="status" id="status" value={filters.status || ''} onChange={handleChange}
                  className={selectClasses}>
            <option value="" className={optionDefaultClass}>All Statuses</option>
            {Object.values(TradeStatus).map(stat => <option key={stat} value={stat} className={optionValueClass}>{stat}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button onClick={handleReset} className={resetButtonClasses}>
          <FaUndo /> 
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}