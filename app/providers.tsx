// app/providers.tsx
"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CursorTrail } from "@/components/CursorTrail";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create query client once per app
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CursorTrail />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
