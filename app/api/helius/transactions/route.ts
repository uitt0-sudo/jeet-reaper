import { NextRequest, NextResponse } from 'next/server';

/**
 * Helius Transactions Proxy
 * Fetches transaction history without exposing the API key
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
  const before = request.nextUrl.searchParams.get('before');
  const limit = request.nextUrl.searchParams.get('limit') ?? '100';
  
  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 }
    );
  }

  try {
    const url = new URL(`https://api.helius.xyz/v0/addresses/${walletAddress}/transactions`);
    url.searchParams.set('api-key', HELIUS_API_KEY);
    url.searchParams.set('limit', limit);
    if (before) {
      url.searchParams.set('before', before);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Helius API error:', text);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Helius transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
