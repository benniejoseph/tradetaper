import Link from 'next/link';
import MarkdownContent from '@/components/common/MarkdownContent';
import { FaChartLine, FaFileContract, FaArrowLeft, FaCalendarAlt, FaShieldAlt, FaUsers, FaBook } from 'react-icons/fa';

export const metadata = {
  title: 'Terms of Service | TradeTaper',
  description: 'Terms of Service for TradeTaper trading journal platform'
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Professional Header with Navigation */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-indigo-600/8 to-purple-600/8"></div>
        <div className="relative border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo and Breadcrumb */}
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <FaChartLine className="w-6 h-6 text-blue-600" />
                  <span className="text-xl font-bold">TradeTaper</span>
                </Link>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>/</span>
                  <Link href="/legal" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Legal</Link>
                  <span>/</span>
                  <span className="text-gray-900 dark:text-white font-medium">Terms of Service</span>
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
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm px-6 py-3 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-8 border border-blue-200/30 dark:border-blue-800/30">
            <FaFileContract className="w-4 h-4" />
            <span>Legal Agreement</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 dark:text-green-400">Current</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-6">
            Terms of Service
          </h1>
          
          <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400 mb-8">
            <FaCalendarAlt className="w-4 h-4" />
            <span className="font-medium">Effective Date: December 1, 2024</span>
            <span>•</span>
            <span>Version 2.1</span>
          </div>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            These terms govern your use of TradeTaper&apos;s professional trading journal platform. 
            Please read carefully as they contain important information about your rights and obligations.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Document Container */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Document Header */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <FaFileContract className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Legal Agreement</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive terms and conditions</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>Last Modified</div>
                <div className="font-semibold">Dec 1, 2024</div>
              </div>
            </div>
          </div>
          
          {/* Document Content */}
          <div className="px-8 py-12">
            <MarkdownContent 
              contentType="terms"
              className="prose prose-xl prose-gray dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-4xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700
                prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-blue-900 dark:prose-h2:text-blue-100
                prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-indigo-800 dark:prose-h3:text-indigo-200
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-8 prose-p:text-lg
                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:my-8 prose-li:my-3 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:text-lg
                prose-ol:my-8 prose-ol:text-lg
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:pl-8 prose-blockquote:py-6 prose-blockquote:my-8 prose-blockquote:rounded-r-lg
                prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-blue-900/20 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-medium"
            />
          </div>
        </div>

        {/* Support Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Questions Card */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shrink-0">
                <FaShieldAlt className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Questions About These Terms?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Our legal team is available to clarify any aspects of our Terms of Service. 
                  We believe in transparency and clear communication.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Legal Team:</strong> legal@tradetaper.com
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>General Support:</strong> support@tradetaper.com
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Response Time:</strong> Within 24 hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Documents Card */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shrink-0">
                <FaBook className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Related Legal Documents
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Complete your understanding with our other legal documents and policies.
                </p>
                <div className="space-y-4">
                  <Link 
                    href="/legal/privacy" 
                    className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">Privacy Policy</span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <Link 
                    href="/legal/cancellation-refund" 
                    className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">Cancellation & Refund Policy</span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <Link 
                    href="/support" 
                    className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">Support Center</span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise-level Legal Notice */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded-2xl px-8 py-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FaUsers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-lg font-bold text-amber-900 dark:text-amber-100">Important Legal Notice</span>
            </div>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
              By accessing and using TradeTaper, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
              These terms constitute a legally binding agreement between you and TradeTaper. If you do not agree with any part of these terms, 
              please discontinue use of our services immediately.
            </p>
            <div className="mt-4 text-sm text-amber-700 dark:text-amber-300">
              For questions regarding this agreement, please contact our legal team at legal@tradetaper.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 