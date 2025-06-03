import Link from 'next/link';
import { FaFileContract, FaShieldAlt, FaMoneyBillWave, FaQuestionCircle, FaChartLine, FaArrowRight } from 'react-icons/fa';

export const metadata = {
  title: 'Legal Documents | TradeTaper',
  description: 'Legal documents and policies for TradeTaper trading journal platform',
};

const LegalDocumentCard = ({ 
  title, 
  description, 
  href, 
  icon: Icon, 
  gradient 
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  gradient: string;
}) => (
  <Link
    href={href}
    className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50 dark:border-gray-700/50 block"
  >
    <div className={`w-16 h-16 rounded-xl ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="text-2xl text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
      {description}
    </p>
    <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
      Read document <FaArrowRight className="ml-2 text-sm" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-green-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </Link>
);

export default function LegalIndexPage() {
  const legalDocuments = [
    {
      title: 'Terms of Service',
      description: 'Our comprehensive terms and conditions for using TradeTaper. Learn about your rights and responsibilities when using our trading journal platform.',
      href: '/legal/terms',
      icon: FaFileContract,
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, protect, and manage your personal data. We are committed to keeping your trading information secure and private.',
      href: '/legal/privacy',
      icon: FaShieldAlt,
      gradient: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      title: 'Cancellation & Refund Policy',
      description: 'Our policies regarding subscription cancellations, refunds, and billing. Clear information about managing your TradeTaper subscription.',
      href: '/legal/cancellation-refund',
      icon: FaMoneyBillWave,
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-green-600/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
          <div className="text-center">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <FaChartLine className="inline-block mr-1" />
                TradeTaper
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">Legal</span>
            </div>

            <div className="inline-flex items-center space-x-2 bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm px-4 py-2 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
              <FaFileContract className="w-4 h-4" />
              <span>Legal & Compliance</span>
            </div>
            
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Legal Documents
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
              Important legal information and policies for TradeTaper. We believe in transparency and clear communication about how we operate.
            </p>
          </div>
        </div>
      </div>

      {/* Legal Documents Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {legalDocuments.map((doc) => (
            <LegalDocumentCard
              key={doc.href}
              title={doc.title}
              description={doc.description}
              href={doc.href}
              icon={doc.icon}
              gradient={doc.gradient}
            />
          ))}
        </div>
      </div>

      {/* Support Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-center">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <FaQuestionCircle className="text-2xl text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Need Help Understanding Our Policies?
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            If you have questions about any of our legal documents or need clarification on our policies, 
            our support team is here to help. We&apos;re committed to transparency and making sure you understand 
            your rights and our commitments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
            >
              <FaQuestionCircle className="mr-2" />
              Visit Support Center
            </Link>
            
            <a
              href="mailto:legal@tradetaper.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
            >
              Contact Legal Team
            </a>
          </div>
        </div>
      </div>

      {/* Last Updated Notice */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>All legal documents are regularly reviewed and updated to ensure compliance and clarity.</p>
          <p className="mt-1">Last updated: December 2024</p>
        </div>
      </div>
    </div>
  );
} 