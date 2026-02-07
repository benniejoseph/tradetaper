'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  MoreHorizontal, 
  Copy, 
  Calendar,
  DollarSign,
  Percent,
  CheckCircle,
  XCircle,
  Tag
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { adminApi, Coupon } from '@/lib/api';

export const dynamic = 'force-dynamic';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CouponsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch coupons
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => adminApi.getCoupons(),
  });

  // Filter coupons
  const filteredCoupons = coupons?.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Ticket className="text-purple-500" /> Coupons
            </h1>
            <p className="text-sm text-gray-400">Manage discount codes and offers</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search coupons..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <button className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
              {filteredCoupons.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No coupons found matching your search.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateCouponModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
          }} 
        />
      )}
    </div>
  );
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
  const isFullyUsed = coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses;
  const isActive = coupon.isActive && !isExpired && !isFullyUsed;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-purple-500/30 transition-colors group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-gray-400 hover:text-white">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-lg font-bold text-white tracking-wide">{coupon.code}</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(coupon.code);
                toast.success('Code copied');
              }}
              className="text-gray-500 hover:text-purple-400"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
            <span className="text-xs text-gray-500 capitalize">{coupon.type}</span>
          </div>
        </div>
        <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 font-bold">
          {coupon.type === 'PERCENTAGE' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Value</span>
          <span className="font-medium text-white">
            {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `$${coupon.value}`}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Usage</span>
          <span className="font-medium text-white">
            {coupon.usedCount} / {coupon.maxUses === -1 ? '∞' : coupon.maxUses}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Expires</span>
          <span className="font-medium text-white">
            {coupon.validUntil ? format(new Date(coupon.validUntil), 'MMM d, yyyy') : 'Never'}
          </span>
        </div>
      </div>
      
      {coupon.razorpayOfferId && (
        <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded flex items-center gap-2">
          <Tag className="w-3 h-3" />
          <span className="font-mono truncate">{coupon.razorpayOfferId}</span>
        </div>
      )}
    </motion.div>
  );
}

function CreateCouponModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    razorpayOfferId: '',
    maxUses: '',
    validUntil: ''
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => adminApi.createCoupon({
      ...data,
      value: Number(data.value),
      maxUses: data.maxUses ? Number(data.maxUses) : -1
    }),
    onSuccess: () => {
      toast.success('Coupon created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error('Failed to create coupon');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Create New Coupon</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Coupon Code</label>
            <input 
              required
              type="text" 
              placeholder="e.g. SUMMER20" 
              className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none uppercase"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Type</label>
              <select 
                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Value</label>
              <input 
                required
                type="number" 
                placeholder="20" 
                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.value}
                onChange={e => setFormData({...formData, value: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Razorpay Offer ID</label>
            <input 
              type="text" 
              placeholder="offer_Lx..." 
              className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-sm"
              value={formData.razorpayOfferId}
              onChange={e => setFormData({...formData, razorpayOfferId: e.target.value})}
            />
            <p className="text-xs text-gray-500">Required for Razorpay subscriptions.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Max Uses</label>
              <input 
                type="number" 
                placeholder="No limit" 
                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.maxUses}
                onChange={e => setFormData({...formData, maxUses: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Valid Until</label>
              <input 
                type="date" 
                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.validUntil}
                onChange={e => setFormData({...formData, validUntil: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Coupon
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
