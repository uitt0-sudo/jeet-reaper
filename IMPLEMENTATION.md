# paperhands.cc - Implementation Guide

## Project Overview

A production-ready Solana paperhands checker built with React, Vite, TailwindCSS, and Framer Motion. Features a dark Binance-inspired theme with yellow/black colors and Solana purple/green accents.

## Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS with custom design system
- **Animations**: Framer Motion
- **Charts**: Recharts
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Routing**: React Router

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn components
│   ├── AnimatedLoader.tsx
│   ├── CursorTrail.tsx
│   ├── MarqueeBanner.tsx
│   ├── MetricCard.tsx
│   ├── Navigation.tsx
│   └── ProfileModal.tsx
├── lib/
│   ├── mockData.ts      # Mock data generation
│   └── utils.ts
├── pages/
│   ├── About.tsx
│   ├── ApiDocs.tsx
│   ├── Dashboard.tsx
│   ├── HowItWorks.tsx
│   ├── Landing.tsx
│   ├── Leaderboard.tsx
│   └── NotFound.tsx
├── types/
│   └── paperhands.ts    # TypeScript interfaces
├── App.tsx
├── index.css            # Design system tokens
└── main.tsx
```

## Design System

All colors and styles are defined in `src/index.css` using HSL values:

- **Primary**: Yellow/gold (#F0B90B - Binance yellow)
- **Accent**: Purple (Solana)
- **Success**: Green
- **Background**: Dark (#0F0F0F)

### Custom Classes

- `.card-glass` - Glassmorphism effect
- `.noise-texture` - Subtle noise overlay
- `.gradient-text` - Primary gradient text
- `.shine-effect` - Animated shine sweep
- `.hazard-stripe` - Yellow/black warning pattern

## Key Features

### 1. **Landing Page** (`src/pages/Landing.tsx`)
- Hero with animated gradient text
- CTA buttons to dashboard and leaderboard
- Stats showcase
- Background decorations with blur effects

### 2. **Dashboard** (`src/pages/Dashboard.tsx`)
- Wallet address input with validation
- 7-second animated loader with progress bar
- Metric cards showing paperhands stats
- Regret gallery with top events
- Top regretted tokens list

### 3. **Leaderboard** (`src/pages/Leaderboard.tsx`)
- Sortable table with search
- Click "Analyze" to open profile modal
- Rank badges with color coding
- Real-time sorting and filtering

### 4. **Profile Modal** (`src/components/ProfileModal.tsx`)
- Detailed wallet stats
- Tabbed interface (Overview, Worst Paperhands, Trades)
- Badge system for trader types
- Copy address functionality

### 5. **Cursor Trail** (`src/components/CursorTrail.tsx`)
- Canvas-based particle trail
- Follows mouse movement
- Fades out over time

### 6. **Marquee Banner** (`src/components/MarqueeBanner.tsx`)
- Infinite scroll hazard stripe
- "ARE YOU A JEET?" message
- Pauses on hover

## Plugging in Real APIs

### Update Mock Data Sources

**File**: `src/lib/mockData.ts`

Replace the mock functions with API calls:

```typescript
// Before (Mock)
export const generateMockWalletStats = (address: string): WalletStats => {
  // ... mock implementation
};

// After (Real API)
export const fetchWalletStats = async (address: string): Promise<WalletStats> => {
  const response = await fetch(`https://api.paperhands.cc/v1/wallet/${address}`);
  if (!response.ok) throw new Error('Failed to fetch wallet stats');
  return response.json();
};
```

### Update Dashboard Analysis

**File**: `src/pages/Dashboard.tsx` (lines 17-29)

```typescript
// Change from:
const handleAnalysisComplete = () => {
  setIsAnalyzing(false);
  const stats = generateMockWalletStats(walletAddress);
  setWalletStats(stats);
};

// To:
const handleAnalysisComplete = async () => {
  try {
    const stats = await fetchWalletStats(walletAddress);
    setWalletStats(stats);
  } catch (error) {
    toast({ 
      title: "Error", 
      description: "Failed to analyze wallet", 
      variant: "destructive" 
    });
  } finally {
    setIsAnalyzing(false);
  }
};
```

### Update Leaderboard Data

**File**: `src/pages/Leaderboard.tsx` (lines 12-20)

```typescript
// Add state and fetch logic
const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

useEffect(() => {
  fetch('https://api.paperhands.cc/v1/leaderboard?limit=50')
    .then(res => res.json())
    .then(data => setLeaderboardData(data.entries))
    .catch(err => console.error(err));
}, []);

// Replace MOCK_LEADERBOARD with leaderboardData
```

## API Integration Points

### Required Endpoints

1. **POST /api/analyze**
   - Body: `{ address: string, timeframe?: number }`
   - Returns: `WalletStats` object

2. **GET /api/leaderboard**
   - Query: `?limit=50&sortBy=totalRegret&timeframe=all`
   - Returns: `{ count: number, entries: LeaderboardEntry[] }`

3. **GET /api/wallet/:address**
   - Returns: `WalletStats` object

### Expected Data Shapes

See `src/types/paperhands.ts` for complete TypeScript interfaces:

- `WalletStats` - Complete wallet analysis
- `PaperhandsEvent` - Single paperhands event
- `LeaderboardEntry` - Leaderboard row
- `TokenStats` - Per-token statistics

## Environment Variables

Create `.env.local`:

```env
VITE_API_BASE_URL=https://api.paperhands.cc/v1
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Customization

### Colors

Edit `src/index.css` HSL values:

```css
--primary: 45 100% 51%;        /* Main yellow */
--accent: 270 70% 65%;         /* Purple accent */
--success: 140 65% 50%;        /* Green */
--background: 0 0% 6%;         /* Dark background */
```

### Animations

Modify `tailwind.config.ts` keyframes and animation timings.

### Loader Duration

Change in `src/components/AnimatedLoader.tsx` line 24:

```typescript
const duration = 7000; // milliseconds
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance Optimizations

- Framer Motion animations use GPU acceleration
- Canvas cursor trail optimized with requestAnimationFrame
- Lazy loading for images (if added)
- React.memo for expensive components
- Code splitting by route

## Accessibility

- Semantic HTML throughout
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Skip links (if added)

## Known Limitations

- Mock data is client-side generated
- No authentication/authorization
- No real blockchain integration
- Search is client-side only

## Next Steps

1. Connect to real Solana blockchain data
2. Implement backend API
3. Add user authentication
4. Enable wallet connection (Phantom, Solflare)
5. Real-time WebSocket updates
6. Advanced filtering and search
7. Export/share functionality
8. Mobile app version

## Support

Twitter: [@bnbpaperhands](https://twitter.com/bnbpaperhands)
