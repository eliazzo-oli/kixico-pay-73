import { useEffect } from 'react';

interface PixelTrackingOptions {
  pixelId?: string | null;
  enabled: boolean;
}

interface TrackPurchaseParams {
  value: number;
  currency: string;
}

export const usePixelTracking = ({ pixelId, enabled }: PixelTrackingOptions) => {
  useEffect(() => {
    if (!enabled || !pixelId) return;

    // Remove any existing Facebook Pixel script
    const existingScript = document.querySelector('script[src*="connect.facebook.net"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Initialize Facebook Pixel
    const initFacebookPixel = () => {
      // Create fbq function
      // @ts-ignore
      window.fbq = function() {
        // @ts-ignore
        window.fbq.callMethod 
          // @ts-ignore
          ? window.fbq.callMethod.apply(window.fbq, arguments) 
          // @ts-ignore
          : window.fbq.queue.push(arguments);
      };
      
      // @ts-ignore
      if (!window._fbq) window._fbq = window.fbq;
      // @ts-ignore
      window.fbq.push = window.fbq;
      // @ts-ignore
      window.fbq.loaded = true;
      // @ts-ignore
      window.fbq.version = '2.0';
      // @ts-ignore
      window.fbq.queue = [];

      // Load the Facebook Pixel script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);

      // Initialize pixel with ID
      // @ts-ignore
      window.fbq('init', pixelId);
      
      // Track PageView
      // @ts-ignore
      window.fbq('track', 'PageView');
      
      // Track InitiateCheckout
      // @ts-ignore
      window.fbq('track', 'InitiateCheckout');
    };

    initFacebookPixel();

    // Cleanup
    return () => {
      const script = document.querySelector('script[src*="connect.facebook.net"]');
      if (script) {
        script.remove();
      }
      // @ts-ignore
      delete window.fbq;
      // @ts-ignore
      delete window._fbq;
    };
  }, [pixelId, enabled]);

  const trackPurchase = ({ value, currency }: TrackPurchaseParams) => {
    if (!pixelId || !enabled) return;

    // @ts-ignore
    if (window.fbq) {
      // @ts-ignore
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
      });
    }
  };

  return { trackPurchase };
};
