import { NextRequest, NextResponse } from 'next/server';

/**
 * RPC Proxy Route
 * Proxies Solana RPC requests to Helius without exposing the API key
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? '';
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export async function POST(request: NextRequest) {
  if (!HELIUS_API_KEY) {
    return NextResponse.json(
      { error: 'RPC not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RPC proxy error:', error);
    return NextResponse.json(
      { error: 'RPC request failed' },
      { status: 500 }
    );
  }
}
