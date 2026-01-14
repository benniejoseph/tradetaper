
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyAl7EUlHvOVAVeeOoIqChfkiVxriMgTgYc';




async function testGemini() {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of models) {
    console.log(`\nTesting model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hi');
      const response = await result.response;
      console.log(`Success with ${modelName}!`);
      return; 
    } catch (error: any) {
      console.error(`Failed ${modelName}:`, error.message);
    }
  }
}

testGemini();
