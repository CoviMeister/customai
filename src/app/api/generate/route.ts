import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { messages, model, temperature } = body; // Expect 'messages' array

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required field: messages (must be a non-empty array)' },
        { status: 400 }
      );
    }
    // Basic validation for message structure (can be enhanced)
    if (!messages.every(msg => msg && typeof msg.role === 'string' && typeof msg.content === 'string')) {
       return NextResponse.json(
        { error: 'Invalid message structure in messages array' },
        { status: 400 }
      );
    }
    if (!model) {
      return NextResponse.json(
        { error: 'Missing required field: model' },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Prepare the request to OpenRouter API
    const openRouterRequest = {
      model,
      messages: messages, // Pass the received messages array directly
      temperature: temperature || 0.7, // Default temperature if not provided
    };

    // Send request to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openRouterRequest),
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: 'Error from OpenRouter API', details: errorData },
        { status: response.status }
      );
    }

    // Return the response from OpenRouter
    const data = await response.json();
    
    // Validate response structure
    if (!data?.choices?.[0]?.message?.content) {
      console.error('Invalid response structure:', data);
      return NextResponse.json(
        { error: 'Invalid API response structure' },
        { status: 502 }
      );
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}