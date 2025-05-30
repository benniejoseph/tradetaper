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

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82ca9d', '#ffc658', '#FF5733', '#C70039', '#900C3F'
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
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">
            {payload.name}
        </text>
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
        />
        <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 6}
            outerRadius={outerRadius + 10}
            fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#ccc">{`${formatter(value)}`}</text> {/* Use formatter here */}
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
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
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mb-8">
            <h2 className="text-xl font-semibold text-gray-200 mb-6 text-center">{title}</h2>
            <p className="text-gray-400 text-center py-10">No positive data to display for {title.toLowerCase()} pie chart.</p>
        </div>
    );
  }

  // Create a specific activeShape renderer that closes over valueFormatter from props
  const activeShapeRenderer = (props: any) => renderActiveShape(props, valueFormatter);

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mb-8">
      <h2 className="text-xl font-semibold text-gray-200 mb-6 text-center">{title}</h2>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={activeShapeRenderer} // Use the new renderer
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            // valueFormatter prop removed from here
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => { // props type can be more specific if needed
                const formattedValue = valueFormatter(value); // Use valueFormatter here
                const percentage = props.payload && typeof props.payload.percent === 'number'
                    ? `(${(props.payload.percent * 100).toFixed(1)}%)`
                    : '';
                return [formattedValue, name, percentage];
            }}
            contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#E2E8F0' }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ color: '#A0AEC0', paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BreakdownPieChart;