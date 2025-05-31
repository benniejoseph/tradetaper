/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/analytics/BreakdownPieChart.tsx
"use client";
import { StatsByTag } from '@/utils/analytics';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, Sector } from 'recharts';
import { useState, useCallback } from 'react';

interface PieChartDataItem {
  name: string;
  value: number;
}

interface BreakdownPieChartProps {
  data: StatsByTag[];
  title: string;
  dataKeyForValue: keyof StatsByTag;
  dataKeyForName?: keyof StatsByTag;
  valueFormatter?: (value: number) => string;
}

const THEME_COLORS = [
  'var(--color-accent-green)',        // Main accent
  '#05AFF2',                          // Bright Blue
  '#F2B705',                          // Yellow/Orange
  '#F25C05',                          // Orange/Red
  '#7005F2',                          // Purple
  'var(--color-accent-green-darker)', // Darker Accent
  '#038FC7',                          // Medium Blue (slightly darker than Bright Blue)
  '#D9A404',                          // Darker Yellow (slightly darker than Yellow/Orange)
  '#8C3F5B',                          // Muted Purple/Rose
  '#4A9D8C',                          // Tealish Green
];

// renderActiveShape now accepts valueFormatter as part of its props if we want to pass it explicitly
// However, it's better to use it within the BreakdownPieChart component's scope where it's defined.
const renderActiveShape = (props: any, formatter: (value: number) => string) => { // Pass formatter
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={'var(--color-text-light-primary)'} fontWeight="bold">
            {payload.name}
        </text>
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill} // This 'fill' comes from the THEME_COLORS
        />
        <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 6}
            outerRadius={outerRadius + 10}
            fill={fill} // This 'fill' comes from the THEME_COLORS
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="var(--color-text-light-secondary)">{`${formatter(value)}`}</text> {/* Use formatter here */}
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="var(--color-text-light-secondary)" opacity={0.8}>
            {`(Rate: ${(percent * 100).toFixed(2)}%)`}
        </text>
        </g>
    );
};


const BreakdownPieChart = ({
  data,
  title,
  dataKeyForValue,
  dataKeyForName = 'tag',
  valueFormatter = (val: number): string => val.toString(), // Default formatter
}: BreakdownPieChartProps) => {

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []); // Removed setActiveIndex from deps, it's stable

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []); // Removed setActiveIndex from deps

  const pieData: PieChartDataItem[] = data
    .map(item => ({
      name: String(item[dataKeyForName]),
      value: Math.abs(Number(item[dataKeyForValue])),
    }))
    .filter(item => item.value > 0);

  if (!pieData || pieData.length === 0) {
    return (
        <div className="w-full text-center py-10">
             <p className="text-text-light-secondary">No positive data to display for {title ? title.toLowerCase() : 'this chart'}.</p>
        </div>
    );
  }

  const activeShapeRenderer = (props: any) => renderActiveShape(props, valueFormatter);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={activeShapeRenderer}
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            innerRadius={70}
            fill="var(--color-accent-green)" // Default fill, overridden by Cells
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
                const formattedValue = valueFormatter(value);
                const percentage = props.payload && typeof props.payload.percent === 'number'
                    ? `(${(props.payload.percent * 100).toFixed(1)}%)`
                    : '';
                // Ensure the name (label) also uses a themed color if not derived from payload directly
                // The props.payload.name is usually what's displayed as the primary label in tooltip.
                // The `name` argument to formatter is the dataKey for the value, not the label.
                return [formattedValue, props.payload?.name || name, percentage];
            }}
            contentStyle={{ backgroundColor: 'var(--color-dark-secondary)', border: '1px solid var(--color-gray-700)', borderRadius: '0.375rem' }}
            labelStyle={{ color: 'var(--color-text-light-primary)', fontWeight: '600' }}
            itemStyle={{ color: 'var(--color-text-light-secondary)' }} // For the value part of the tooltip line if not customized by formatter
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ color: 'var(--color-text-light-secondary)', paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BreakdownPieChart;