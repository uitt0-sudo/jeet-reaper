"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KOL {
  name: string;
  imageUrl: string;
  totalFumbled: string;
  worstFumbleToken: string;
  worstFumbleDate: string;
  worstFumbleAmount: string;
  fumblesTracked: number;
}

const kolsData: KOL[] = [
  {
    name: "OGAntD",
    imageUrl: "https://cdn.kolscan.io/profiles/215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP.png",
    totalFumbled: "$19,457,304",
    worstFumbleToken: "swarms",
    worstFumbleDate: "Dec 11, 2025",
    worstFumbleAmount: "-$11,502,609",
    fumblesTracked: 5,
  },
  {
    name: "xunle",
    imageUrl: "https://cdn.kolscan.io/profiles/4YzpSZpxDdjNf3unjkCtdWEsz2FL5mok7e5XQaDNqry8.png",
    totalFumbled: "$6,397,187",
    worstFumbleToken: "MAX",
    worstFumbleDate: "Dec 1, 2024",
    worstFumbleAmount: "-$3,695,634",
    fumblesTracked: 5,
  },
  {
    name: "Gake",
    imageUrl: "https://cdn.kolscan.io/profiles/DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm.png",
    totalFumbled: "$2,536,973",
    worstFumbleToken: "Fartcoin",
    worstFumbleDate: "Oct 30, 2024",
    worstFumbleAmount: "-$1,864,560",
    fumblesTracked: 5,
  },
  {
    name: "Casino",
    imageUrl: "https://cdn.kolscan.io/profiles/8rvAsDKeAcEjEkiZMug9k8v1y8mW6gQQiMobd89Uy7qR.png",
    totalFumbled: "$2,227,422",
    worstFumbleToken: "ASYM",
    worstFumbleDate: "Dec 23, 2024",
    worstFumbleAmount: "-$701,273",
    fumblesTracked: 5,
  },
  {
    name: "Pain",
    imageUrl: "https://cdn.kolscan.io/profiles/J6TDXvarvpBdPXTaTU8eJbtso1PUCYKGkVtMKUUY8iEa.png",
    totalFumbled: "$1,680,873",
    worstFumbleToken: "NOBODY",
    worstFumbleDate: "Apr 24, 2025",
    worstFumbleAmount: "-$1,216,333",
    fumblesTracked: 5,
  },
  {
    name: "Latuche",
    imageUrl: "https://cdn.kolscan.io/profiles/GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65.png",
    totalFumbled: "$1,431,919",
    worstFumbleToken: "PEPE",
    worstFumbleDate: "Nov 2, 2025",
    worstFumbleAmount: "-$705,990",
    fumblesTracked: 5,
  },
  {
    name: "Cented",
    imageUrl: "https://cdn.kolscan.io/profiles/CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o.png",
    totalFumbled: "$1,390,560",
    worstFumbleToken: "WhiteWhale",
    worstFumbleDate: "Dec 6, 2025",
    worstFumbleAmount: "-$577,454",
    fumblesTracked: 5,
  },
  {
    name: "Cupsey",
    imageUrl: "https://cdn.kolscan.io/profiles/2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f.png",
    totalFumbled: "$1,370,826",
    worstFumbleToken: "1",
    worstFumbleDate: "Sep 17, 2025",
    worstFumbleAmount: "-$1,121,099",
    fumblesTracked: 5,
  },
  {
    name: "Fizzwick Bramblewhistle",
    imageUrl: "https://cdn.kolscan.io/profiles/3pcmVZ1DwKbqnjbGbeg3FycThT1AkTpGQYB96jGU6oS1.png",
    totalFumbled: "$839,618",
    worstFumbleToken: "Bagwork",
    worstFumbleDate: "Sep 14, 2025",
    worstFumbleAmount: "-$567,275",
    fumblesTracked: 5,
  },
  {
    name: "kitty",
    imageUrl: "https://cdn.kolscan.io/profiles/qP3Q8d4WWsGbqkTfyA9Dr6cAD7DQoBuxPJMFTK48rWU.png",
    totalFumbled: "$653,047",
    worstFumbleToken: "WOJAK",
    worstFumbleDate: "Aug 6, 2025",
    worstFumbleAmount: "-$392,518",
    fumblesTracked: 5,
  },
  {
    name: "unprofitable",
    imageUrl: "https://cdn.kolscan.io/profiles/DYmsQudNqJyyDvq86XmzAvrU9T7xwfQEwh6gPQw9TPNF.png",
    totalFumbled: "$487,507",
    worstFumbleToken: "PFP",
    worstFumbleDate: "Oct 2, 2025",
    worstFumbleAmount: "-$161,883",
    fumblesTracked: 5,
  },
  {
    name: "Orange",
    imageUrl: "https://cdn.kolscan.io/profiles/2X4H5Y9C4Fy6Pf3wpq8Q4gMvLcWvfrrwDv2bdR8AAwQv.png",
    totalFumbled: "$479,159",
    worstFumbleToken: "Bagwork",
    worstFumbleDate: "Oct 1, 2025",
    worstFumbleAmount: "-$334,561",
    fumblesTracked: 5,
  },
  {
    name: "chester",
    imageUrl: "https://cdn.kolscan.io/profiles/PMJA8UQDyWTFw2Smhyp9jGA6aTaP7jKHR7BPudrgyYN.png",
    totalFumbled: "$445,451",
    worstFumbleToken: "1",
    worstFumbleDate: "Sep 18, 2025",
    worstFumbleAmount: "-$344,627",
    fumblesTracked: 5,
  },
  {
    name: "Files",
    imageUrl: "https://cdn.kolscan.io/profiles/DtjYbZntc2mEm1UrZHNcKguak6h6QM4S5xobnwFgg92Y.png",
    totalFumbled: "$422,630",
    worstFumbleToken: "ADLOWS",
    worstFumbleDate: "Oct 9, 2025",
    worstFumbleAmount: "-$383,154",
    fumblesTracked: 5,
  },
  {
    name: "Reljoo",
    imageUrl: "https://cdn.kolscan.io/profiles/FsG3BaPmRTdSrPaivbgJsFNCCa8cPfkUtk8VLWXkHpHP.png",
    totalFumbled: "$385,840",
    worstFumbleToken: "WOJAK",
    worstFumbleDate: "Aug 6, 2025",
    worstFumbleAmount: "-$251,320",
    fumblesTracked: 5,
  },
];

const KOLCard = ({ kol, index }: { kol: KOL; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Card className="card-glass noise-texture overflow-hidden p-4 transition-all hover:scale-[1.02] hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/30">
          <img
            src={kol.imageUrl}
            alt={kol.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.png";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold text-foreground">{kol.name}</h3>
            <Badge variant="secondary" className="flex-shrink-0 text-[10px]">
              VERIFIED KOL
            </Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Total Fumbled</p>
              <p className="font-semibold text-destructive">{kol.totalFumbled}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Worst Fumble</p>
              <p className="truncate font-medium text-foreground">{kol.worstFumbleToken}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{kol.worstFumbleDate}</span>
            <span className="font-semibold text-destructive">{kol.worstFumbleAmount}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {kol.fumblesTracked} fumbles tracked
          </p>
        </div>
      </div>
    </Card>
  </motion.div>
);

export const KOLsSection = () => {
  return (
    <Card className="card-glass noise-texture p-8">
      <h2 className="mb-2 text-2xl font-bold">KOLs</h2>
      <p className="mb-6 text-muted-foreground">
        A curated museum showcasing the legendary mistakes of Solana&apos;s most watched traders.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kolsData.map((kol, index) => (
          <KOLCard key={kol.name} kol={kol} index={index} />
        ))}
      </div>
    </Card>
  );
};

export default KOLsSection;
