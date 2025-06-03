# Content Management System Integration

This document explains how to use the content management system in your Next.js frontend.

## Environment Configuration

Add the following to your `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api/v1

# For local development
# NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Usage Examples

### 1. Using the MarkdownContent Component

```tsx
import MarkdownContent from '@/components/common/MarkdownContent';

// Terms of Service page
<MarkdownContent 
  contentType="terms"
  title="Terms of Service"
  className="text-gray-800"
/>

// Product description on landing page
<MarkdownContent 
  contentType="product-description"
  className="text-center"
/>
```

### 2. Using the useContent Hook

```tsx
import { useContent } from '@/hooks/useContent';

function MyComponent() {
  const { content, loading, error, refetch } = useContent('privacy');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
```

### 3. Using the ProductDescription Component

```tsx
import ProductDescription from '@/components/common/ProductDescription';

// Full version
<ProductDescription />

// Compact version for sidebars
<ProductDescription variant="compact" showTitle={false} />

// Landing page version
<ProductDescription variant="landing" />
```

### 4. Using the Content Service Directly

```tsx
import { contentService } from '@/services/contentService';

async function fetchTerms() {
  try {
    const terms = await contentService.getTermsOfService();
    console.log(terms);
  } catch (error) {
    console.error('Failed to fetch terms:', error);
  }
}
```

## Available Content Types

- `product-description` - Main product description for landing pages
- `terms` - Terms of Service
- `privacy` - Privacy Policy  
- `cancellation-refund` - Cancellation and Refund Policy
- `support` - Support documentation
- `index` - Content index/overview

## Routes Created

The following routes have been created:

- `/legal` - Legal documents index
- `/legal/terms` - Terms of Service
- `/legal/privacy` - Privacy Policy
- `/legal/cancellation-refund` - Cancellation & Refund Policy
- `/support` - Support page

## Integration with Your Existing Components

You can integrate the content system with your existing components:

### In Your Navigation

```tsx
// Add to your navigation component
<Link href="/legal">Legal</Link>
<Link href="/support">Support</Link>
```

### In Your Footer

```tsx
// Add to your footer component
<div className="flex space-x-4">
  <Link href="/legal/terms">Terms</Link>
  <Link href="/legal/privacy">Privacy</Link>
  <Link href="/support">Support</Link>
</div>
```

### In Your Pricing Page

```tsx
// Add product description to pricing page
import ProductDescription from '@/components/common/ProductDescription';

<ProductDescription variant="compact" className="mb-8" />
```

## Error Handling

All components include proper error handling and loading states. The content service will gracefully handle network errors and display appropriate error messages to users.

## Caching

The content is fetched on each component mount. For better performance, consider implementing caching using React Query or SWR in the future.

## Content Updates

When content is updated through the admin panel, users will see the new content on their next page load. No frontend deployment is required for content updates. 