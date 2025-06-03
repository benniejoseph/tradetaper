import Link from 'next/link';
import MarkdownContent from '@/components/common/MarkdownContent';
import { FaChartLine, FaMoneyBillWave, FaArrowLeft, FaCalendarAlt, FaCreditCard, FaUndo, FaHeadset, FaPercentage, FaPhoneAlt } from 'react-icons/fa';

export const metadata = {
  title: 'Cancellation & Refund Policy | TradeTaper',
  description: 'Cancellation and Refund Policy for TradeTaper trading journal platform'
};

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-violet-50/50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Professional Header with Navigation */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/8 via-violet-600/8 to-indigo-600/8"></div>
        <div className="relative border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo and Breadcrumb */}
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <FaChartLine className="w-6 h-6 text-purple-600" />
                  <span className="text-xl font-bold">TradeTaper</span>
                </Link>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>/</span>
                  <Link href="/legal" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Legal</Link>
                  <span>/</span>
                  <span className="text-gray-900 dark:text-white font-medium">Cancellation & Refund Policy</span>
                </div>
              </div>
              
              {/* Back Navigation */}
              <Link 
                href="/legal" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200 group"
              >
                <FaArrowLeft className="mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Legal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 backdrop-blur-sm px-6 py-3 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium mb-8 border border-purple-200/30 dark:border-purple-800/30">
            <FaMoneyBillWave className="w-4 h-4" />
            <span>Billing & Refunds</span>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-purple-700 dark:text-purple-400">Fair Policy</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-violet-900 dark:from-white dark:via-purple-200 dark:to-violet-200 bg-clip-text text-transparent mb-6">
            Cancellation & Refund Policy
          </h1>
          
          <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400 mb-8">
            <FaCalendarAlt className="w-4 h-4" />
            <span className="font-medium">Effective Date: December 1, 2024</span>
            <span>•</span>
            <span>Version 2.0</span>
          </div>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We believe in fair and transparent billing practices. Learn about our 30-day money-back guarantee 
            and straightforward cancellation process designed with your needs in mind.
          </p>
        </div>
      </div>

      {/* Key Policy Highlights */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FaPercentage className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">30-Day Money Back</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Full refund within 30 days, no questions asked</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FaUndo className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Easy Cancellation</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Cancel anytime from your account settings</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FaHeadset className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">24/7 Support</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Dedicated billing support team available</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Document Container */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Document Header */}
          <div className="bg-gradient-to-r from-purple-50/80 to-violet-50/80 dark:from-purple-900/20 dark:to-violet-900/20 px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl">
                  <FaMoneyBillWave className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Refund Policy</h2>
                  <p className="text-gray-600 dark:text-gray-400">Fair cancellation and refund terms</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>30-Day Guarantee</div>
                <div className="font-semibold text-green-600 dark:text-green-400">✓ Active</div>
              </div>
            </div>
          </div>
          
          {/* Document Content */}
          <div className="px-8 py-12">
            <MarkdownContent 
              contentType="cancellation-refund"
              className="prose prose-xl prose-gray dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-4xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700
                prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-purple-900 dark:prose-h2:text-purple-100
                prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-violet-800 dark:prose-h3:text-violet-200
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-8 prose-p:text-lg
                prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:my-8 prose-li:my-3 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:text-lg
                prose-ol:my-8 prose-ol:text-lg
                prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-50/50 dark:prose-blockquote:bg-purple-900/20 prose-blockquote:pl-8 prose-blockquote:py-6 prose-blockquote:my-8 prose-blockquote:rounded-r-lg
                prose-code:text-purple-600 dark:prose-code:text-purple-400 prose-code:bg-purple-50 dark:prose-code:bg-purple-900/20 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-medium"
            />
          </div>
        </div>

        {/* Quick Actions & Support Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Quick Actions Card */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shrink-0">
                <FaCreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Quick Billing Actions
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Manage your subscription, request refunds, or get billing support with just a few clicks.
                </p>
                <div className="space-y-4">
                  <Link 
                    href="/billing" 
                    className="flex items-center justify-between p-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <FaUndo className="text-blue-600 dark:text-blue-400 text-sm" />
                      <span className="text-gray-900 dark:text-white font-medium">Cancel Subscription</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <a 
                    href="mailto:billing@tradetaper.com"
                    className="flex items-center justify-between p-4 bg-green-50/80 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <FaPercentage className="text-green-600 dark:text-green-400 text-sm" />
                      <span className="text-gray-900 dark:text-white font-medium">Request Refund</span>
                    </div>
                    <span className="text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                  <Link 
                    href="/pricing"
                    className="flex items-center justify-between p-4 bg-purple-50/80 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <FaMoneyBillWave className="text-purple-600 dark:text-purple-400 text-sm" />
                      <span className="text-gray-900 dark:text-white font-medium">View Pricing Plans</span>
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Support & Contact Card */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shrink-0">
                <FaHeadset className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Billing Support Team
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Our dedicated billing team is here to help with any questions about subscriptions, 
                  refunds, or payment issues.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Email Response</span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">&lt; 4 hours</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Phone Support</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">Available</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Live Chat</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">9 AM - 6 PM EST</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <a 
                    href="mailto:billing@tradetaper.com"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-200 font-medium text-sm mr-3"
                  >
                    Email Billing
                  </a>
                  <a 
                    href="tel:+1-555-TRADETAPER"
                    className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm"
                  >
                    <FaPhoneAlt className="mr-2 text-xs" />
                    Call Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Money-Back Guarantee */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/60 dark:border-green-800/60 rounded-2xl px-8 py-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FaPercentage className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-lg font-bold text-green-900 dark:text-green-100">30-Day Money-Back Guarantee</span>
            </div>
            <p className="text-green-800 dark:text-green-200 leading-relaxed">
              We&apos;re confident you&apos;ll love TradeTaper. If you&apos;re not completely satisfied within the first 30 days, 
              we&apos;ll refund your subscription in full—no questions asked. Your satisfaction is our priority, and we stand behind 
              our commitment to providing exceptional trading journal software.
            </p>
            <div className="mt-4 text-sm text-green-700 dark:text-green-300">
              Questions about our refund policy? Contact our billing team at billing@tradetaper.com or call us directly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 