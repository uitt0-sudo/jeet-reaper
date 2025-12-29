import { NextRequest, NextResponse } from 'next/server';

/**
 * Helius Balances Proxy
 * Fetches token balances without exposing the API key
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? '';

export async function GET(request: NextRequest) {
  if (!HELIUS_API_KEY) {
    return NextResponse.json(
      { error: 'Helius API not configured' },
      { status: 500 }
    );
  }

  const walletAddress = request.nextUrl.searchParams.get('wallet');
  
  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Helius API error:', text);
      return NextResponse.json(
        { error: 'Failed to fetch balances' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Helius balances error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}
