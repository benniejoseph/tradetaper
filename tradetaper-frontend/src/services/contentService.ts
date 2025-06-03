import { apiClient } from './api';

export interface ContentDocument {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface ProductDescription {
  features: string[];
  plans: PricingPlan[];
  technicalSpecs: string[];
}

export interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}

class ContentService {
  private readonly baseURL = '/content';

  // Get product description as markdown
  async getProductDescription(): Promise<string> {
    try {
      const response = await apiClient.get(`${this.baseURL}/product-description`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product description:', error);
      throw new Error('Failed to load product description');
    }
  }

  // Get Terms of Service
  async getTermsOfService(): Promise<string> {
    try {
      const response = await apiClient.get(`${this.baseURL}/legal/terms`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch terms of service:', error);
      throw new Error('Failed to load terms of service');
    }
  }

  // Get Privacy Policy
  async getPrivacyPolicy(): Promise<string> {
    try {
      const response = await apiClient.get(`${this.baseURL}/legal/privacy`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch privacy policy:', error);
      throw new Error('Failed to load privacy policy');
    }
  }

  // Get Cancellation & Refund Policy
  async getCancellationRefundPolicy(): Promise<string> {
    try {
      const response = await apiClient.get(`${this.baseURL}/legal/cancellation-refund`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cancellation refund policy:', error);
      throw new Error('Failed to load cancellation refund policy');
    }
  }

  // Get Support Guide
  async getSupportGuide(): Promise<string> {
    try {
      const response = await apiClient.get(`${this.baseURL}/support`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch support guide:', error);
      throw new Error('Failed to load support guide');
    }
  }

  // Get specific legal document
  async getLegalDocument(documentType: 'terms' | 'privacy' | 'cancellation-refund'): Promise<string> {
    try {
      const response = await apiClient.get(`${this.baseURL}/legal/${documentType}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch legal document ${documentType}:`, error);
      throw new Error(`Failed to load ${documentType}`);
    }
  }

  // Get content index
  async getContentIndex(): Promise<string> {
    try {
      const response = await apiClient.get(`${this.baseURL}/index`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch content index:', error);
      throw new Error('Failed to load content index');
    }
  }
}

export const contentService = new ContentService(); 