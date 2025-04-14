import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get API key from environment variable
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Fetch models from OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Check if the response is successful
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error fetching models from OpenRouter API' },
        { status: response.status }
      );
    }

    // Return the models data
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}