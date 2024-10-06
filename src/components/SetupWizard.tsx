import React, { useState } from 'react';
import { setupSalesforceOAuth, setupOpenAIAPI } from '../utils/auth';
import { Settings } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [salesforceConnected, setSalesforceConnected] = useState(false);
  const [openAIConnected, setOpenAIConnected] = useState(false);

  const handleSalesforceSetup = async () => {
    try {
      await setupSalesforceOAuth();
      setSalesforceConnected(true);
      setStep(2);
    } catch (error) {
      console.error('Salesforce setup failed:', error);
    }
  };

  const handleOpenAISetup = async () => {
    try {
      await setupOpenAIAPI();
      setOpenAIConnected(true);
      onComplete();
    } catch (error) {
      console.error('OpenAI setup failed:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Settings className="mr-2" />
        Setup Wizard
      </h2>
      {step === 1 && (
        <div>
          <p className="mb-4">Step 1: Connect to Salesforce</p>
          <button
            onClick={handleSalesforceSetup}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
          >
            Connect Salesforce
          </button>
        </div>
      )}
      {step === 2 && (
        <div>
          <p className="mb-4">Step 2: Set up OpenAI API</p>
          <button
            onClick={handleOpenAISetup}
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors"
          >
            Connect OpenAI
          </button>
        </div>
      )}
    </div>
  );
};

export default SetupWizard;