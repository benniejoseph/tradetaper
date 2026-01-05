"use client";

import React from 'react';
import { FaPlus, FaBookOpen, FaChartLine } from 'react-icons/fa';

export default function QuickActionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Log Trade Card */}
      <div 
        className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl p-6 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 shadow-lg hover:shadow-xl"
        onClick={() => { window.location.href = '/journal/new'; }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaPlus className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">Quick Action</div>
              <div className="text-lg font-semibold">Log Trade</div>
            </div>
          </div>
          <p className="text-emerald-100">Record a new trade with all the details</p>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Journal Card */}
      <div 
        className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl p-6 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 shadow-lg hover:shadow-xl"
        onClick={() => window.location.href = '/trades'}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaBookOpen className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">View All</div>
              <div className="text-lg font-semibold">Journal</div>
            </div>
          </div>
          <p className="text-emerald-100">Review your complete trading journal</p>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Analytics Card */}
      <div 
        className="relative bg-gradient-to-br from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white rounded-xl p-6 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 shadow-lg hover:shadow-xl"
        onClick={() => window.location.href = '/analytics'}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaChartLine className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">Deep Dive</div>
              <div className="text-lg font-semibold">Analytics</div>
            </div>
          </div>
          <p className="text-emerald-100">Advanced performance insights</p>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}
