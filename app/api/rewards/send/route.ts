import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Secure Reward Send API
 * Handles SOL transfers server-side with private key never exposed to client
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? '';
const REWARD_WALLET_SECRET = process.env.REWARD_WALLET_SECRET_KEY ?? '';

function getConnection(): Connection {
  if (!HELIUS_API_KEY) {
    throw new Error('RPC not configured');
  }
  return new Connection(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, 'confirmed');
}

function getSigner(): Keypair {
  if (!REWARD_WALLET_SECRET) {
    throw new Error('Reward wallet not configured');
  }
  
  const trimmed = REWARD_WALLET_SECRET.trim();
  let secretKey: Uint8Array;
  
  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as number[];
    secretKey = Uint8Array.from(parsed);
  } else if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(v => Number(v.trim())).filter(v => Number.isFinite(v));
    secretKey = Uint8Array.from(parts);
  } else {
    secretKey = Uint8Array.from(bs58.decode(trimmed));
  }
  
  if (secretKey.length !== 64) {
    throw new Error('Invalid secret key length');
  }
  
  return Keypair.fromSecretKey(secretKey);
}

export async function POST(request: NextRequest) {
  try {
    const { recipient, lamports } = await request.json();
    
    if (!recipient || typeof recipient !== 'string') {
      return NextResponse.json({ error: 'Recipient required' }, { status: 400 });
    }
    
    if (!lamports || typeof lamports !== 'number' || lamports <= 0) {
      return NextResponse.json({ error: 'Valid lamports amount required' }, { status: 400 });
    }
    
    const connection = getConnection();
    const signer = getSigner();
    
    let receiverPubkey: PublicKey;
    try {
      receiverPubkey = new PublicKey(recipient);
    } catch {
      return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 });
    }
    
    if (receiverPubkey.equals(signer.publicKey)) {
      return NextResponse.json({ error: 'Cannot send to self' }, { status: 400 });
    }
    
    const balance = await connection.getBalance(signer.publicKey, 'confirmed');
    console.log(`Reward wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < lamports + 5000) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: receiverPubkey,
        lamports,
      })
    );
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [signer], {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    
    console.log('✅ Reward sent:', signature);
    
    return NextResponse.json({
      signature,
      lamports,
      sol: lamports / LAMPORTS_PER_SOL,
    });
  } catch (error) {
    console.error('Reward send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reward' },
      { status: 500 }
    );
  }
}
