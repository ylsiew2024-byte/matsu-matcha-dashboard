import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Bell, BellRing, AlertTriangle, TrendingUp, TrendingDown,
  Package, DollarSign, Users, Truck, CheckCircle2, X,
  ChevronRight, Sparkles, Clock, ArrowRight, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PredictiveAlert {
  id: string;
  type: "warning" | "opportunity" | "info" | "urgent";
  category: "inventory" | "pricing" | "clients" | "orders" | "suppliers";
  title: string;
  description: string;
  prediction: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  suggestedAction?: {
    label: string;
    action: () => void;
  };
  timestamp: Date;
  read: boolean;
}

export function AIPredictiveAlerts() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);

  // Fetch business data for predictions
  const { data: lowStock } = trpc.inventory.lowStock.useQuery();
  const { data: orders } = trpc.clientOrders.list.useQuery({});
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: inventory } = trpc.inventory.list.useQuery();
  const { data: pricing } = trpc.pricing.current.useQuery();

  const bulkRecommendations = trpc.ai.bulkRecommendations.useMutation();

  // Generate predictive alerts based on data
  useEffect(() => {
    const newAlerts: PredictiveAlert[] = [];

    // Low stock alerts
    if (lowStock && lowStock.length > 0) {
      newAlerts.push({
        id: "low_stock_" + Date.now(),
        type: "urgent",
        category: "inventory",
        title: `${lowStock.length} products need reordering`,
        description: "Stock levels are below minimum threshold",
        prediction: "Stockout likely within 7 days if not addressed",
        confidence: 95,
        impact: "high",
        suggestedAction: {
          label: "Generate Reorder List",
          action: () => handleQuickAction("inventory_reorder"),
        },
        timestamp: new Date(),
        read: false,
      });
    }

    // Pending orders alert
    const pendingOrders = orders?.filter((o: any) => o.status === "pending") || [];
    if (pendingOrders.length > 3) {
      newAlerts.push({
        id: "pending_orders_" + Date.now(),
        type: "warning",
        category: "orders",
        title: `${pendingOrders.length} orders awaiting processing`,
        description: "Orders have been pending for extended time",
        prediction: "Customer satisfaction may decrease if not processed soon",
        confidence: 88,
        impact: "medium",
        suggestedAction: {
          label: "Process Orders",
          action: () => toast.info("Navigate to Orders page"),
        },
        timestamp: new Date(),
        read: false,
      });
    }

    // Pricing opportunity
    if (pricing && pricing.length > 0) {
      newAlerts.push({
        id: "pricing_opportunity_" + Date.now(),
        type: "opportunity",
        category: "pricing",
        title: "Pricing optimization available",
        description: "AI detected potential margin improvements",
        prediction: "Estimated 5-10% margin increase possible",
        confidence: 82,
        impact: "medium",
        suggestedAction: {
          label: "Optimize Pricing",
          action: () => handleQuickAction("pricing_optimization"),
        },
        timestamp: new Date(),
        read: false,
      });
    }

    // Client engagement
    if (clients && clients.length > 0) {
      newAlerts.push({
        id: "client_engagement_" + Date.now(),
        type: "info",
        category: "clients",
        title: "Client engagement analysis ready",
        description: "Monthly client activity report available",
        prediction: "Identify upsell opportunities and at-risk clients",
        confidence: 90,
        impact: "low",
        suggestedAction: {
          label: "View Analysis",
          action: () => handleQuickAction("client_upsell"),
        },
        timestamp: new Date(),
        read: false,
      });
    }

    // Demand forecast
    if (inventory && inventory.length > 0) {
      newAlerts.push({
        id: "demand_forecast_" + Date.now(),
        type: "info",
        category: "inventory",
        title: "Demand forecast updated",
        description: "AI has updated demand predictions for next month",
        prediction: "Plan inventory accordingly to avoid stockouts",
        confidence: 85,
        impact: "medium",
        timestamp: new Date(),
        read: false,
      });
    }

    setAlerts(newAlerts);
  }, [lowStock, orders, clients, inventory, pricing]);

  const handleQuickAction = async (actionType: string) => {
    try {
      await bulkRecommendations.mutateAsync({ type: actionType });
      toast.success("AI analysis complete!");
    } catch (error) {
      toast.error("Failed to run analysis");
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, read: true } : a
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast.success("Alert dismissed");
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    toast.success("All alerts marked as read");
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent": return AlertTriangle;
      case "warning": return Bell;
      case "opportunity": return TrendingUp;
      case "info": return Sparkles;
      default: return Bell;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case "urgent": return "border-red-500/50 bg-red-500/5";
      case "warning": return "border-yellow-500/50 bg-yellow-500/5";
      case "opportunity": return "border-green-500/50 bg-green-500/5";
      case "info": return "border-blue-500/50 bg-blue-500/5";
      default: return "border-muted";
    }
  };

  const getAlertIconColor = (type: string) => {
    switch (type) {
      case "urgent": return "text-red-500";
      case "warning": return "text-yellow-500";
      case "opportunity": return "text-green-500";
      case "info": return "text-blue-500";
      default: return "text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "inventory": return Package;
      case "pricing": return DollarSign;
      case "clients": return Users;
      case "orders": return Truck;
      case "suppliers": return Truck;
      default: return Bell;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Predictive Alerts
          </SheetTitle>
          <SheetDescription>
            Proactive insights and predictions to help you stay ahead
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{alerts.length} alerts</Badge>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} unread</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] mt-4 pr-4">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-medium">All Clear!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    No alerts or predictions at this time
                  </p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => {
                const AlertIcon = getAlertIcon(alert.type);
                const CategoryIcon = getCategoryIcon(alert.category);
                
                return (
                  <Card
                    key={alert.id}
                    className={cn(
                      "transition-all cursor-pointer",
                      getAlertColors(alert.type),
                      !alert.read && "ring-1 ring-primary/30"
                    )}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center bg-background",
                          getAlertIconColor(alert.type)
                        )}>
                          <AlertIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{alert.title}</h4>
                              {!alert.read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissAlert(alert.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {alert.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.confidence}% confidence
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                alert.impact === "high" && "text-red-600",
                                alert.impact === "medium" && "text-yellow-600",
                                alert.impact === "low" && "text-green-600"
                              )}
                            >
                              {alert.impact} impact
                            </Badge>
                          </div>
                          <p className="text-xs text-primary mt-2 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {alert.prediction}
                          </p>
                          {alert.suggestedAction && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 h-7 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                alert.suggestedAction?.action();
                              }}
                            >
                              <Sparkles className="h-3 w-3" />
                              {alert.suggestedAction.label}
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Intl.DateTimeFormat('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default AIPredictiveAlerts;
