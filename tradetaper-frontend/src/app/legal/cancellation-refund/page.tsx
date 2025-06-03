import Link from 'next/link';
import MarkdownContent from '@/components/common/MarkdownContent';
import { FaChartLine, FaMoneyBillWave, FaArrowLeft, FaCalendarAlt, FaCreditCard, FaUndo, FaHeadset } from 'react-icons/fa';

export const metadata = {
  title: 'Cancellation & Refund Policy | TradeTaper',
  description: 'Cancellation and Refund Policy for TradeTaper trading journal platform'
};

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-green-600/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <FaChartLine className="inline-block mr-1" />
                TradeTaper
              </Link>
              <span>/</span>
              <Link href="/legal" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Legal
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">Cancellation & Refund Policy</span>
            </div>

            {/* Back Link */}
            <Link 
              href="/legal" 
              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors mb-6 group"
            >
              <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Legal Documents
            </Link>

            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-purple-100/80 dark:bg-purple-900/30 backdrop-blur-sm px-4 py-2 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
                <FaMoneyBillWave className="w-4 h-4" />
                <span>Billing & Refunds</span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Cancellation & Refund Policy
              </h1>
              
              <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                <FaCalendarAlt className="w-4 h-4" />
                <span>Effective Date: December 1, 2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
          <div className="px-8 py-12">
            <MarkdownContent 
              contentType="cancellation-refund"
              className="prose prose-lg prose-purple dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mb-8
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:my-6 prose-li:my-2 prose-li:text-gray-700 dark:prose-li:text-gray-300
                prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-50/50 dark:prose-blockquote:bg-purple-900/20 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-6"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid gap-6 md:grid-cols-3 mb-12">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <FaUndo className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Cancel Subscription
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Cancel your subscription anytime from your account settings.
            </p>
            <Link 
              href="/billing" 
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium text-sm"
            >
              Manage Subscription →
            </Link>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <FaCreditCard className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Request Refund
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Contact support to request a refund within our policy guidelines.
            </p>
            <a 
              href="mailto:billing@tradetaper.com" 
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium text-sm"
            >
              Contact Billing →
            </a>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <FaHeadset className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need Help?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Our support team is here to help with any billing questions.
            </p>
            <Link 
              href="/support" 
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium text-sm"
            >
              Get Support →
            </Link>
          </div>
        </div>

        {/* Action Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Billing Support */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Billing Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Have questions about your billing, refunds, or subscription? We&apos;re here to help.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Billing Email:</strong> billing@tradetaper.com
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Support Email:</strong> support@tradetaper.com
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Response Time:</strong> Within 24 hours
              </p>
            </div>
          </div>

          {/* Related Documents */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Related Documents
            </h3>
            <div className="space-y-3">
              <Link 
                href="/legal/terms" 
                className="block text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                Terms of Service →
              </Link>
              <Link 
                href="/legal/privacy" 
                className="block text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                Privacy Policy →
              </Link>
              <Link 
                href="/pricing" 
                className="block text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                View Pricing Plans →
              </Link>
            </div>
          </div>
        </div>

        {/* Refund Notice */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-6 py-4">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Fair Refund Policy:</strong> We offer a 30-day money-back guarantee for all new subscriptions. 
              No questions asked if you&apos;re not satisfied with TradeTaper.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 