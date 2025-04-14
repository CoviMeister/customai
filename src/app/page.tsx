'use client';

import { useState, useEffect } from 'react';
import supabase from '../lib/supabaseClient';

export default function Home() {
  // State for form inputs
  const [systemInstruction, setSystemInstruction] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string}>>([]);
  const [sessions, setSessions] = useState<Array<{id: string, created_at: string, system?: string, model?: string}>>([]); // Added optional fields for display
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null); // State for active session

  // Fetch sessions list from Supabase on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoadingSessions(true);
      // Assuming sessions are not user-specific for now. Add .eq('user_id', userId) if needed.
      const { data, error } = await supabase
        .from('sessions')
        .select('id, created_at, system, model') // Fetch relevant fields
        .order('created_at', { ascending: false }); // Show newest first

      if (error) {
        console.error('Error fetching sessions:', error);
        // Handle error appropriately, maybe show a message
      } else if (data) {
        setSessions(data);
        // Optionally, select the most recent session automatically
        // if (data.length > 0) {
        //   setActiveSessionId(data[0].id);
        // }
      }
      setIsLoadingSessions(false);
    };

    fetchSessions();
  }, []);

  // Load messages when activeSessionId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeSessionId) {
        setConversationHistory([]); // Clear history if no session selected
        // Reset settings based on the selected session? Or keep current?
        // setSystemInstruction(''); // Example: Reset settings
        // setSelectedModel('gpt-4'); // Example: Reset settings
        return;
      }

      // Fetch messages for the active session
      const { data, error } = await supabase
        .from('message')
        .select('role, content')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`Error loading messages for session ${activeSessionId}:`, error);
        setConversationHistory([]); // Clear history on error
      } else if (data) {
        setConversationHistory(data);
        // Optionally load session settings (system prompt, model)
        const activeSession = sessions.find(s => s.id === activeSessionId);
        if (activeSession) {
           setSystemInstruction(activeSession.system || '');
           setSelectedModel(activeSession.model || 'gpt-4'); // Default if model not saved
        }
      }
    };

    loadMessages();
  }, [activeSessionId, sessions]); // Rerun when activeSessionId changes or sessions list updates

  // Fetch available models from our API endpoint
  useEffect(() => {
    const fetchModels = async () => {
      
      try {
        // Use our server-side API endpoint instead of directly calling OpenRouter
        const response = await fetch('/api/models');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.status}`);
        }
        
        const data = await response.json();
        const models = data.data.map((model: { id: string; name: string }) => ({
          id: model.id,
          name: model.name
        }));
        
        setAvailableModels(models);
      } catch (error) {
        console.error('Error fetching models:', error);
        console.error('Failed to load available models'); // Log error instead of setting state
        // Set some default models as fallback
        setAvailableModels([
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
          { id: 'claude-3', name: 'Claude 3' },
          { id: 'llama-3', name: 'Llama 3' }
        ]);
      } finally {
      }
    };
    
    fetchModels();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add user message to conversation history
    const newUserMessage = { role: 'user', content: userPrompt };
    setConversationHistory(prev => [...prev, newUserMessage]);
    
    try {
      // Set loading state if needed
      // Indicate loading state, e.g., by updating a different state variable or UI element
      console.log('Generating response...'); // Placeholder for loading indication
      
      // Create a new session in Supabase if no session is active
    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      // No active session, create a new one
      console.log('No active session, creating a new one...');
      // const { data: { user } } = await supabase.auth.getUser(); // Uncomment if using user auth
      const { data: newSessionData, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            model: selectedModel,
            temperature: temperature,
            system: systemInstruction,
            created_at: new Date().toISOString(),
            // user_id: user?.id // Uncomment if using user auth
          },
        ])
        .select('id') // Select only the ID after insert
        .single(); // Expecting a single row back

      if (insertError) {
        console.error('Error creating session:', insertError);
        throw new Error(`Failed to create session: ${insertError.message}`);
      } else if (!newSessionData) {
        throw new Error('No data returned from session creation');
      }

      currentSessionId = newSessionData.id;
      setActiveSessionId(currentSessionId); // Set the new session as active
      console.log('Created and activated new session with ID:', currentSessionId);
      
      // Add the new session to the beginning of the list locally for immediate UI update
      setSessions(prev => [{ id: currentSessionId!, created_at: new Date().toISOString(), system: systemInstruction, model: selectedModel }, ...prev]);

    } else {
       console.log('Using existing active session:', currentSessionId);
    }
      
      // Save user message to Supabase using the determined session ID
      if (!currentSessionId) {
         throw new Error("Session ID is still null after attempting creation.");
      }
      
      const { error: userMessageError } = await supabase
        .from('message')
        .insert([
          {
            session_id: currentSessionId,
            role: 'user',
            content: userPrompt,
            created_at: new Date().toISOString(),
          },
        ]);

      if (userMessageError) {
         console.error('Error saving user message:', userMessageError);
         // Decide how to handle this - maybe show an error but continue?
      }
      
      // Fetch previous messages for the *current* conversation history state
      // We already loaded messages for the active session, so use the state
      // Note: This assumes conversationHistory state is up-to-date before this fetch call
      // Alternatively, refetch *all* messages for currentSessionId here if needed, but using state is more efficient
      const previousMessages: Array<{ role: string; content: string }> = [...conversationHistory];
      // The new user message was already added to state at the start of handleSubmit
      
      // Build messages array: system instruction + current conversation history (includes new user prompt)
      const messages = [
        { role: 'system', content: systemInstruction },
        ...previousMessages, // conversationHistory already includes the latest user prompt
      ];
      
      // Call our API route
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages, // Send the full conversation history
          model: selectedModel,
          temperature: temperature
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData?.error || `API request failed (${response.status})`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'No response generated';
      
      // Add AI response to conversation history
      const newAiMessage = { role: 'assistant', content: aiResponse };
      setConversationHistory(prev => [...prev, newAiMessage]);
      // The AI response is added to conversationHistory state (line 254), which should update the UI
      
      // Save assistant message to Supabase
       if (!currentSessionId) {
         console.error("Error saving assistant message: Session ID became null unexpectedly.");
         // Handle error appropriately
       } else {
         const { error: assistantMessageError } = await supabase
           .from('message')
           .insert([
             {
               session_id: currentSessionId,
               role: 'assistant',
               content: aiResponse,
               created_at: new Date().toISOString(),
             },
           ]);
          if (assistantMessageError) {
             console.error('Error saving assistant message:', assistantMessageError);
             // Handle error
          }
       }
    } catch (error) {
      console.error('Error generating response:', error);
      // Display error in the chat or via a notification
      const errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
      setConversationHistory(prev => [...prev, { role: 'system', content: errorMessage }]); // Add error to chat
      // Log session state for debugging
      console.log('Current session state:', { activeSessionId });
    } finally {
      setUserPrompt(''); // Clear the input after sending
    }
   };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Sessions</h2>
        <button
          onClick={() => setActiveSessionId(null)} // Clear active session to start a new chat
          className="w-full mb-4 px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white" // Added text-white
        >
          + New Chat
        </button>

        {/* Session List */}
        <div className="mb-6 border-t border-gray-700 pt-4">
          <h3 className="text-lg font-semibold mb-2">History</h3>
          {isLoadingSessions ? (
            <p className="text-gray-400">Loading sessions...</p> // Added text style
          ) : sessions.length === 0 ? (
            <p className="text-gray-400">No past sessions found.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2"> {/* Added scroll & padding */}
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left px-3 py-2 rounded ${
                      activeSessionId === session.id
                        ? 'bg-blue-600 text-white' // Highlight active session
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200' // Style for inactive
                    }`}
                  >
                    <span className="block text-sm font-medium truncate"> {/* Style update */}
                      {/* Display some info about the session, e.g., date */}
                      {new Date(session.created_at).toLocaleString()}
                    </span>
                     {/* Optionally display model/system prompt */}
                     {session.model && <span className="block text-xs text-gray-400 truncate">Model: {session.model}</span>}
                     {session.system && <span className="block text-xs text-gray-400 truncate">System: {session.system}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <h2 className="text-xl font-bold mb-4 border-t border-gray-700 pt-4">Chat Settings</h2>
<label className="block mb-4">
  Model:
  <select 
    value={selectedModel}
    onChange={(e) => setSelectedModel(e.target.value)}
    className="w-full p-2 bg-gray-700 rounded mt-1"
  >
    {availableModels.map((model) => (
      <option key={model.id} value={model.id}>
        {model.name}
      </option>
    ))}
  </select>
</label>

<label className="block mb-4">
  Temperature:
  <input
    type="range"
    min="0"
    max="1"
    step="0.1"
    value={temperature}
    onChange={(e) => setTemperature(parseFloat(e.target.value))}
    className="w-full mt-1"
  />
  <span className="block text-sm">{temperature}</span>
</label>

<label className="block mb-4">
  System Instructions:
  <textarea
    value={systemInstruction}
    onChange={(e) => setSystemInstruction(e.target.value)}
    className="w-full p-2 bg-gray-700 rounded mt-1 h-32"
    placeholder="Enter system instructions..."
  />
</label>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="flex flex-col h-full">
  <div className="flex-1 mb-4 overflow-y-auto space-y-4">
    {conversationHistory.map((msg, index) => (
      <div 
        key={index}
        className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-gray-800 ml-4' : 'bg-gray-700 mr-4'}`}
      >
        <strong>{msg.role}:</strong>
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    ))}
  </div>

  <form onSubmit={handleSubmit} className="flex gap-2">
    <textarea
      value={userPrompt}
      onChange={(e) => setUserPrompt(e.target.value)}
      className="flex-1 p-2 bg-gray-700 rounded"
      placeholder="Type your message..."
      rows={2}
    />
    <button
      type="submit"
      className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
      disabled={!userPrompt}
    >
      Send
    </button>
  </form>
</div>
      </div>
    </div>
  );
}
