import axios from 'axios';
import OpenAI from 'openai';
import { getFromStorage } from './auth';

let openai: OpenAI;

const initializeAPIs = async () => {
  const { openAIKey } = await getFromStorage(['openAIKey']);
  
  if (!openai && openAIKey) {
    openai = new OpenAI({ apiKey: openAIKey });
  }
};

const querySalesforce = async (query: string): Promise<any> => {
  const { salesforceToken, salesforceInstanceUrl } = await getFromStorage(['salesforceToken', 'salesforceInstanceUrl']);
  
  if (!salesforceToken || !salesforceInstanceUrl) {
    throw new Error('Salesforce credentials not found. Please reconnect to Salesforce.');
  }

  try {
    const response = await axios.get(`${salesforceInstanceUrl}/services/data/v55.0/query?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${salesforceToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error querying Salesforce:', error);
    throw error;
  }
};

export const processUserInput = async (input: string): Promise<string> => {
  await initializeAPIs();

  if (!openai) {
    throw new Error('OpenAI API not initialized. Please check your configuration.');
  }

  try {
    // Process the user input with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that can interact with Salesforce data." },
        { role: "user", content: input }
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    // Query Salesforce for sample data
    const result = await querySalesforce('SELECT Id, Name FROM Account LIMIT 5');

    // Combine AI response with Salesforce data
    return `${aiResponse}\n\nHere are some sample Salesforce accounts:\n${result.records.map((record: any) => record.Name).join(', ')}`;

  } catch (error) {
    console.error('Error processing user input:', error);
    throw error;
  }
};