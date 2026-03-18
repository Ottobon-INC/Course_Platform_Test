export const trackEvent = (
    event_name: string,
    properties?: Record<string, any>
) => {
    // In a real implementation, this would send data to GA4, Mixpanel, or PostHog.
    // For now, we log to console in development and cleaner window.dataLayer in production.

    const timestamp = new Date().toISOString();
    const eventData = {
        event: event_name,
        timestamp,
        url: window.location.pathname,
        ...properties,
    };

    if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${event_name}`, properties);
    }

    // Example: Push to GTM dataLayer if available
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push(eventData);
    }
};
