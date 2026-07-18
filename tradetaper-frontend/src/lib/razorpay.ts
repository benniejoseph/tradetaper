const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let razorpayLoadPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  const razorpayWindow = window as Window & { Razorpay?: unknown };
  if (razorpayWindow.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayLoadPromise) {
    return razorpayLoadPromise;
  }

  razorpayLoadPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SDK_URL}"]`,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SDK_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  }).then((loaded) => {
    if (!loaded) {
      razorpayLoadPromise = null;
    }
    return loaded;
  });

  return razorpayLoadPromise;
}
