import Link from 'next/link';
import MarkdownContent from '@/components/common/MarkdownContent';
import { 
  FaChartLine, 
  FaEnvelope, 
  FaBook, 
  FaLifeRing, 
  FaRocket,
  FaHeadset,
  FaComments,
  FaBug,
  FaLightbulb,
  FaPhoneAlt,
  FaTicketAlt,
  FaGraduationCap,
  FaUsers
} from 'react-icons/fa';

export const metadata = {
  title: 'Support Center | TradeTaper',
  description: 'Support and help documentation for TradeTaper trading journal platform'
};

const SupportCard = ({ 
  title, 
  description, 
  icon: Icon, 
  gradient,
  action,
  href
}: {
  title: string;
  description: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  gradient: string;
  action: string;
  href: string;
}) => (
  <div className="group relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50">
    <div className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="text-xl text-white" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm">
      {description}
    </p>
    {href.startsWith('mailto:') || href.startsWith('tel:') ? (
      <a 
        href={href}
        className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors font-medium text-sm group-hover:translate-x-1 duration-300"
      >
        {action} →
      </a>
    ) : (
      <Link 
        href={href}
        className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors font-medium text-sm group-hover:translate-x-1 duration-300"
      >
        {action} →
      </Link>
    )}
    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </div>
);

export default function SupportPage() {
  const supportOptions = [
    {
      title: 'Live Chat Support',
      description: 'Get instant help from our support team. Available 9 AM - 6 PM EST for real-time assistance.',
      icon: FaComments,
      gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      action: 'Start Chat',
      href: '#chat'
    },
    {
      title: 'Email Support',
      description: 'Send us detailed questions and get comprehensive responses within 4 hours.',
      icon: FaEnvelope,
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
      action: 'Send Email',
      href: 'mailto:support@tradetaper.com'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our support specialists for urgent issues and guided assistance.',
      icon: FaPhoneAlt,
      gradient: 'bg-gradient-to-r from-purple-500 to-violet-600',
      action: 'Call Now',
      href: 'tel:+1-555-TRADETAPER'
    },
    {
      title: 'Knowledge Base',
      description: 'Browse our comprehensive documentation, tutorials, and frequently asked questions.',
      icon: FaBook,
      gradient: 'bg-gradient-to-r from-indigo-500 to-blue-600',
      action: 'Browse Docs',
      href: '#documentation'
    },
    {
      title: 'Submit Ticket',
      description: 'Create a support ticket for complex issues that require detailed investigation.',
      icon: FaTicketAlt,
      gradient: 'bg-gradient-to-r from-red-500 to-pink-600',
      action: 'Create Ticket',
      href: 'mailto:tickets@tradetaper.com'
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides to master TradeTaper features and best practices.',
      icon: FaGraduationCap,
      gradient: 'bg-gradient-to-r from-orange-500 to-red-600',
      action: 'Watch Videos',
      href: '#tutorials'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Professional Header with Navigation */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/8 via-amber-600/8 to-yellow-600/8"></div>
        <div className="relative border-b border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo and Breadcrumb */}
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <FaChartLine className="w-6 h-6 text-orange-600" />
                  <span className="text-xl font-bold">TradeTaper</span>
                </Link>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>/</span>
                  <span className="text-gray-900 dark:text-white font-medium">Support Center</span>
                </div>
              </div>
              
              {/* Support Status */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Support Online</span>
                </div>
                <a 
                  href="mailto:support@tradetaper.com"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-200"
                >
                  <FaEnvelope className="mr-2 text-xs" />
                  Quick Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 backdrop-blur-sm px-6 py-3 rounded-full text-orange-700 dark:text-orange-300 text-sm font-medium mb-8 border border-orange-200/30 dark:border-orange-800/30">
            <FaLifeRing className="w-4 h-4" />
            <span>Help & Support</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 dark:text-green-400">Online</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-orange-800 to-amber-900 dark:from-white dark:via-orange-200 dark:to-amber-200 bg-clip-text text-transparent mb-6">
            Support Center
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Get the help you need to make the most of your TradeTaper experience. 
            Our dedicated support team is here to ensure your trading journal journey is smooth and successful.
          </p>

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-3 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">&lt; 4 hours</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Average Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">98%</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">24/7</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Knowledge Base</div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Options Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {supportOptions.map((option) => (
            <SupportCard
              key={option.title}
              title={option.title}
              description={option.description}
              icon={option.icon}
              gradient={option.gradient}
              action={option.action}
              href={option.href}
            />
          ))}
        </div>
      </div>

      {/* Documentation Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div id="documentation" className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Documentation Header */}
          <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl">
                  <FaBook className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h2>
                  <p className="text-gray-600 dark:text-gray-400">Comprehensive guides and documentation</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>Last Updated</div>
                <div className="font-semibold text-orange-600 dark:text-orange-400">Dec 1, 2024</div>
              </div>
            </div>
          </div>
          
          {/* Documentation Content */}
          <div className="px-8 py-12">
            <MarkdownContent 
              contentType="support"
              className="prose prose-xl prose-gray dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-4xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700
                prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-orange-900 dark:prose-h2:text-orange-100
                prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-amber-800 dark:prose-h3:text-amber-200
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-8 prose-p:text-lg
                prose-a:text-orange-600 dark:prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:my-8 prose-li:my-3 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:text-lg
                prose-ol:my-8 prose-ol:text-lg
                prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50/50 dark:prose-blockquote:bg-orange-900/20 prose-blockquote:pl-8 prose-blockquote:py-6 prose-blockquote:my-8 prose-blockquote:rounded-r-lg
                prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-code:bg-orange-50 dark:prose-code:bg-orange-900/20 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-medium"
            />
          </div>
        </div>

        {/* Additional Support Resources */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Community & Resources Card */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shrink-0">
                <FaUsers className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Community & Resources
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Connect with other traders, share strategies, and access exclusive educational content.
                </p>
                <div className="space-y-4">
                  <Link 
                    href="#community"
                    className="flex items-center justify-between p-3 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">Trading Community Forum</span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <Link 
                    href="#tutorials"
                    className="flex items-center justify-between p-3 bg-green-50/80 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">Video Tutorial Library</span>
                    <span className="text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <Link 
                    href="#blog"
                    className="flex items-center justify-between p-3 bg-purple-50/80 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">Trading Tips & Blog</span>
                    <span className="text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Support Card */}
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shrink-0">
                <FaRocket className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Enterprise Support
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Premium support services for professional traders and institutions.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Priority Response</span>
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">&lt; 1 hour</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Dedicated Manager</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">✓ Included</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Phone & Video Support</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Available</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a 
                    href="mailto:enterprise@tradetaper.com"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-200 font-medium text-sm"
                  >
                    Contact Enterprise
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Requests & Bug Reports */}
        <div className="mt-16 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FaLightbulb className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Help Us Improve</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your feedback drives our innovation. Submit feature requests, report bugs, or share ideas to help us build a better trading journal.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
            <a 
              href="mailto:feedback@tradetaper.com"
              className="flex items-center space-x-3 p-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
            >
              <FaLightbulb className="text-blue-600 dark:text-blue-400 text-lg shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">Feature Request</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Share your ideas</div>
              </div>
              <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            
            <a 
              href="mailto:bugs@tradetaper.com"
              className="flex items-center space-x-3 p-4 bg-red-50/80 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
            >
              <FaBug className="text-red-600 dark:text-red-400 text-lg shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">Report Bug</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Help us fix issues</div>
              </div>
              <span className="text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>

        {/* Support Commitment */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/60 dark:border-orange-800/60 rounded-2xl px-8 py-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FaHeadset className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-lg font-bold text-orange-900 dark:text-orange-100">Our Support Commitment</span>
            </div>
            <p className="text-orange-800 dark:text-orange-200 leading-relaxed">
              Your success is our success. We&apos;re committed to providing exceptional support that helps you master TradeTaper 
              and achieve your trading goals. Whether you&apos;re a beginner or an experienced trader, our team is here to support you every step of the way.
            </p>
            <div className="mt-4 text-sm text-orange-700 dark:text-orange-300">
              Need immediate assistance? Email us at support@tradetaper.com or call +1-555-TRADETAPER
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 