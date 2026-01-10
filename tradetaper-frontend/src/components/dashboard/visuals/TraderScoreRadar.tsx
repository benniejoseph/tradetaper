"use client";
import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface RadarData {
  subject: string;
  A: number; // Score 0-100
  fullMark: number;
}

interface Props {
  data: RadarData[];
}

export default function TraderScoreRadar({ data }: Props) {
  return (
    <div className="h-[300px] w-full flex items-center justify-center bg-white dark:bg-[#022c22] rounded-xl">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#064e3b" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#6ee7b7', fontSize: 11, fontWeight: '600' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Trader Score"
            dataKey="A"
            stroke="#10b981"
            strokeWidth={2}
            fill="#059669"
            fillOpacity={0.5}
            dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
          />
          <Tooltip 
             contentStyle={{ backgroundColor: '#064e3b', borderColor: '#065f46', color: '#f0fdf4', borderRadius: '8px' }}
             itemStyle={{ color: '#6ee7b7' }}
             formatter={(value) => [`${value}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
