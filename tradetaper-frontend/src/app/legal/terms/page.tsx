import Link from 'next/link';
import MarkdownContent from '@/components/common/MarkdownContent';
import { FaChartLine, FaFileContract, FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';

export const metadata = {
  title: 'Terms of Service | TradeTaper',
  description: 'Terms of Service for TradeTaper trading journal platform'
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-green-600/10 backdrop-blur-3xl"></div>
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
              <span className="text-gray-900 dark:text-white">Terms of Service</span>
            </div>

            {/* Back Link */}
            <Link 
              href="/legal" 
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-6 group"
            >
              <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Legal Documents
            </Link>

            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm px-4 py-2 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                <FaFileContract className="w-4 h-4" />
                <span>Legal Agreement</span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Terms of Service
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
              contentType="terms"
              className="prose prose-lg prose-blue dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mb-8
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:my-6 prose-li:my-2 prose-li:text-gray-700 dark:prose-li:text-gray-300
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-6"
            />
          </div>
        </div>

        {/* Action Section */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Questions About These Terms?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              If you have any questions about our Terms of Service, please don&apos;t hesitate to contact us.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> legal@tradetaper.com
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Support:</strong> support@tradetaper.com
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
                href="/legal/privacy" 
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Privacy Policy →
              </Link>
              <Link 
                href="/legal/cancellation-refund" 
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Cancellation & Refund Policy →
              </Link>
              <Link 
                href="/support" 
                className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Support Center →
              </Link>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-6 py-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Legal Notice:</strong> By using TradeTaper, you agree to be bound by these Terms of Service. 
              Please read them carefully and contact us if you have any questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 