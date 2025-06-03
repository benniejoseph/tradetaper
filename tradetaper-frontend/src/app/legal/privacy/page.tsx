import Link from 'next/link';
import MarkdownContent from '@/components/common/MarkdownContent';
import { FaChartLine, FaShieldAlt, FaArrowLeft, FaCalendarAlt, FaLock, FaDatabase, FaUserShield, FaEye } from 'react-icons/fa';

export const metadata = {
  title: 'Privacy Policy | TradeTaper',
  description: 'Privacy Policy for TradeTaper trading journal platform'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Professional Header with Navigation */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/8 via-emerald-600/8 to-teal-600/8"></div>
        <div className="relative border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo and Breadcrumb */}
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                  <FaChartLine className="w-6 h-6 text-green-600" />
                  <span className="text-xl font-bold">TradeTaper</span>
                </Link>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>/</span>
                  <Link href="/legal" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Legal</Link>
                  <span>/</span>
                  <span className="text-gray-900 dark:text-white font-medium">Privacy Policy</span>
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
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm px-6 py-3 rounded-full text-green-700 dark:text-green-300 text-sm font-medium mb-8 border border-green-200/30 dark:border-green-800/30">
            <FaShieldAlt className="w-4 h-4" />
            <span>Data Protection</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 dark:text-green-400">GDPR Compliant</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-900 dark:from-white dark:via-green-200 dark:to-emerald-200 bg-clip-text text-transparent mb-6">
            Privacy Policy
          </h1>
          
          <div className="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400 mb-8">
            <FaCalendarAlt className="w-4 h-4" />
            <span className="font-medium">Effective Date: December 1, 2024</span>
            <span>•</span>
            <span>Version 3.0</span>
          </div>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your privacy is fundamental to our mission. Learn how we collect, protect, and manage your personal data 
            with the highest standards of security and transparency.
          </p>
        </div>
      </div>

      {/* Privacy Highlights */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">End-to-End Encryption</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Your data is encrypted in transit and at rest</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FaDatabase className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Data Ownership</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">You own and control your trading data</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FaUserShield className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">GDPR Compliant</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Full compliance with data protection laws</p>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FaEye className="text-white text-xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Full Transparency</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Clear communication about data usage</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Document Container */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Document Header */}
          <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <FaShieldAlt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy & Data Protection</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive privacy policy and data handling practices</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>GDPR Compliant</div>
                <div className="font-semibold text-green-600 dark:text-green-400">✓ Verified</div>
              </div>
            </div>
          </div>
          
          {/* Document Content */}
          <div className="px-8 py-12">
            <MarkdownContent 
              contentType="privacy"
              className="prose prose-xl prose-gray dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-4xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700
                prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-green-900 dark:prose-h2:text-green-100
                prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-emerald-800 dark:prose-h3:text-emerald-200
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-8 prose-p:text-lg
                prose-a:text-green-600 dark:prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:my-8 prose-li:my-3 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:text-lg
                prose-ol:my-8 prose-ol:text-lg
                prose-blockquote:border-l-4 prose-blockquote:border-green-500 prose-blockquote:bg-green-50/50 dark:prose-blockquote:bg-green-900/20 prose-blockquote:pl-8 prose-blockquote:py-6 prose-blockquote:my-8 prose-blockquote:rounded-r-lg
                prose-code:text-green-600 dark:prose-code:text-green-400 prose-code:bg-green-50 dark:prose-code:bg-green-900/20 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-medium"
            />
          </div>
        </div>

        {/* Data Rights & Support Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Data Rights Card */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shrink-0">
                <FaUserShield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Your Data Rights
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Exercise your privacy rights with full control over your personal data and trading information.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50/80 dark:bg-green-900/20 rounded-lg">
                    <FaDatabase className="text-green-600 dark:text-green-400 text-sm shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Request complete data export</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg">
                    <FaEye className="text-blue-600 dark:text-blue-400 text-sm shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Access and review your information</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-red-50/80 dark:bg-red-900/20 rounded-lg">
                    <FaShieldAlt className="text-red-600 dark:text-red-400 text-sm shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Delete your account and data</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a 
                    href="mailto:privacy@tradetaper.com" 
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm"
                  >
                    Contact Privacy Team
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Compliance Card */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shrink-0">
                <FaLock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Security & Compliance
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Enterprise-grade security measures and international compliance standards protect your data.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">GDPR Compliance</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">256-bit AES Encryption</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">SOC 2 Type II</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">ISO 27001 Certified</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Commitment */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/60 dark:border-green-800/60 rounded-2xl px-8 py-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FaShieldAlt className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-lg font-bold text-green-900 dark:text-green-100">Our Privacy Commitment</span>
            </div>
            <p className="text-green-800 dark:text-green-200 leading-relaxed">
              Your trust is the foundation of our relationship. We are committed to protecting your privacy and being completely 
              transparent about how we handle your data. We never sell your information, and we give you full control over your data at all times.
            </p>
            <div className="mt-4 text-sm text-green-700 dark:text-green-300">
              Questions about our privacy practices? Contact our Data Protection Officer at privacy@tradetaper.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 