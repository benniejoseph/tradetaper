# TradeTaper Content API Summary

## 📋 **Available Content Endpoints**

All content is served as Markdown via the following API endpoints:

### Product Information
- **Product Description**: `GET /api/v1/content/product-description`
  - Comprehensive overview of TradeTaper features and pricing
  - Use for: Landing pages, marketing materials, onboarding

### Legal Documents
- **Terms of Service**: `GET /api/v1/content/legal/terms`
- **Privacy Policy**: `GET /api/v1/content/legal/privacy`  
- **Cancellation & Refund Policy**: `GET /api/v1/content/legal/cancellation-refund`

### Support & Help
- **Support Guide**: `GET /api/v1/content/support`
  - Complete support documentation with contact information
  - Troubleshooting guides and FAQ

### Content Index
- **Content Index**: `GET /api/v1/content/index`
  - Overview of all available content with descriptions

## 🌐 **Live API Endpoints**

Base URL: `https://tradetaper-backend-production.up.railway.app`

```bash
# Product Description
curl https://tradetaper-backend-production.up.railway.app/api/v1/content/product-description

# Terms of Service
curl https://tradetaper-backend-production.up.railway.app/api/v1/content/legal/terms

# Privacy Policy
curl https://tradetaper-backend-production.up.railway.app/api/v1/content/legal/privacy

# Cancellation & Refund Policy
curl https://tradetaper-backend-production.up.railway.app/api/v1/content/legal/cancellation-refund

# Support Guide
curl https://tradetaper-backend-production.up.railway.app/api/v1/content/support

# Content Index
curl https://tradetaper-backend-production.up.railway.app/api/v1/content/index
```

## ⚛️ **Frontend Integration Examples**

### React Component for Legal Pages

```javascript
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const LegalPage = ({ documentType }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://tradetaper-backend-production.up.railway.app/api/v1/content/legal/${documentType}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        
        const markdown = await response.text();
        setContent(markdown);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [documentType]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="legal-content">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

// Usage
export const TermsOfService = () => <LegalPage documentType="terms" />;
export const PrivacyPolicy = () => <LegalPage documentType="privacy" />;
export const RefundPolicy = () => <LegalPage documentType="cancellation-refund" />;
```

### Next.js Static Generation

```javascript
// pages/legal/[document].js
import ReactMarkdown from 'react-markdown';

export default function LegalDocument({ content, documentType }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ReactMarkdown className="prose max-w-none">
        {content}
      </ReactMarkdown>
    </div>
  );
}

export async function getStaticPaths() {
  return {
    paths: [
      { params: { document: 'terms' } },
      { params: { document: 'privacy' } },
      { params: { document: 'cancellation-refund' } }
    ],
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const response = await fetch(
    `https://tradetaper-backend-production.up.railway.app/api/v1/content/legal/${params.document}`
  );
  const content = await response.text();

  return {
    props: {
      content,
      documentType: params.document
    },
    revalidate: 3600 // Regenerate every hour
  };
}
```

### Vue.js Component

```javascript
<template>
  <div class="content-page">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else v-html="renderedContent"></div>
  </div>
</template>

<script>
import { marked } from 'marked';

export default {
  name: 'ContentPage',
  props: {
    contentType: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      content: '',
      loading: true,
      error: null
    };
  },
  computed: {
    renderedContent() {
      return marked(this.content);
    }
  },
  async mounted() {
    try {
      const response = await fetch(
        `https://tradetaper-backend-production.up.railway.app/api/v1/content/${this.contentType}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      this.content = await response.text();
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }
};
</script>
```

## 📄 **Content Structure**

### Subscription Plans Referenced

All documents reference these standardized pricing tiers:

| Plan | Monthly | Yearly | Features |
|------|---------|--------|----------|
| **Starter** | $9.99 | $99.99 | 100 trades/month, 3 accounts, basic analytics |
| **Professional** | $29.99 | $299.99 | Unlimited trades/accounts, advanced analytics, market data |
| **Enterprise** | $99.99 | $999.99 | Everything + white-label, API access, dedicated support |

### Contact Information in Documents

- **General Support**: support@tradetaper.com
- **Technical Issues**: tech@tradetaper.com
- **Billing Questions**: billing@tradetaper.com
- **Privacy Inquiries**: privacy@tradetaper.com
- **Legal Matters**: legal@tradetaper.com

## 🔧 **Implementation Notes**

### Response Headers
- **Content-Type**: `text/markdown; charset=utf-8`
- **Cache-Control**: `public, max-age=3600` (1 hour cache)

### Security
- Path traversal protection implemented
- Files must be within `/content` directory
- Only allowed document types served

### Error Handling
- **404**: Document not found
- **400**: Invalid file path
- **500**: Server error reading content

## 📱 **Mobile Considerations**

The content is optimized for:
- **Responsive Design**: Works on all screen sizes
- **Touch Navigation**: Mobile-friendly interface
- **Fast Loading**: Cached content for quick access
- **Offline Capability**: Can be cached for offline reading

## 🔄 **Content Updates**

- Documents are version controlled in Git
- Updates require backend redeployment
- Quarterly review schedule for all legal documents
- User notification for material changes

---

**Ready to integrate?** Use these endpoints to display comprehensive legal and support content in your TradeTaper frontend! 