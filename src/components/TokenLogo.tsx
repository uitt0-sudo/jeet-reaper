import React, { useState, useMemo } from "react";

interface TokenLogoProps {
  mint?: string;
  alt?: string;
  className?: string;
  size?: number;
  preferredUrls?: string[];
}

// Generate a deterministic, pretty SVG identicon as a 100% fallback
function makeIdenticonDataUrl(key: string, size: number) {
  const s = Math.max(24, size);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash << 5) - hash + key.charCodeAt(i);
  const h1 = Math.abs(hash) % 360;
  const h2 = (Math.abs(hash >> 7) % 360);
  const c1 = `hsl(${h1} 70% 55%)`;
  const c2 = `hsl(${h2} 70% 45%)`;
  const cells = 5;
  const cellSize = s / cells;
  let rects = "";
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < Math.ceil(cells / 2); x++) {
      const bit = (hash >> (y * cells + x)) & 1;
      if (bit) {
        const rx = x * cellSize;
        const lx = (cells - 1 - x) * cellSize;
        const ry = y * cellSize;
        rects += `<rect x="${rx}" y="${ry}" width="${cellSize}" height="${cellSize}" fill="${c1}" rx="${cellSize / 5}"/>`;
        rects += `<rect x="${lx}" y="${ry}" width="${cellSize}" height="${cellSize}" fill="${c2}" rx="${cellSize / 5}"/>`;
      }
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 ${s} ${s}'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${c1}'/>
        <stop offset='100%' stop-color='${c2}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <g opacity='0.9'>${rects}</g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const TokenLogo: React.FC<TokenLogoProps> = ({
  mint,
  alt = "token logo",
  className = "h-8 w-8 rounded-full border border-border object-cover",
  size = 32,
  preferredUrls = [],
}) => {
  const [idx, setIdx] = useState(0);

  const sources = useMemo(() => {
    const identicon = makeIdenticonDataUrl(mint || "unknown", size);
    const seen = new Set<string>();
    const ordered: string[] = [];

    const proxify = (url: string) => {
      if (!url) return url;
      if (url.startsWith("data:")) return url;
      if (!url.startsWith("http")) return url;
      const stripped = url.replace(/^https?:\/\//, "");
      return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&w=${size}&h=${size}&fit=cover&we`;
    };

    const addSource = (url?: string, useProxy = true) => {
      if (!url || url.length < 5) return;
      const finalUrl = useProxy ? proxify(url) : url;
      if (!finalUrl || seen.has(finalUrl)) return;
      seen.add(finalUrl);
      ordered.push(finalUrl);
    };

    preferredUrls.forEach((url) => addSource(url, !url.startsWith("data:")));

    if (!mint) {
      addSource("/placeholder.svg", false);
      addSource(identicon, false);
      return ordered.length > 0 ? ordered : ["/placeholder.svg", identicon];
    }

    const encodedMint = encodeURIComponent(mint);

    // DexScreener ds-data CDN (most reliable, no proxy needed)
    addSource(`https://dd.dexscreener.com/ds-data/tokens/solana/${encodedMint}.png`, false);
    // Jupiter CDN (direct, usually works)
    addSource(`https://img.jup.ag/token/${encodedMint}`, false);
    // Birdeye resized (direct)
    addSource(`https://img.birdeye.so/logo-go/${encodedMint}?w=${size}&h=${size}`, false);
    // Raydium CDN
    addSource(`https://img-v1.raydium.io/icon/${encodedMint}.png`, false);
    // DexScreener token icons CDN
    addSource(`https://cdn.dexscreener.com/token-icons/solana/${encodedMint}.png`, false);
    // Moralis CloudFront for pump.fun tokens
    addSource(`https://d23exngyjlavgo.cloudfront.net/solana_${encodedMint}`, false);
    // Solana token list (proxied to avoid CORS)
    addSource(`https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${encodedMint}/logo.png`, true);
    // TrustWallet assets (proxied)
    addSource(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/${encodedMint}/logo.png`, true);
    // Local placeholder then deterministic identicon
    addSource("/placeholder.svg", false);
    addSource(identicon, false);

    return ordered;
  }, [mint, size, preferredUrls]);

  const src = sources[Math.min(idx, sources.length - 1)];

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setIdx((i) => Math.min(i + 1, sources.length - 1))}
      loading="lazy"
      decoding="async"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
};

export default TokenLogo;
