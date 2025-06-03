import MarkdownContent from '@/components/common/MarkdownContent';

export const metadata = {
  title: 'Privacy Policy | TradeTaper',
  description: 'Privacy Policy for TradeTaper trading journal platform'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-8 py-12">
            <MarkdownContent 
              contentType="privacy"
              title="Privacy Policy"
              className="text-gray-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 