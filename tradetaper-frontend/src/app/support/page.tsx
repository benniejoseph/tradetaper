import Link from 'next/link';
import MarkdownContent from '@/components/common/MarkdownContent';
import { 
  FaChartLine, 
  FaEnvelope, 
  FaBook, 
  FaLifeRing, 
  FaRocket,
  FaClock,
  FaHeadset,
  FaComments,
  FaBug,
  FaLightbulb
} from 'react-icons/fa';

export const metadata = {
  title: 'Support | TradeTaper',
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
  <div className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50">
    <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="text-lg text-white" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm">
      {description}
    </p>
    {href.startsWith('mailto:') ? (
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
      title: 'Email Support',
      description: 'Get personalized help from our support team. We typically respond within 24 hours.',
      icon: FaEnvelope,
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      action: 'Send Email',
      href: 'mailto:support@tradetaper.com'
    },
    {
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials to get the most out of TradeTaper.',
      icon: FaBook,
      gradient: 'bg-gradient-to-r from-green-500 to-green-600',
      action: 'View Docs',
      href: '#documentation'
    },
    {
      title: 'Feature Requests',
      description: 'Have an idea to improve TradeTaper? We love hearing from our users!',
      icon: FaLightbulb,
      gradient: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      action: 'Submit Idea',
      href: 'mailto:feedback@tradetaper.com'
    },
    {
      title: 'Bug Reports',
      description: 'Found a bug? Help us improve by reporting issues you encounter.',
      icon: FaBug,
      gradient: 'bg-gradient-to-r from-red-500 to-red-600',
      action: 'Report Bug',
      href: 'mailto:bugs@tradetaper.com'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time during business hours (9 AM - 6 PM EST).',
      icon: FaComments,
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
      action: 'Start Chat',
      href: '#chat'
    },
    {
      title: 'Billing Help',
      description: 'Questions about your subscription, billing, or account? We can help with that.',
      icon: FaHeadset,
      gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      action: 'Contact Billing',
      href: 'mailto:billing@tradetaper.com'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-yellow-600/10 to-red-600/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <FaChartLine className="inline-block mr-1" />
                TradeTaper
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">Support</span>
            </div>

            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-orange-100/80 dark:bg-orange-900/30 backdrop-blur-sm px-4 py-2 rounded-full text-orange-700 dark:text-orange-300 text-sm font-medium mb-6">
                <FaLifeRing className="w-4 h-4" />
                <span>Help & Support</span>
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                How can we help you?
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Get the help you need to make the most of your TradeTaper experience. 
                Our support team is here to ensure your trading journal journey is smooth and successful.
              </p>
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

      {/* Quick Stats */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Support Statistics
          </h2>
          <div className="grid gap-6 md:grid-cols-3 text-center">
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                &lt;24 hours
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Average Response Time
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                98%
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Customer Satisfaction
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                24/7
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Documentation Available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Section */}
      <div id="documentation" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-full w-10 h-10 flex items-center justify-center">
                <FaBook className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Support Documentation
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive guides and help articles
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-12">
            <MarkdownContent 
              contentType="support"
              className="prose prose-lg prose-orange dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mb-8
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-orange-600 dark:prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-ul:my-6 prose-li:my-2 prose-li:text-gray-700 dark:prose-li:text-gray-300
                prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50/50 dark:prose-blockquote:bg-orange-900/20 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-6
                prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-code:bg-orange-50 dark:prose-code:bg-orange-900/20 prose-code:px-2 prose-code:py-1 prose-code:rounded"
            />
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Emergency Support */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full w-10 h-10 flex items-center justify-center">
                <FaRocket className="text-white text-sm" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Priority Support
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Enterprise customers get priority support with faster response times and dedicated assistance.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <FaClock className="text-orange-500 text-xs" />
                <span className="text-gray-700 dark:text-gray-300">4-hour response time</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaHeadset className="text-orange-500 text-xs" />
                <span className="text-gray-700 dark:text-gray-300">Dedicated support manager</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaRocket className="text-orange-500 text-xs" />
                <span className="text-gray-700 dark:text-gray-300">Phone support available</span>
              </div>
            </div>
          </div>

          {/* Community */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                <FaComments className="text-white text-sm" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Community & Resources
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Connect with other traders and access additional resources to enhance your trading journey.
            </p>
            <div className="space-y-3">
              <a 
                href="#" 
                className="block text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors text-sm"
              >
                Trading Community Forum →
              </a>
              <a 
                href="#" 
                className="block text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors text-sm"
              >
                Video Tutorials →
              </a>
              <a 
                href="#" 
                className="block text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors text-sm"
              >
                Trading Tips Blog →
              </a>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-orange-50/80 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-6 py-4">
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
              <strong>Still need help?</strong> Our support team is always ready to assist you.
            </p>
            <a 
              href="mailto:support@tradetaper.com"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium text-sm"
            >
              <FaEnvelope className="mr-2" />
              Contact Support Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 