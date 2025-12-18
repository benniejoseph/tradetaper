import Link from 'next/link';
import { 
  FaFileContract, 
  FaShieldAlt, 
  FaMoneyBillWave, 
  FaQuestionCircle, 
  FaChartLine, 
  FaArrowRight,
  FaGavel,
  FaLock,
  FaUserShield,
  FaHandshake,
  FaCheckCircle,
  FaCertificate
} from 'react-icons/fa';

export const metadata = {
  title: 'Legal Documents | TradeTaper',
  description: 'Legal documents and policies for TradeTaper trading journal platform',
};

const LegalDocumentCard = ({ 
  title, 
  description, 
  href, 
  icon: Icon, 
  gradient,
  lastUpdated,
  readTime
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  gradient: string;
  lastUpdated: string;
  readTime: string;
}) => (
  <Link
    href={href}
    className="group relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50 block overflow-hidden"
  >
    {/* Background gradient effect */}
    <div className={`absolute inset-0 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
    
    <div className="relative z-10">
      <div className={`w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
      <Icon className="text-2xl text-white" />
    </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
      {title}
    </h3>
      
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 text-lg">
      {description}
    </p>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Updated {lastUpdated}</span>
            <span>•</span>
            <span>{readTime} read</span>
          </div>
        </div>
        
    <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
      Read document <FaArrowRight className="ml-2 text-sm" />
        </div>
      </div>
    </div>
  </Link>
);

export default function LegalIndexPage() {
  const legalDocuments = [
    {
      title: 'Terms of Service',
      description: 'Our comprehensive terms and conditions for using TradeTaper. Learn about your rights, responsibilities, and the rules that govern our platform usage.',
      href: '/legal/terms',
      icon: FaFileContract,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      lastUpdated: 'Dec 1, 2024',
      readTime: '10 min'
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, protect, and manage your personal data. We are committed to keeping your trading information secure and private.',
      href: '/legal/privacy',
      icon: FaShieldAlt,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-700',
      lastUpdated: 'Dec 1, 2024',
      readTime: '12 min'
    },
    {
      title: 'Cancellation & Refund Policy',
      description: 'Our policies regarding subscription cancellations, refunds, and billing. Clear information about managing your TradeTaper subscription.',
      href: '/legal/cancellation-refund',
      icon: FaMoneyBillWave,
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
      lastUpdated: 'Dec 1, 2024',
      readTime: '5 min'
    }
  ];

  const trustIndicators = [
    {
      icon: FaLock,
      title: 'Bank-Level Security',
      description: '256-bit SSL encryption'
    },
    {
      icon: FaUserShield,
      title: 'GDPR Compliant',
      description: 'European data protection'
    },
    {
      icon: FaCertificate,
      title: 'SOC 2 Type II',
      description: 'Security certified'
    },
    {
      icon: FaHandshake,
      title: 'Transparent Policies',
      description: 'Clear and fair terms'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Professional Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 dark:from-black dark:via-blue-950 dark:to-black">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-300 mb-8">
              <Link href="/" className="hover:text-white transition-colors flex items-center">
                <FaChartLine className="inline-block mr-2" />
                TradeTaper
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-white font-medium">Legal Center</span>
            </div>

            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 backdrop-blur-sm px-6 py-3 rounded-full text-emerald-300 text-sm font-medium mb-8 border border-blue-500/20">
              <FaGavel className="w-4 h-4" />
              <span>Legal & Compliance</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Legal Documents
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Important legal information and policies for TradeTaper. We believe in transparency 
              and clear communication about how we operate and protect your interests.
            </p>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <indicator.icon className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-white font-semibold text-sm mb-1">{indicator.title}</h3>
                  <p className="text-gray-400 text-xs">{indicator.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legal Documents Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {legalDocuments.map((doc) => (
            <LegalDocumentCard
              key={doc.href}
              title={doc.title}
              description={doc.description}
              href={doc.href}
              icon={doc.icon}
              gradient={doc.gradient}
              lastUpdated={doc.lastUpdated}
              readTime={doc.readTime}
            />
          ))}
        </div>
      </div>

      {/* Compliance Section */}
      <div className="bg-gray-50 dark:bg-gray-900/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Commitment to Compliance
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              TradeTaper adheres to the highest standards of legal compliance and data protection
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Regular Updates</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our legal documents are reviewed and updated regularly to ensure compliance with the latest regulations
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Plain Language</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We write our policies in clear, understandable language without unnecessary legal jargon
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">User Rights First</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your rights and privacy are our top priority in all our policies and practices
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5"></div>
          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FaQuestionCircle className="text-4xl text-white" />
          </div>
          
            <h2 className="text-3xl font-bold text-white mb-4">
              Have Questions About Our Policies?
          </h2>
          
            <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto">
              Our legal team is here to help clarify any questions you may have about our terms, 
              privacy practices, or compliance measures.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
            >
              <FaQuestionCircle className="mr-2" />
              Visit Support Center
            </Link>
            
            <a
              href="mailto:legal@tradetaper.com"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold"
            >
              Contact Legal Team
            </a>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated Notice */}
      <div className="bg-gray-100 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>All legal documents are regularly reviewed and updated to ensure compliance and clarity.</p>
            <p className="mt-1 font-medium">Last comprehensive review: December 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
} 