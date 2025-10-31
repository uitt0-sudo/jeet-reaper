import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import axios from 'axios';
import bs58 from 'bs58';
import { supabase } from '../config/supabase';
import { CASHBACK_PERCENTAGE, MINIMUM_HOLDING, RANDOM_REWARD_RANGE } from '../config/rewards';

interface TokenBalanceAmount {
    amount?: string;
    decimals?: number;
}

interface TokenBalanceEntry {
    mint?: string;
    tokenAddress?: string;
    uiAmount?: number;
    amount?: number | string;
    decimals?: number;
    tokenAmount?: TokenBalanceAmount;
    uiTokenAmount?: {
        uiAmount?: number;
        amount?: string;
        decimals?: number;
    };
}

type TokenBalanceResponse = TokenBalanceEntry[] | { tokens?: TokenBalanceEntry[] };

type RewardDistributionStatus = 'awarded' | 'already_claimed' | 'not_eligible' | 'no_wallet' | 'failed';

export interface RewardDistributionResult {
    type: 'cashback' | 'random';
    walletAddress: string | null;
    amount: number | null;
    status: RewardDistributionStatus;
    message: string;
    signature?: string | null;
}

interface WalletHolder {
    wallet_address: string;
    holdings: number;
    total_rewards: number;
    total_cashback: number;
    random_reward_claimed: boolean;
    cashback_claimed: boolean;
    last_reward_at: string | null;
    last_cashback_at: string | null;
    last_scan: string | null;
}

export class RewardsService {
    private connection: Connection;
    private heliusApiKey: string;
    private tokenMint: string;  // Your token's mint address
    private rewardSigner: Keypair | null;
    private rewardPublicKey: PublicKey | null;
    
    constructor(connection: Connection, heliusApiKey: string, tokenMint: string) {
        this.connection = connection;
        this.heliusApiKey = heliusApiKey;
        this.tokenMint = tokenMint;
        const { signer, publicKey } = this.loadRewardSigner();
        this.rewardSigner = signer;
        this.rewardPublicKey = publicKey;
    }

    private static parseSecretKey(secret: string): Uint8Array {
        const trimmed = secret.trim();
        if (!trimmed) {
            throw new Error('Reward wallet secret key is empty');
        }

        if (trimmed.startsWith('[')) {
            const parsed = JSON.parse(trimmed) as number[];
            return Uint8Array.from(parsed);
        }

        if (trimmed.includes(',')) {
            const parts = trimmed
                .split(',')
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isFinite(value));
            return Uint8Array.from(parts);
        }

        try {
            return Uint8Array.from(bs58.decode(trimmed));
        } catch (error) {
            throw new Error('Failed to decode reward wallet secret key - ensure it is Base58 or JSON encoded');
        }
    }

    private loadRewardSigner(): { signer: Keypair | null; publicKey: PublicKey | null } {
        const secret =
            process.env.REWARD_WALLET_SECRET_KEY ??
            process.env.REWARD_WALLET_PRIVATE_KEY ??
            '';

        if (!secret || !secret.trim()) {
            if (process.env.REWARD_WALLET_ADDRESS) {
                return {
                    signer: null,
                    publicKey: new PublicKey(process.env.REWARD_WALLET_ADDRESS),
                };
            }
            console.warn('Reward wallet secret key not configured; reward payouts are disabled.');
            return { signer: null, publicKey: null };
        }

        const secretKey = RewardsService.parseSecretKey(secret);
        if (secretKey.length !== 64) {
            throw new Error('Reward wallet secret key must decode to 64 bytes');
        }

        const signer = Keypair.fromSecretKey(secretKey);
        const configuredAddress = process.env.REWARD_WALLET_ADDRESS;
        if (configuredAddress) {
            try {
                const configuredPubkey = new PublicKey(configuredAddress);
                if (!configuredPubkey.equals(signer.publicKey)) {
                    console.warn('Configured reward wallet address does not match secret key. Using signer public key.');
                }
            } catch (error) {
                console.warn('Failed to parse REWARD_WALLET_ADDRESS, using signer public key.');
            }
        }

        return {
            signer,
            publicKey: signer.publicKey,
        };
    }

    private extractTokenBalance(entry?: TokenBalanceEntry | null): number {
        if (!entry) return 0;

        if (typeof entry.uiAmount === 'number') {
            return entry.uiAmount;
        }

        const uiTokenAmount = entry.uiTokenAmount;
        if (uiTokenAmount && typeof uiTokenAmount.uiAmount === 'number') {
            return uiTokenAmount.uiAmount;
        }

        const decimals =
            typeof entry.decimals === 'number'
                ? entry.decimals
                : typeof uiTokenAmount?.decimals === 'number'
                    ? uiTokenAmount.decimals
                    : typeof entry.tokenAmount?.decimals === 'number'
                        ? entry.tokenAmount.decimals
                        : 0;

        let rawAmount: number | null = null;
        if (typeof entry.amount === 'number') {
            rawAmount = entry.amount;
        } else if (typeof entry.amount === 'string') {
            const parsed = Number(entry.amount);
            rawAmount = Number.isFinite(parsed) ? parsed : null;
        } else if (typeof entry.tokenAmount?.amount === 'string') {
            const parsed = Number(entry.tokenAmount.amount);
            rawAmount = Number.isFinite(parsed) ? parsed : null;
        }

        if (rawAmount === null || !Number.isFinite(rawAmount)) {
            return 0;
        }

        return decimals > 0 ? rawAmount / Math.pow(10, decimals) : rawAmount;
    }

    async checkTokenHoldings(walletAddress: string): Promise<number> {
        try {
            const url = `https://api.helius.xyz/v0/token-balances/${walletAddress}?api-key=${this.heliusApiKey}`;
            const response = await axios.get(url);
            const payload = response.data as TokenBalanceResponse;
            const tokens: TokenBalanceEntry[] = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.tokens)
                    ? payload.tokens
                    : [];
            const match = tokens.find((token) =>
                token?.mint === this.tokenMint || token?.tokenAddress === this.tokenMint
            );
            return this.extractTokenBalance(match);
        } catch (error) {
            console.error('Failed to fetch token holdings', error);
            return 0;
        }
    }

    private async getWalletHolder(walletAddress: string): Promise<WalletHolder | null> {
        const { data, error } = await supabase
            .from('wallet_holders')
            .select('*')
            .eq('wallet_address', walletAddress)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Failed to fetch wallet holder', error);
            throw error;
        }

        return (data as WalletHolder) ?? null;
    }

    private async updateWalletHolder(
        walletAddress: string,
        adjustments: {
            holdings?: number;
            rewardDelta?: number;
            cashbackDelta?: number;
            randomRewardClaimed?: boolean;
            cashbackClaimed?: boolean;
            lastRewardAt?: string;
            lastCashbackAt?: string;
            lastScan?: string;
        } = {}
    ): Promise<WalletHolder | null> {
        const existing = await this.getWalletHolder(walletAddress);
        const rewardDelta = adjustments.rewardDelta ?? 0;
        const cashbackDelta = adjustments.cashbackDelta ?? 0;
        const nowIso = new Date().toISOString();

        const payload = {
            wallet_address: walletAddress,
            holdings: adjustments.holdings ?? existing?.holdings ?? 0,
            total_rewards: (existing?.total_rewards ?? 0) + rewardDelta,
            total_cashback: (existing?.total_cashback ?? 0) + cashbackDelta,
            random_reward_claimed:
                adjustments.randomRewardClaimed ??
                (rewardDelta > 0 ? true : existing?.random_reward_claimed ?? false),
            cashback_claimed:
                adjustments.cashbackClaimed ??
                (cashbackDelta > 0 ? true : existing?.cashback_claimed ?? false),
            last_reward_at:
                adjustments.lastRewardAt ??
                (rewardDelta > 0 ? nowIso : existing?.last_reward_at ?? null),
            last_cashback_at:
                adjustments.lastCashbackAt ??
                (cashbackDelta > 0 ? nowIso : existing?.last_cashback_at ?? null),
            last_scan: adjustments.lastScan ?? nowIso,
            updated_at: nowIso,
        };

        const { error } = await supabase
            .from('wallet_holders')
            .upsert(payload, { onConflict: 'wallet_address' });

        if (error) {
            console.error('Failed to upsert wallet holder aggregate', error);
            throw error;
        }

        return this.getWalletHolder(walletAddress);
    }

    private async hasClaimedRandomReward(walletAddress: string): Promise<boolean> {
        const holder = await this.getWalletHolder(walletAddress);
        if (holder?.random_reward_claimed) {
            return true;
        }

        const { data, error } = await supabase
            .from('rewards')
            .select('id')
            .eq('wallet_address', walletAddress)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Failed to check random reward status', error);
            throw error;
        }

        return Boolean(data);
    }

    private async hasClaimedCashback(walletAddress: string): Promise<boolean> {
        const holder = await this.getWalletHolder(walletAddress);
        if (holder?.cashback_claimed) {
            return true;
        }

        const { data, error } = await supabase
            .from('cashbacks')
            .select('id')
            .eq('wallet_address', walletAddress)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Failed to check cashback status', error);
            throw error;
        }

        return Boolean(data);
    }

    async updateLeaderboard(walletAddress: string, rewardAmount: number, holdings: number) {
        return this.updateWalletHolder(walletAddress, {
            holdings,
            rewardDelta: rewardAmount,
            randomRewardClaimed: rewardAmount > 0,
        });
    }

    async getRandomWalletFromLeaderboard(): Promise<string | null> {
        const { data, error } = await supabase
            .from('wallet_holders')
            .select('wallet_address')
            .eq('random_reward_claimed', false)
            .gt('holdings', 0)
            .order('last_scan', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Failed to fetch random wallet candidates', error);
            throw error;
        }

        let candidates = data ?? [];

        if (!candidates.length) {
            const fallback = await supabase
                .from('wallet_holders')
                .select('wallet_address')
                .gt('holdings', 0)
                .order('last_scan', { ascending: false })
                .limit(100);

            if (fallback.error) {
                console.error('Failed to fetch fallback wallet candidates', fallback.error);
                throw fallback.error;
            }

            candidates = fallback.data ?? [];
        }

        if (!candidates.length) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * candidates.length);
        return candidates[randomIndex].wallet_address;
    }

    private async insertRewardRecord(walletAddress: string, amount: number) {
        const { error } = await supabase.from('rewards').insert({
            wallet_address: walletAddress,
            reward_amount: amount,
        });

        if (error) {
            if (error.code === '23505') {
                throw new Error('Random reward already recorded for this wallet');
            }
            console.error('Failed to create random reward record', error);
            throw error;
        }
    }

    private async deleteRewardRecord(walletAddress: string) {
        const { error } = await supabase
            .from('rewards')
            .delete()
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('Failed to remove random reward record', error);
            throw error;
        }
    }

    private async markRewardAsSent(walletAddress: string, signature: string) {
        const { error } = await supabase
            .from('rewards')
            .update({
                transaction_signature: signature,
                claimed_at: new Date().toISOString(),
            })
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('Failed to update random reward record with signature', error);
            throw error;
        }
    }

    private async insertCashbackRecord(walletAddress: string, amount: number) {
        const { error } = await supabase.from('cashbacks').insert({
            wallet_address: walletAddress,
            amount,
        });

        if (error) {
            if (error.code === '23505') {
                throw new Error('Cashback already recorded for this wallet');
            }
            console.error('Failed to create cashback record', error);
            throw error;
        }
    }

    private async deleteCashbackRecord(walletAddress: string) {
        const { error } = await supabase
            .from('cashbacks')
            .delete()
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('Failed to remove cashback record', error);
            throw error;
        }
    }

    private async markCashbackAsSent(walletAddress: string, signature: string) {
        const { error } = await supabase
            .from('cashbacks')
            .update({
                transaction_signature: signature,
                claimed_at: new Date().toISOString(),
            })
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('Failed to update cashback record with signature', error);
            throw error;
        }
    }

    async distributeHolderReward(walletAddress: string): Promise<RewardDistributionResult> {
        const holdings = await this.checkTokenHoldings(walletAddress);
        const holdingsRounded = Number(holdings.toFixed(6));

        await this.updateWalletHolder(walletAddress, {
            holdings: holdingsRounded,
            lastScan: new Date().toISOString(),
        });

        if (holdingsRounded < MINIMUM_HOLDING) {
            return {
                type: 'cashback',
                walletAddress,
                amount: null,
                status: 'not_eligible',
                message: `Holdings ${holdingsRounded} below minimum threshold ${MINIMUM_HOLDING}`,
            };
        }

        if (await this.hasClaimedCashback(walletAddress)) {
            return {
                type: 'cashback',
                walletAddress,
                amount: null,
                status: 'already_claimed',
                message: 'Cashback already claimed',
            };
        }

        const cashbackAmount = Number(
            (holdingsRounded * CASHBACK_PERCENTAGE).toFixed(2)
        );

        try {
            await this.insertCashbackRecord(walletAddress, cashbackAmount);
        } catch (error) {
            if (error instanceof Error && error.message.includes('already recorded')) {
                return {
                    type: 'cashback',
                    walletAddress,
                    amount: null,
                    status: 'already_claimed',
                    message: 'Cashback already claimed',
                };
            }
            console.error('Failed to distribute cashback reward', error);
            return {
                type: 'cashback',
                walletAddress,
                amount: null,
                status: 'failed',
                message: 'Failed to prepare cashback reward',
            };
        }

        try {
            const signature = await this.sendSolReward(walletAddress, cashbackAmount);
            await this.markCashbackAsSent(walletAddress, signature);
            await this.updateWalletHolder(walletAddress, {
                holdings: holdingsRounded,
                cashbackDelta: cashbackAmount,
                cashbackClaimed: true,
                lastCashbackAt: new Date().toISOString(),
            });

            return {
                type: 'cashback',
                walletAddress,
                amount: cashbackAmount,
                status: 'awarded',
                message: 'Cashback sent successfully',
                signature,
            };
        } catch (error) {
            console.error('Failed to send cashback reward', error);
            await this.deleteCashbackRecord(walletAddress);
            return {
                type: 'cashback',
                walletAddress,
                amount: cashbackAmount,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Failed to send cashback reward',
            };
        }
    }

    async distributeRandomReward(): Promise<RewardDistributionResult> {
        const walletAddress = await this.getRandomWalletFromLeaderboard();

        if (!walletAddress) {
            return {
                type: 'random',
                walletAddress: null,
                amount: null,
                status: 'no_wallet',
                message: 'No eligible wallets found',
            };
        }

        if (await this.hasClaimedRandomReward(walletAddress)) {
            return {
                type: 'random',
                walletAddress,
                amount: null,
                status: 'already_claimed',
                message: 'Wallet already received a random reward',
            };
        }

        const rawAmount =
            Math.random() * (RANDOM_REWARD_RANGE.max - RANDOM_REWARD_RANGE.min) +
            RANDOM_REWARD_RANGE.min;
        const rewardAmount = Number(rawAmount.toFixed(2));

        try {
            await this.insertRewardRecord(walletAddress, rewardAmount);
        } catch (error) {
            if (error instanceof Error && error.message.includes('already recorded')) {
                return {
                    type: 'random',
                    walletAddress,
                    amount: null,
                    status: 'already_claimed',
                    message: 'Wallet already received a random reward',
                };
            }
            console.error('Failed to stage random reward', error);
            return {
                type: 'random',
                walletAddress,
                amount: null,
                status: 'failed',
                message: 'Failed to prepare random reward',
            };
        }

        try {
            const signature = await this.sendSolReward(walletAddress, rewardAmount);
            await this.markRewardAsSent(walletAddress, signature);
            await this.updateWalletHolder(walletAddress, {
                rewardDelta: rewardAmount,
                randomRewardClaimed: true,
                lastRewardAt: new Date().toISOString(),
            });

            return {
                type: 'random',
                walletAddress,
                amount: rewardAmount,
                status: 'awarded',
                message: 'Random reward sent successfully',
                signature,
            };
        } catch (error) {
            console.error('Failed to send random reward', error);
            await this.deleteRewardRecord(walletAddress);
            return {
                type: 'random',
                walletAddress,
                amount: rewardAmount,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Failed to send random reward',
            };
        }
    }

    private ensureRewardSigner(): { signer: Keypair; publicKey: PublicKey } {
        if (!this.rewardSigner || !this.rewardPublicKey) {
            throw new Error('Reward wallet signer is not configured');
        }
        return {
            signer: this.rewardSigner,
            publicKey: this.rewardPublicKey,
        };
    }

    private async sendSolReward(recipient: string, amount: number): Promise<string> {
        const { signer, publicKey } = this.ensureRewardSigner();
        let recipientPubkey: PublicKey;

        try {
            recipientPubkey = new PublicKey(recipient);
        } catch (error) {
            throw new Error('Invalid recipient wallet address');
        }

        if (recipientPubkey.equals(publicKey)) {
            throw new Error('Reward wallet cannot send rewards to itself');
        }
        const lamports = Math.max(1, Math.round(amount * LAMPORTS_PER_SOL));

        if (!Number.isFinite(lamports) || lamports <= 0) {
            throw new Error('Reward amount must be greater than zero');
        }

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: recipientPubkey,
                lamports,
            })
        );

        try {
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [signer],
                {
                    commitment: 'confirmed',
                    preflightCommitment: 'confirmed',
                }
            );

            return signature;
        } catch (error) {
            console.error('Failed to send reward transaction', error);
            if (error instanceof Error && error.message) {
                throw new Error(error.message);
            }
            throw new Error('Unknown error sending reward transaction');
        }
    }

}
