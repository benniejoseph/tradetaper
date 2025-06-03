import Link from 'next/link';

export const metadata = {
  title: 'Legal Documents | TradeTaper',
  description: 'Legal documents and policies for TradeTaper trading journal platform'
};

export default function LegalIndexPage() {
  const legalDocuments = [
    {
      title: 'Terms of Service',
      description: 'Our terms and conditions for using TradeTaper',
      href: '/legal/terms',
      icon: '📄'
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your data',
      href: '/legal/privacy',
      icon: '🔒'
    },
    {
      title: 'Cancellation & Refund Policy',
      description: 'Our policies regarding cancellations and refunds',
      href: '/legal/cancellation-refund',
      icon: '💰'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Legal Documents</h1>
          <p className="text-lg text-gray-600">
            Important legal information and policies for TradeTaper
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {legalDocuments.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
            >
              <div className="text-3xl mb-4">{doc.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {doc.title}
              </h3>
              <p className="text-gray-600">{doc.description}</p>
              <div className="mt-4 text-blue-600 font-medium">
                Read document →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Need Help?
            </h2>
            <p className="text-gray-600 mb-4">
              If you have questions about any of our legal documents, please contact our support team.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 