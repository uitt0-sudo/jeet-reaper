import React, { useState, useMemo } from "react";

interface TokenLogoProps {
  mint?: string;
  alt?: string;
  className?: string;
  size?: number;
}

export const TokenLogo: React.FC<TokenLogoProps> = ({ mint, alt = "token logo", className = "h-8 w-8 rounded-full border border-border object-cover", size = 32 }) => {
  const [idx, setIdx] = useState(0);

  const sources = useMemo(() => {
    if (!mint) return ["/placeholder.svg"]; 
    const m = encodeURIComponent(mint);
    return [
      `https://img.jup.ag/token/${m}`,
      // Solana token list (works for many established tokens)
      `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${m}/logo.png`,
      // Birdeye CDN (no key required for images)
      `https://img.birdeye.so/logo-go/${m}?w=${size}&h=${size}`,
      "/placeholder.svg",
    ];
  }, [mint, size]);

  const src = sources[Math.min(idx, sources.length - 1)];

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setIdx((i) => Math.min(i + 1, sources.length - 1))}
      loading="lazy"
    />
  );
};

export default TokenLogo;
