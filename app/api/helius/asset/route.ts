import { NextRequest, NextResponse } from 'next/server';

/**
 * Helius Asset Metadata Proxy
 * Fetches token metadata without exposing the API key
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? '';

export async function GET(request: NextRequest) {
  if (!HELIUS_API_KEY) {
    return NextResponse.json(
      { error: 'Helius API not configured' },
      { status: 500 }
    );
  }

  const tokenMint = request.nextUrl.searchParams.get('mint');
  
  if (!tokenMint) {
    return NextResponse.json(
      { error: 'Token mint required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAsset',
        params: {
          id: tokenMint,
          displayOptions: {
            showCollectionMetadata: true,
            showUnverifiedCollections: false,
            showNativeBalance: false,
            showInscription: false,
          }
        }
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Helius API error:', text);
      return NextResponse.json(
        { error: 'Failed to fetch asset metadata' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Helius asset error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset metadata' },
      { status: 500 }
    );
  }
}
