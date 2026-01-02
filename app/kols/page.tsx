"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation, TopBar } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, TrendingDown, Calendar, Flame, Trophy, Skull, DollarSign } from "lucide-react";
import lexaproImage from "@/assets/kol-lexapro.png";

interface KOL {
  name: string;
  imageUrl: string;
  totalFumbled: string;
  totalFumbledNum: number;
  worstFumbleToken: string;
  worstFumbleDate: string;
  worstFumbleAmount: string;
  worstFumbleAmountNum: number;
  fumblesTracked: number;
  rank: number;
}

const LEXAPRO_IMAGE = lexaproImage as unknown as string;

const kolsData: KOL[] = [
  {
    name: "Lexapro",
    imageUrl: LEXAPRO_IMAGE,
    totalFumbled: "$8,863,380",
    totalFumbledNum: 8863380,
    worstFumbleToken: "pippin",
    worstFumbleDate: "2025",
    worstFumbleAmount: "-$6,643,700",
    worstFumbleAmountNum: 6643700,
    fumblesTracked: 4533,
    rank: 1,
  },
  {
    name: "OGAntD",
    imageUrl: "https://cdn.kolscan.io/profiles/215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP.png",
    totalFumbled: "$19,457,304",
    totalFumbledNum: 19457304,
    worstFumbleToken: "swarms",
    worstFumbleDate: "Dec 11, 2025",
    worstFumbleAmount: "-$11,502,609",
    worstFumbleAmountNum: 11502609,
    fumblesTracked: 5,
    rank: 2,
  },
  {
    name: "xunle",
    imageUrl: "https://cdn.kolscan.io/profiles/4YzpSZpxDdjNf3unjkCtdWEsz2FL5mok7e5XQaDNqry8.png",
    totalFumbled: "$6,397,187",
    totalFumbledNum: 6397187,
    worstFumbleToken: "MAX",
    worstFumbleDate: "Dec 1, 2024",
    worstFumbleAmount: "-$3,695,634",
    worstFumbleAmountNum: 3695634,
    fumblesTracked: 5,
    rank: 3,
  },
  {
    name: "Gake",
    imageUrl: "https://cdn.kolscan.io/profiles/DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm.png",
    totalFumbled: "$2,536,973",
    totalFumbledNum: 2536973,
    worstFumbleToken: "Fartcoin",
    worstFumbleDate: "Oct 30, 2024",
    worstFumbleAmount: "-$1,864,560",
    worstFumbleAmountNum: 1864560,
    fumblesTracked: 5,
    rank: 4,
  },
  {
    name: "Casino",
    imageUrl: "https://cdn.kolscan.io/profiles/8rvAsDKeAcEjEkiZMug9k8v1y8mW6gQQiMobd89Uy7qR.png",
    totalFumbled: "$2,227,422",
    totalFumbledNum: 2227422,
    worstFumbleToken: "ASYM",
    worstFumbleDate: "Dec 23, 2024",
    worstFumbleAmount: "-$701,273",
    worstFumbleAmountNum: 701273,
    fumblesTracked: 5,
    rank: 5,
  },
  {
    name: "Pain",
    imageUrl: "https://cdn.kolscan.io/profiles/J6TDXvarvpBdPXTaTU8eJbtso1PUCYKGkVtMKUUY8iEa.png",
    totalFumbled: "$1,680,873",
    totalFumbledNum: 1680873,
    worstFumbleToken: "NOBODY",
    worstFumbleDate: "Apr 24, 2025",
    worstFumbleAmount: "-$1,216,333",
    worstFumbleAmountNum: 1216333,
    fumblesTracked: 5,
    rank: 6,
  },
  {
    name: "Latuche",
    imageUrl: "https://cdn.kolscan.io/profiles/GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65.png",
    totalFumbled: "$1,431,919",
    totalFumbledNum: 1431919,
    worstFumbleToken: "PEPE",
    worstFumbleDate: "Nov 2, 2025",
    worstFumbleAmount: "-$705,990",
    worstFumbleAmountNum: 705990,
    fumblesTracked: 5,
    rank: 7,
  },
  {
    name: "Cented",
    imageUrl: "https://cdn.kolscan.io/profiles/CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o.png",
    totalFumbled: "$1,390,560",
    totalFumbledNum: 1390560,
    worstFumbleToken: "WhiteWhale",
    worstFumbleDate: "Dec 6, 2025",
    worstFumbleAmount: "-$577,454",
    worstFumbleAmountNum: 577454,
    fumblesTracked: 5,
    rank: 8,
  },
  {
    name: "Cupsey",
    imageUrl: "https://cdn.kolscan.io/profiles/2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f.png",
    totalFumbled: "$1,370,826",
    totalFumbledNum: 1370826,
    worstFumbleToken: "1",
    worstFumbleDate: "Sep 17, 2025",
    worstFumbleAmount: "-$1,121,099",
    worstFumbleAmountNum: 1121099,
    fumblesTracked: 5,
    rank: 9,
  },
  {
    name: "Fizzwick Bramblewhistle",
    imageUrl: "https://cdn.kolscan.io/profiles/3pcmVZ1DwKbqnjbGbeg3FycThT1AkTpGQYB96jGU6oS1.png",
    totalFumbled: "$839,618",
    totalFumbledNum: 839618,
    worstFumbleToken: "Bagwork",
    worstFumbleDate: "Sep 14, 2025",
    worstFumbleAmount: "-$567,275",
    worstFumbleAmountNum: 567275,
    fumblesTracked: 5,
    rank: 10,
  },
  {
    name: "kitty",
    imageUrl: "https://cdn.kolscan.io/profiles/qP3Q8d4WWsGbqkTfyA9Dr6cAD7DQoBuxPJMFTK48rWU.png",
    totalFumbled: "$653,047",
    totalFumbledNum: 653047,
    worstFumbleToken: "WOJAK",
    worstFumbleDate: "Aug 6, 2025",
    worstFumbleAmount: "-$392,518",
    worstFumbleAmountNum: 392518,
    fumblesTracked: 5,
    rank: 11,
  },
  {
    name: "unprofitable",
    imageUrl: "https://cdn.kolscan.io/profiles/DYmsQudNqJyyDvq86XmzAvrU9T7xwfQEwh6gPQw9TPNF.png",
    totalFumbled: "$487,507",
    totalFumbledNum: 487507,
    worstFumbleToken: "PFP",
    worstFumbleDate: "Oct 2, 2025",
    worstFumbleAmount: "-$161,883",
    worstFumbleAmountNum: 161883,
    fumblesTracked: 5,
    rank: 12,
  },
  {
    name: "Orange",
    imageUrl: "https://cdn.kolscan.io/profiles/2X4H5Y9C4Fy6Pf3wpq8Q4gMvLcWvfrrwDv2bdR8AAwQv.png",
    totalFumbled: "$479,159",
    totalFumbledNum: 479159,
    worstFumbleToken: "Bagwork",
    worstFumbleDate: "Oct 1, 2025",
    worstFumbleAmount: "-$334,561",
    worstFumbleAmountNum: 334561,
    fumblesTracked: 5,
    rank: 13,
  },
  {
    name: "chester",
    imageUrl: "https://cdn.kolscan.io/profiles/PMJA8UQDyWTFw2Smhyp9jGA6aTaP7jKHR7BPudrgyYN.png",
    totalFumbled: "$445,451",
    totalFumbledNum: 445451,
    worstFumbleToken: "1",
    worstFumbleDate: "Sep 18, 2025",
    worstFumbleAmount: "-$344,627",
    worstFumbleAmountNum: 344627,
    fumblesTracked: 5,
    rank: 14,
  },
  {
    name: "Files",
    imageUrl: "https://cdn.kolscan.io/profiles/DtjYbZntc2mEm1UrZHNcKguak6h6QM4S5xobnwFgg92Y.png",
    totalFumbled: "$422,630",
    totalFumbledNum: 422630,
    worstFumbleToken: "ADLOWS",
    worstFumbleDate: "Oct 9, 2025",
    worstFumbleAmount: "-$383,154",
    worstFumbleAmountNum: 383154,
    fumblesTracked: 5,
    rank: 15,
  },
  {
    name: "Reljoo",
    imageUrl: "https://cdn.kolscan.io/profiles/FsG3BaPmRTdSrPaivbgJsFNCCa8cPfkUtk8VLWXkHpHP.png",
    totalFumbled: "$385,840",
    totalFumbledNum: 385840,
    worstFumbleToken: "WOJAK",
    worstFumbleDate: "Aug 6, 2025",
    worstFumbleAmount: "-$251,320",
    worstFumbleAmountNum: 251320,
    fumblesTracked: 5,
    rank: 16,
  },
];

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />;
  return <Skull className="h-4 w-4 text-destructive/70" />;
};

const getRankGradient = (rank: number) => {
  if (rank === 1) return "from-yellow-500/20 via-yellow-400/10 to-transparent border-yellow-500/50";
  if (rank === 2) return "from-gray-400/20 via-gray-300/10 to-transparent border-gray-400/50";
  if (rank === 3) return "from-amber-600/20 via-amber-500/10 to-transparent border-amber-600/50";
  return "from-primary/10 via-primary/5 to-transparent border-primary/20";
};

const KOLCard = ({ kol, onClick }: { kol: KOL; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.03, y: -4 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    onClick={onClick}
    className="cursor-pointer"
  >
    <Card className={`relative overflow-hidden border-2 bg-gradient-to-br ${getRankGradient(kol.rank)} backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--primary),0.3)]`}>
      {/* Rank badge */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 backdrop-blur-sm">
        {getRankIcon(kol.rank)}
        <span className="text-sm font-bold">#{kol.rank}</span>
      </div>

      {/* Glowing effect for top 3 */}
      {kol.rank <= 3 && (
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 pointer-events-none" />
      )}

      <div className="p-5">
        {/* Header with avatar and name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${kol.rank === 1 ? "from-yellow-400 to-yellow-600" : kol.rank === 2 ? "from-gray-300 to-gray-500" : kol.rank === 3 ? "from-amber-500 to-amber-700" : "from-primary to-accent"} opacity-75 blur-sm`} />
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-background">
              <img
                src={kol.imageUrl}
                alt={kol.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground truncate max-w-[140px]">{kol.name}</h3>
            <Badge variant="outline" className="mt-1 border-primary/50 bg-primary/10 text-primary text-[10px]">
              VERIFIED KOL
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Flame className="h-3.5 w-3.5 text-destructive" />
              <span>Total Fumbled</span>
            </div>
            <p className="text-2xl font-black text-destructive">{kol.totalFumbled}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-background/50 p-2.5 border border-border/50">
              <p className="text-[10px] text-muted-foreground mb-0.5">Worst Fumble</p>
              <p className="font-bold text-foreground truncate">{kol.worstFumbleToken}</p>
              <p className="text-xs font-semibold text-destructive">{kol.worstFumbleAmount}</p>
            </div>
            <div className="rounded-lg bg-background/50 p-2.5 border border-border/50">
              <p className="text-[10px] text-muted-foreground mb-0.5">Date</p>
              <p className="text-sm font-medium text-foreground">{kol.worstFumbleDate}</p>
              <p className="text-xs text-muted-foreground">{kol.fumblesTracked} tracked</p>
            </div>
          </div>
        </div>

        {/* Click indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-60">
          <span>Click for details</span>
          <TrendingDown className="h-3 w-3" />
        </div>
      </div>
    </Card>
  </motion.div>
);

const KOLDetailModal = ({ kol, isOpen, onClose }: { kol: KOL | null; isOpen: boolean; onClose: () => void }) => {
  if (!kol) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-2 border-primary/30 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className={`relative bg-gradient-to-br ${getRankGradient(kol.rank)} p-6 pb-8`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-background/50 p-1.5 backdrop-blur-sm transition-colors hover:bg-background/80"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className={`absolute -inset-2 rounded-full bg-gradient-to-r ${kol.rank === 1 ? "from-yellow-400 to-yellow-600" : kol.rank === 2 ? "from-gray-300 to-gray-500" : kol.rank === 3 ? "from-amber-500 to-amber-700" : "from-primary to-accent"} opacity-75 blur-md animate-pulse`} />
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background shadow-xl">
                <img
                  src={kol.imageUrl}
                  alt={kol.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo.png";
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getRankIcon(kol.rank)}
                <span className="text-sm font-bold text-muted-foreground">Rank #{kol.rank}</span>
              </div>
              <h2 className="text-2xl font-black text-foreground">{kol.name}</h2>
              <Badge variant="outline" className="mt-2 border-primary/50 bg-primary/10 text-primary">
                VERIFIED KOL
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats content */}
        <div className="p-6 space-y-4">
          {/* Total Fumbled - Hero stat */}
          <div className="rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 p-5 border border-destructive/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Flame className="h-4 w-4 text-destructive" />
              <span>Total Value Fumbled</span>
            </div>
            <p className="text-4xl font-black text-destructive">{kol.totalFumbled}</p>
            <p className="text-xs text-muted-foreground mt-1">Lifetime paperhands losses</p>
          </div>

          {/* Worst Fumble */}
          <div className="rounded-xl bg-background/50 p-5 border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Skull className="h-4 w-4 text-destructive" />
              <span>Worst Single Fumble</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-foreground">{kol.worstFumbleToken}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{kol.worstFumbleDate}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-destructive">{kol.worstFumbleAmount}</p>
                <p className="text-xs text-muted-foreground">left on the table</p>
              </div>
            </div>
          </div>

          {/* Additional stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-primary" />
                <span>Fumbles Tracked</span>
              </div>
              <p className="text-2xl font-bold text-primary">{kol.fumblesTracked}</p>
            </div>
            <div className="rounded-lg bg-accent/5 p-4 border border-accent/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                <span>Avg per Fumble</span>
              </div>
              <p className="text-2xl font-bold text-accent">
                ${Math.round(kol.totalFumbledNum / kol.fumblesTracked).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Regret meter */}
          <div className="rounded-lg bg-gradient-to-r from-destructive/10 via-destructive/20 to-destructive/10 p-4 border border-destructive/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-destructive">Regret Level</span>
              <span className="text-xs text-muted-foreground">MAXIMUM</span>
            </div>
            <div className="h-3 rounded-full bg-background/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-destructive via-red-500 to-orange-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const KOLsPage = () => {
  const [selectedKOL, setSelectedKOL] = useState<KOL | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TopBar />

      <main className="ml-64 mt-16 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Hero header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <Skull className="h-6 w-6 text-destructive" />
              </div>
              <Badge variant="secondary" className="text-xs">HALL OF SHAME</Badge>
            </div>
            <h1 className="text-5xl font-black mb-3">
              <span className="gradient-text">KOLs</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              A curated museum showcasing the legendary mistakes of Solana&apos;s most watched traders. 
              Even the biggest names paperhand.
            </p>
          </motion.div>

          {/* Stats banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-destructive/10 via-primary/5 to-accent/10 border-destructive/30 p-6">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-black text-destructive">
                    ${Math.round(kolsData.reduce((acc, kol) => acc + kol.totalFumbledNum, 0) / 1000000).toFixed(1)}M+
                  </p>
                  <p className="text-sm text-muted-foreground">Total KOL Fumbles</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-primary">{kolsData.length}</p>
                  <p className="text-sm text-muted-foreground">Verified KOLs</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-accent">
                    ${Math.round(kolsData.reduce((acc, kol) => acc + kol.worstFumbleAmountNum, 0) / 1000000).toFixed(1)}M+
                  </p>
                  <p className="text-sm text-muted-foreground">Worst Fumbles Combined</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Grid of KOL cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {kolsData.map((kol, index) => (
              <motion.div
                key={kol.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.03 }}
              >
                <KOLCard kol={kol} onClick={() => setSelectedKOL(kol)} />
              </motion.div>
            ))}
          </motion.div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Data sourced from on-chain analysis. All KOLs are verified public figures. 
              <br />
              <span className="text-primary">Don&apos;t be like them. HODL.</span>
            </p>
          </motion.div>
        </div>
      </main>

      {/* Detail modal */}
      <KOLDetailModal
        kol={selectedKOL}
        isOpen={!!selectedKOL}
        onClose={() => setSelectedKOL(null)}
      />
    </div>
  );
};

export default KOLsPage;
