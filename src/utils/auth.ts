import axios from 'axios';

// Helper function to check if we're in a Chrome extension environment
const isChromeExtension = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// Helper function to get data from storage
export const getFromStorage = async (keys: string[]): Promise<{ [key: string]: any }> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result);
      });
    });
  } else {
    const result: { [key: string]: any } = {};
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        result[key] = JSON.parse(value);
      }
    });
    return result;
  }
};

// Helper function to set data in storage
export const setInStorage = async (data: { [key: string]: any }): Promise<void> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  } else {
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }
};

export const setupSalesforceOAuth = async (): Promise<void> => {
  if (isChromeExtension()) {
    // For Chrome extension, we'll use chrome.identity API
    chrome.identity.launchWebAuthFlow(
      {
        url: 'https://login.salesforce.com/services/oauth2/authorize?response_type=token&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI',
        interactive: true
      },
      (redirectUrl) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          throw new Error('Failed to authenticate with Salesforce');
        }
        
        // Parse the access token and instance URL from the redirect URL
        const url = new URL(redirectUrl!);
        const params = new URLSearchParams(url.hash.slice(1));
        const accessToken = params.get('access_token');
        const instanceUrl = params.get('instance_url');
        
        if (accessToken && instanceUrl) {
          setInStorage({
            salesforceToken: accessToken,
            salesforceInstanceUrl: instanceUrl
          });
        } else {
          throw new Error('Failed to obtain Salesforce credentials');
        }
      }
    );
  } else {
    // For non-extension environment, we'll use a mock setup
    console.warn('Salesforce OAuth setup is not available in non-extension environment');
    await setInStorage({
      salesforceToken: 'mock_salesforce_token',
      salesforceInstanceUrl: 'https://mock.salesforce.com'
    });
  }
};

export const setupOpenAIAPI = async (): Promise<void> => {
  const result = await getFromStorage(['openAIKey']);
  if (result.openAIKey) {
    return;
  } else {
    if (isChromeExtension()) {
      const apiKey = prompt('Please enter your OpenAI API key:');
      if (apiKey) {
        await setInStorage({ openAIKey: apiKey });
      } else {
        throw new Error('OpenAI API key is required');
      }
    } else {
      console.warn('OpenAI API setup is not available in non-extension environment');
      // For development purposes, you might want to set some mock data
      await setInStorage({ openAIKey: 'mock_openai_key' });
    }
  }
};

export const checkAuthentication = async (): Promise<boolean> => {
  const { salesforceToken, openAIKey } = await getFromStorage(['salesforceToken', 'openAIKey']);
  return !!(salesforceToken && openAIKey);
};