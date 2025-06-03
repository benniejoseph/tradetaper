import MarkdownContent from '@/components/common/MarkdownContent';

export const metadata = {
  title: 'Cancellation & Refund Policy | TradeTaper',
  description: 'Cancellation and Refund Policy for TradeTaper trading journal platform'
};

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-8 py-12">
            <MarkdownContent 
              contentType="cancellation-refund"
              title="Cancellation & Refund Policy"
              className="text-gray-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 