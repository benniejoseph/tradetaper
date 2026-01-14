
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyAl7EUlHvOVAVeeOoIqChfkiVxriMgTgYc';

// Note: The SDK doesn't expose listModels directly on the main class in some versions,
// but let's try to infer or use the ModelService if accessible, or just try to instantiate and catch errors.
// Wait, the SDK definitely should support browsing?
// Actually, `GoogleGenerativeAI` is a high level wrapper.
// To list models, we might need to hit the REST API directly if the SDK doesn't expose it easily in this version.

// Direct REST call to be sure.
async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Available Models:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
