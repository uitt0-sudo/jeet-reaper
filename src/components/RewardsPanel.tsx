import React, { useState } from 'react';
import { generateRandomReward, claimCashback, MINIMUM_HOLDING } from '../lib/rewards';

interface RewardsPanelProps {
  walletAddress: string;
  holdingAmount: number;
}

export const RewardsPanel: React.FC<RewardsPanelProps> = ({ walletAddress, holdingAmount }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRandomReward = async () => {
    setLoading(true);
    const reward = await generateRandomReward(walletAddress);
    setLoading(false);
    
    if (reward) {
      setMessage(`Congratulations! You won ${reward.amount.toFixed(2)} tokens!`);
    } else {
      setMessage('You have already claimed your reward or an error occurred.');
    }
  };

  const handleCashback = async () => {
    setLoading(true);
    const cashback = await claimCashback(walletAddress, holdingAmount);
    setLoading(false);

    if (cashback) {
      setMessage(`Cashback claimed: ${cashback.amount.toFixed(2)} tokens!`);
    } else {
      setMessage(`Cashback not available. Minimum holding required: ${MINIMUM_HOLDING} tokens.`);
    }
  };

  return (
    <div className="rewards-panel">
      <h2>Rewards & Cashback</h2>
      <div className="buttons">
        <button onClick={handleRandomReward} disabled={loading}>
          Claim Random Reward
        </button>
        <button onClick={handleCashback} disabled={loading}>
          Claim Cashback
        </button>
      </div>
      {message && <p className="message">{message}</p>}
    </div>
  );
};
