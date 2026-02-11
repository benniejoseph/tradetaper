"use client";

import React from 'react';
import { FaPlus, FaBookOpen, FaChartLine } from 'react-icons/fa';

export default function QuickActionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Log Trade Card */}
      <div 
        className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl p-4 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-md hover:shadow-lg"
        onClick={() => { window.location.href = '/journal/new'; }}
      >
        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FaPlus className="w-4 h-4" />
                </div>
                <div>
                   <div className="text-base font-semibold">Log Trade</div>
                   <div className="text-xs opacity-90 text-emerald-100">Record new trade</div>
                </div>
            </div>
        </div>
      </div>

      {/* Journal Card */}
      <div 
        className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl p-4 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-md hover:shadow-lg"
        onClick={() => window.location.href = '/trades'}
      >
        <div className="relative z-10 flex items-center justify-between">
           <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <FaBookOpen className="w-4 h-4" />
            </div>
             <div>
                <div className="text-base font-semibold">Journal</div>
                <div className="text-xs opacity-90 text-emerald-100">View all trades</div>
             </div>
           </div>
        </div>
      </div>

      {/* Market Intelligence Card */}
      <div 
        className="relative bg-gradient-to-br from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white rounded-xl p-4 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-md hover:shadow-lg"
        onClick={() => window.location.href = '/analytics'}
      >
        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FaChartLine className="w-4 h-4" />
                </div>
                <div>
                    <div className="text-base font-semibold">Market Intelligence</div>
                    <div className="text-xs opacity-90 text-emerald-100">Strategic insights</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
