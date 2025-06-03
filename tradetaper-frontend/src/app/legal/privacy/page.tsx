import Link from 'next/link';
import MarkdownContent from '@/components/common/MarkdownContent';
import { FaChartLine, FaShieldAlt, FaArrowLeft, FaCalendarAlt, FaLock, FaDatabase } from 'react-icons/fa';

export const metadata = {
  title: 'Privacy Policy | TradeTaper',
  description: 'Privacy Policy for TradeTaper trading journal platform'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-blue-600/10 to-purple-600/10 backdrop-blur-3xl"></div>
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
              <span className="text-gray-900 dark:text-white">Privacy Policy</span>
            </div>

            {/* Back Link */}
            <Link 
              href="/legal" 
              className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors mb-6 group"
            >
              <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Legal Documents
            </Link>

            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm px-4 py-2 rounded-full text-green-700 dark:text-green-300 text-sm font-medium mb-6">
                <FaShieldAlt className="w-4 h-4" />
                <span>Data Protection</span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Privacy Policy
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
              contentType="privacy"
              className="prose prose-lg prose-green dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mb-8
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-green-600 dark:prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:my-6 prose-li:my-2 prose-li:text-gray-700 dark:prose-li:text-gray-300
                prose-blockquote:border-l-4 prose-blockquote:border-green-500 prose-blockquote:bg-green-50/50 dark:prose-blockquote:bg-green-900/20 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-6"
            />
          </div>
        </div>

        {/* Privacy Highlights */}
        <div className="mt-12 grid gap-6 md:grid-cols-3 mb-12">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              End-to-End Encryption
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your trading data is encrypted both in transit and at rest, ensuring maximum security.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <FaDatabase className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Data Ownership
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your trading data belongs to you. We never sell or share your personal information.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="text-white text-lg" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              GDPR Compliant
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We follow strict data protection regulations and give you full control over your data.
            </p>
          </div>
        </div>

        {/* Action Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Data Requests */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Data Rights
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have the right to access, update, or delete your personal data at any time.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="text-green-500 text-xs" />
                <span className="text-gray-700 dark:text-gray-300">Request data export</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="text-green-500 text-xs" />
                <span className="text-gray-700 dark:text-gray-300">Update your information</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="text-green-500 text-xs" />
                <span className="text-gray-700 dark:text-gray-300">Delete your account</span>
              </div>
            </div>
            <div className="mt-4">
              <a 
                href="mailto:privacy@tradetaper.com" 
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium"
              >
                Contact Privacy Team →
              </a>
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
                className="block text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                Terms of Service →
              </Link>
              <Link 
                href="/legal/cancellation-refund" 
                className="block text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                Cancellation & Refund Policy →
              </Link>
              <Link 
                href="/support" 
                className="block text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                Support Center →
              </Link>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-6 py-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Privacy Commitment:</strong> Your trust is important to us. We are committed to protecting your privacy 
              and being transparent about how we handle your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 