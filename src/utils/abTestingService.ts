
// Simple A/B testing service to randomly select between variants
export type Variant = 'A' | 'B';

// Get or create user variant
export function getUserVariant(): Variant {
  // Try to get existing variant from localStorage
  const storedVariant = localStorage.getItem('landing_page_variant') as Variant;
  
  if (storedVariant === 'A' || storedVariant === 'B') {
    return storedVariant;
  }
  
  // Randomly assign a variant with 50/50 split
  const newVariant: Variant = Math.random() < 0.5 ? 'A' : 'B';
  
  // Store the variant for the user
  localStorage.setItem('landing_page_variant', newVariant);
  
  return newVariant;
}

// Track conversion for the current variant
export function trackConversion(event: string): void {
  const variant = getUserVariant();
  
  // In a real implementation, you would send this to your analytics service
  console.log(`[A/B Testing] Event: ${event}, Variant: ${variant}`);
  
  // You could use something like:
  // analyticsService.track('landing_page_conversion', { variant, event });
}

// Track page view for the current variant
export function trackPageView(): void {
  const variant = getUserVariant();
  
  // In a real implementation, you would send this to your analytics service
  console.log(`[A/B Testing] Page View, Variant: ${variant}`);
  
  // You could use something like:
  // analyticsService.track('landing_page_view', { variant });
}

// Reset the user's variant (useful for testing)
export function resetUserVariant(): void {
  localStorage.removeItem('landing_page_variant');
}
