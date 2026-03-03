/**
 * DataFast Payments API integration
 * Tracks successful payment conversions for revenue analytics.
 * API key is intentionally client-side (write-only tracking endpoint).
 */

const DATAFAST_API_KEY = 'df_634561827d9006776ff7a40fdf654364014873beddbe5bba';
const DATAFAST_PAYMENTS_URL = 'https://datafa.st/api/v1/payments';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
  return null;
}

/**
 * Send a payment conversion event to DataFast.
 * Silently no-ops if the visitor cookie is absent (e.g. incognito / ad-blocker).
 * Never throws — must not interrupt the payment success flow.
 */
export async function trackDatafastPayment(params: {
  amount: number;       // in major currency unit (e.g. 19.99 for ₹19.99)
  currency: string;     // ISO 4217 e.g. "INR"
  transactionId: string; // Razorpay payment ID (pay_xxx)
}): Promise<void> {
  try {
    const visitorId = getCookie('datafast_visitor_id');
    if (!visitorId) return;

    await fetch(DATAFAST_PAYMENTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DATAFAST_API_KEY}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        transaction_id: params.transactionId,
        datafast_visitor_id: visitorId,
      }),
    });
  } catch {
    // Intentionally silent — analytics must never break the payment flow
  }
}
