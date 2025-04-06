'use client';

import { useState } from 'react';

export default function Home() {
  // State for form inputs
  const [systemInstruction, setSystemInstruction] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [response, setResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          if (content.systemInstruction) {
            setSystemInstruction(content.systemInstruction);
          }
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add user message to conversation history
    const newUserMessage = { role: 'user', content: userPrompt };
    
    // Simulate AI response (in a real app, this would call an API)
    const simulatedResponse = { role: 'assistant', content: `This is a simulated response to: "${userPrompt}"` };
    
    setConversationHistory(prev => [...prev, newUserMessage, simulatedResponse]);
    setResponse(simulatedResponse.content);
    setUserPrompt(''); // Clear the input after sending
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Custom AI Interface</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* System Instruction */}
          <div className="space-y-2">
            <label htmlFor="systemInstruction" className="block font-medium">System Instruction</label>
            <textarea
              id="systemInstruction"
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Upload JSON Button */}
          <div>
            <label htmlFor="uploadJson" className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md cursor-pointer transition-colors">
              Upload JSON
              <input
                type="file"
                id="uploadJson"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          
          {/* User Prompt */}
          <div className="space-y-2">
            <label htmlFor="userPrompt" className="block font-medium">User Prompt</label>
            <textarea
              id="userPrompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Model Selection */}
          <div className="space-y-2">
            <label htmlFor="model" className="block font-medium">Model</label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3">Claude 3</option>
              <option value="llama-3">Llama 3</option>
            </select>
          </div>
          
          {/* API Key */}
          <div className="space-y-2">
            <label htmlFor="apiKey" className="block font-medium">API Key</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Temperature */}
          <div className="space-y-2">
            <label htmlFor="temperature" className="block font-medium">Temperature: {temperature}</label>
            <input
              type="range"
              id="temperature"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          
          {/* Max Tokens */}
          <div className="space-y-2">
            <label htmlFor="maxTokens" className="block font-medium">Max Tokens</label>
            <input
              type="number"
              id="maxTokens"
              min="1"
              max="8000"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Generate Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Generate
          </button>
        </form>
        
        {/* Response Display */}
        {response && (
          <div className="mt-8 space-y-2">
            <h2 className="text-xl font-medium">Response</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-md p-4 whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
        
        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="mt-8 space-y-2">
            <h2 className="text-xl font-medium">Conversation History</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-md p-4 max-h-[400px] overflow-y-auto">
              {conversationHistory.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-blue-300' : 'text-green-300'}`}>
                  <div className="font-bold">{message.role === 'user' ? 'You' : 'AI'}:</div>
                  <div className="ml-4">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
