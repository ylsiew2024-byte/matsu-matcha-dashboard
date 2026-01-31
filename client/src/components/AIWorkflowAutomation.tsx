import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Bot, Sparkles, Zap, Clock, Play, Pause, Settings,
  Package, DollarSign, Users, Truck, AlertTriangle,
  CheckCircle2, RefreshCw, Calendar, ArrowRight,
  Bell, TrendingUp, ShoppingCart, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  trigger: "schedule" | "event" | "threshold";
  triggerConfig: {
    schedule?: string;
    event?: string;
    threshold?: { field: string; operator: string; value: number };
  };
  actions: string[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface WorkflowLog {
  id: string;
  workflowId: string;
  timestamp: Date;
  status: "success" | "failed" | "skipped";
  message: string;
}

export function AIWorkflowAutomation() {
  const [isOpen, setIsOpen] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "daily_inventory_check",
      name: "Daily Inventory Check",
      description: "Automatically check inventory levels and alert on low stock",
      icon: Package,
      trigger: "schedule",
      triggerConfig: { schedule: "0 9 * * *" }, // 9 AM daily
      actions: ["check_stock_levels", "send_low_stock_alerts", "generate_reorder_suggestions"],
      enabled: true,
      lastRun: new Date(Date.now() - 86400000),
      nextRun: new Date(Date.now() + 43200000),
    },
    {
      id: "price_optimization",
      name: "Weekly Price Review",
      description: "AI analyzes pricing and suggests optimizations",
      icon: DollarSign,
      trigger: "schedule",
      triggerConfig: { schedule: "0 10 * * 1" }, // Monday 10 AM
      actions: ["analyze_margins", "compare_market_prices", "suggest_adjustments"],
      enabled: true,
      lastRun: new Date(Date.now() - 604800000),
      nextRun: new Date(Date.now() + 259200000),
    },
    {
      id: "new_order_processing",
      name: "Auto-Process New Orders",
      description: "Automatically validate and process incoming orders",
      icon: ShoppingCart,
      trigger: "event",
      triggerConfig: { event: "order.created" },
      actions: ["validate_order", "check_inventory", "confirm_order"],
      enabled: false,
    },
    {
      id: "low_stock_alert",
      name: "Low Stock Alert",
      description: "Trigger alert when stock falls below threshold",
      icon: AlertTriangle,
      trigger: "threshold",
      triggerConfig: { threshold: { field: "stock_level", operator: "less_than", value: 10 } },
      actions: ["send_alert", "create_reorder_task", "notify_supplier"],
      enabled: true,
    },
    {
      id: "client_engagement",
      name: "Client Engagement Analysis",
      description: "Monthly analysis of client activity and engagement",
      icon: Users,
      trigger: "schedule",
      triggerConfig: { schedule: "0 9 1 * *" }, // 1st of month
      actions: ["analyze_client_activity", "identify_at_risk", "suggest_outreach"],
      enabled: true,
      lastRun: new Date(Date.now() - 2592000000),
      nextRun: new Date(Date.now() + 864000000),
    },
    {
      id: "demand_forecast",
      name: "Demand Forecasting",
      description: "AI predicts demand for the upcoming month",
      icon: TrendingUp,
      trigger: "schedule",
      triggerConfig: { schedule: "0 8 25 * *" }, // 25th of month
      actions: ["analyze_trends", "predict_demand", "update_forecasts"],
      enabled: true,
    },
  ]);

  const [logs, setLogs] = useState<WorkflowLog[]>([
    {
      id: "1",
      workflowId: "daily_inventory_check",
      timestamp: new Date(Date.now() - 86400000),
      status: "success",
      message: "Checked 24 products, 3 low stock alerts generated",
    },
    {
      id: "2",
      workflowId: "low_stock_alert",
      timestamp: new Date(Date.now() - 172800000),
      status: "success",
      message: "Alert sent for Ceremonial Grade Matcha",
    },
    {
      id: "3",
      workflowId: "price_optimization",
      timestamp: new Date(Date.now() - 604800000),
      status: "success",
      message: "Analyzed 18 products, 5 price adjustments suggested",
    },
  ]);

  const bulkRecommendations = trpc.ai.bulkRecommendations.useMutation();

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, enabled: !w.enabled } : w
    ));
    const workflow = workflows.find(w => w.id === workflowId);
    toast.success(`${workflow?.name} ${workflow?.enabled ? 'disabled' : 'enabled'}`);
  };

  const runWorkflowNow = async (workflow: Workflow) => {
    toast.info(`Running ${workflow.name}...`);
    
    try {
      // Simulate workflow execution
      await bulkRecommendations.mutateAsync({ 
        type: workflow.id.includes('inventory') ? 'inventory_reorder' : 
              workflow.id.includes('price') ? 'pricing_optimization' :
              workflow.id.includes('client') ? 'client_upsell' : 'general'
      });

      // Add log entry
      const newLog: WorkflowLog = {
        id: Date.now().toString(),
        workflowId: workflow.id,
        timestamp: new Date(),
        status: "success",
        message: `Workflow executed successfully`,
      };
      setLogs(prev => [newLog, ...prev]);

      // Update last run
      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id ? { ...w, lastRun: new Date() } : w
      ));

      toast.success(`${workflow.name} completed successfully`);
    } catch (error) {
      toast.error(`${workflow.name} failed`);
    }
  };

  const getTriggerLabel = (workflow: Workflow) => {
    switch (workflow.trigger) {
      case "schedule":
        return workflow.triggerConfig.schedule;
      case "event":
        return workflow.triggerConfig.event;
      case "threshold":
        const t = workflow.triggerConfig.threshold;
        return `${t?.field} ${t?.operator} ${t?.value}`;
      default:
        return "Unknown";
    }
  };

  const getTriggerBadge = (trigger: string) => {
    switch (trigger) {
      case "schedule":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600"><Clock className="h-3 w-3 mr-1" />Schedule</Badge>;
      case "event":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><Zap className="h-3 w-3 mr-1" />Event</Badge>;
      case "threshold":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Threshold</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <Settings className="h-3 w-3" />
        Automations
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              AI Workflow Automation
            </DialogTitle>
            <DialogDescription>
              Configure automated workflows to reduce manual tasks
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-5 gap-4 mt-4">
            {/* Workflows List */}
            <div className="col-span-3 space-y-4 overflow-y-auto pr-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Active Workflows
              </h3>
              
              <div className="space-y-3">
                {workflows.map((workflow) => {
                  const Icon = workflow.icon;
                  return (
                    <Card key={workflow.id} className={cn(
                      "transition-all",
                      !workflow.enabled && "opacity-60"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            workflow.enabled ? "bg-primary/10" : "bg-muted"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5",
                              workflow.enabled ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{workflow.name}</h4>
                              <Switch
                                checked={workflow.enabled}
                                onCheckedChange={() => toggleWorkflow(workflow.id)}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {workflow.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {getTriggerBadge(workflow.trigger)}
                              <span className="text-xs text-muted-foreground font-mono">
                                {getTriggerLabel(workflow)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="text-xs text-muted-foreground">
                                {workflow.lastRun && (
                                  <span>Last: {formatDate(workflow.lastRun)}</span>
                                )}
                                {workflow.nextRun && workflow.enabled && (
                                  <span className="ml-3">Next: {formatDate(workflow.nextRun)}</span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => runWorkflowNow(workflow)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Run Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Activity Log */}
            <div className="col-span-2 space-y-4 overflow-y-auto pl-2 border-l">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Activity
              </h3>
              
              <div className="space-y-2">
                {logs.map((log) => {
                  const workflow = workflows.find(w => w.id === log.workflowId);
                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "p-3 rounded-lg border text-xs",
                        log.status === "success" && "border-green-500/20 bg-green-500/5",
                        log.status === "failed" && "border-red-500/20 bg-red-500/5",
                        log.status === "skipped" && "border-yellow-500/20 bg-yellow-500/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{workflow?.name}</span>
                        {log.status === "success" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        {log.status === "failed" && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </div>
                      <p className="text-muted-foreground mt-1">{log.message}</p>
                      <p className="text-muted-foreground/70 mt-1">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {workflows.filter(w => w.enabled).length}
                </p>
                <p className="text-xs text-muted-foreground">Active Workflows</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(l => l.status === "success").length}
                </p>
                <p className="text-xs text-muted-foreground">Successful Runs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {workflows.filter(w => w.trigger === "threshold").length}
                </p>
                <p className="text-xs text-muted-foreground">Alert Rules</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ~{workflows.filter(w => w.enabled).length * 5}h
                </p>
                <p className="text-xs text-muted-foreground">Time Saved/Month</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AIWorkflowAutomation;
