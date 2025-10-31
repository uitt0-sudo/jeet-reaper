import { Router } from 'express';
import { Connection } from '@solana/web3.js';
import { RewardsService } from '../services/RewardsService';
import { supabase } from '../config/supabase';

const router = Router();
const connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
const rewardsService = new RewardsService(
    connection,
    process.env.HELIUS_API_KEY!,
    process.env.TOKEN_MINT_ADDRESS!
);

router.get('/leaderboard', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('wallet_holders')
            .select('*')
            .order('total_rewards', { ascending: false })
            .limit(100);

        if (error) throw error;

        res.json({
            success: true,
            leaderboard: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard'
        });
    }
});

router.post('/scan-wallet', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        
        const holderReward = await rewardsService.distributeHolderReward(walletAddress);
        const randomReward = await rewardsService.distributeRandomReward();
        
        res.json({ 
            success: true, 
            holderReward,
            randomReward
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process rewards' 
        });
    }
});

export default router;
