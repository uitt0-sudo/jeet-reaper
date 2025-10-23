import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { WalletStats } from "@/types/paperhands";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: WalletStats;
}

export const ProfileModal = ({ open, onOpenChange, wallet }: ProfileModalProps) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <span className="text-lg font-bold">{wallet.address.slice(0, 2)}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">{wallet.ensName || wallet.address}</h3>
                <p className="text-sm text-muted-foreground">{wallet.handle}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tags and Bio */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {wallet.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            {wallet.bio && <p className="text-sm text-muted-foreground">{wallet.bio}</p>}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-2xl font-bold text-destructive">{wallet.paperhandsScore}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Regret</p>
              <p className="text-2xl font-bold text-destructive">
                ${wallet.totalRegret.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Events</p>
              <p className="text-2xl font-bold">{wallet.totalEvents}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold text-success">{wallet.winRate}%</p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="worst">Worst Paperhands</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="p-4">
                <h4 className="mb-4 font-semibold">Top Regretted Tokens</h4>
                <div className="space-y-2">
                  {wallet.topRegrettedTokens.map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-destructive">
                        -${token.regretAmount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="worst" className="space-y-3">
              {wallet.events
                .sort((a, b) => b.regretAmount - a.regretAmount)
                .slice(0, 5)
                .map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{event.tokenSymbol}</h4>
                        <p className="text-sm text-muted-foreground">{event.tokenName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-destructive">
                          -${event.regretAmount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.regretPercent}% regret
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {event.sellDate}
                      </span>
                      <a
                        href={event.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:underline"
                      >
                        View TX <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="trades" className="space-y-3">
              {wallet.events.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{event.tokenSymbol}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${event.buyPrice} → ${event.sellPrice}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-success">
                        +${event.realizedProfit.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Realized</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
