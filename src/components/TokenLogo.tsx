import React, { useState, useMemo } from "react";

interface TokenLogoProps {
  mint?: string;
  alt?: string;
  className?: string;
  size?: number;
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

export const TokenLogo: React.FC<TokenLogoProps> = ({ mint, alt = "token logo", className = "h-8 w-8 rounded-full border border-border object-cover", size = 32 }) => {
  const [idx, setIdx] = useState(0);

  const sources = useMemo(() => {
    const identicon = makeIdenticonDataUrl(mint || "unknown", size);
    if (!mint) return ["/placeholder.svg", identicon];
    const m = encodeURIComponent(mint);
    // Proxy remote images to avoid CORS/referrer issues and ensure load success
    const p = (u: string) =>
      u.startsWith("http")
        ? `https://images.weserv.nl/?url=${encodeURIComponent(u.replace(/^https?:\/\//, ""))}&w=${size}&h=${size}&fit=cover&we`
        : u;

    return [
      // DexScreener ds-data CDN (most reliable, no proxy needed)
      `https://dd.dexscreener.com/ds-data/tokens/solana/${m}.png`,
      // Jupiter CDN (direct, usually works)
      `https://img.jup.ag/token/${m}`,
      // Birdeye resized (direct)
      `https://img.birdeye.so/logo-go/${m}?w=${size}&h=${size}`,
      // Raydium CDN
      `https://img-v1.raydium.io/icon/${m}.png`,
      // DexScreener token icons CDN
      `https://cdn.dexscreener.com/token-icons/solana/${m}.png`,
      // Moralis CloudFront for pump.fun tokens
      `https://d23exngyjlavgo.cloudfront.net/solana_${m}`,
      // Solana token list (proxied to avoid CORS)
      p(`https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${m}/logo.png`),
      // TrustWallet assets (proxied)
      p(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/${m}/logo.png`),
      // Local placeholder then deterministic identicon
      "/placeholder.svg",
      identicon,
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
      decoding="async"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
};

export default TokenLogo;
