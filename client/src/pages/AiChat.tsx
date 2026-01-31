import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Send, Bot, User, Sparkles, Lightbulb, TrendingUp, Package, 
  RefreshCw, BarChart3, Calculator, LineChart, PieChart,
  ArrowUpRight, ArrowDownRight, Zap
} from "lucide-react";
import { Streamdown } from "streamdown";
import {
  PricingScenarioChart,
  MarginComparisonChart,
  InventoryForecastChart,
  ProfitBreakdownChart,
} from "@/components/ScenarioVisualization";

const suggestedQuestions = [
  {
    icon: TrendingUp,
    question: "Which products have the highest profit margins?",
    category: "Profitability",
  },
  {
    icon: Package,
    question: "What products are running low on stock?",
    category: "Inventory",
  },
  {
    icon: Calculator,
    question: "What if I increase prices by 15%? Show me the margin impact.",
    category: "Scenario",
    isScenario: true,
  },
  {
    icon: LineChart,
    question: "Forecast my inventory levels for the next 6 months",
    category: "Forecast",
    isScenario: true,
  },
  {
    icon: BarChart3,
    question: "Compare margin opportunities across all my products",
    category: "Analysis",
    isScenario: true,
  },
  {
    icon: Sparkles,
    question: "Analyze my top 3 clients by revenue contribution",
    category: "Analytics",
  },
];

// Parse visualization data from AI response
function parseVisualization(content: string): { text: string; visualization: any | null } {
  const vizRegex = /<<<VISUALIZATION>>>([\s\S]*?)<<<VISUALIZATION>>>/;
  const match = content.match(vizRegex);
  
  if (match) {
    try {
      const vizJson = match[1].trim();
      const visualization = JSON.parse(vizJson);
      const text = content.replace(vizRegex, '').trim();
      return { text, visualization };
    } catch (e) {
      console.error('Failed to parse visualization:', e);
      return { text: content, visualization: null };
    }
  }
  
  return { text: content, visualization: null };
}

// Render visualization component based on type
function RenderVisualization({ data }: { data: any }) {
  if (!data || !data.type) return null;

  switch (data.type) {
    case 'pricing':
      return (
        <PricingScenarioChart
          currentPrice={data.data?.currentPrice || 100}
          currentMargin={data.data?.currentMargin || 30}
          currentVolume={data.data?.currentVolume || 1000}
          productName={data.data?.productName || "Matcha Product"}
          currency={data.data?.currency || "USD"}
        />
      );
    case 'margin':
    case 'comparison':
      return (
        <MarginComparisonChart
          products={data.data?.products || [
            { name: "Premium Ceremonial", currentMargin: 25, suggestedMargin: 35, revenue: 50000 },
            { name: "Culinary Grade", currentMargin: 20, suggestedMargin: 28, revenue: 35000 },
            { name: "Organic Blend", currentMargin: 30, suggestedMargin: 38, revenue: 25000 },
          ]}
        />
      );
    case 'forecast':
      return (
        <InventoryForecastChart
          data={data.data?.forecastData || [
            { month: "Feb", actual: 500, forecast: 500, reorderPoint: 200 },
            { month: "Mar", forecast: 420, reorderPoint: 200 },
            { month: "Apr", forecast: 340, reorderPoint: 200 },
            { month: "May", forecast: 260, reorderPoint: 200 },
            { month: "Jun", forecast: 180, reorderPoint: 200 },
            { month: "Jul", forecast: 100, reorderPoint: 200 },
          ]}
          productName={data.data?.productName || "Matcha Product"}
          unit={data.data?.unit || "kg"}
        />
      );
    case 'breakdown':
      return (
        <ProfitBreakdownChart
          data={data.data?.breakdown || [
            { category: "Premium Ceremonial", value: 25000, percentage: 40 },
            { category: "Culinary Grade", value: 18000, percentage: 29 },
            { category: "Organic Blend", value: 12000, percentage: 19 },
            { category: "Other", value: 7500, percentage: 12 },
          ]}
          title={data.title || "Profit Breakdown"}
          total={data.data?.total || 62500}
          currency={data.data?.currency || "USD"}
        />
      );
    default:
      return null;
  }
}

// Message component with visualization support
function ChatMessage({ msg }: { msg: any }) {
  const { text, visualization } = useMemo(() => {
    if (msg.role === 'assistant') {
      return parseVisualization(msg.content);
    }
    return { text: msg.content, visualization: null };
  }, [msg.content, msg.role]);

  return (
    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        msg.role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      }`}>
        {msg.role === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-lg px-4 py-2 ${
          msg.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}>
          {msg.role === 'assistant' ? (
            <Streamdown className="prose prose-sm dark:prose-invert max-w-none">
              {text}
            </Streamdown>
          ) : (
            <p className="text-sm">{text}</p>
          )}
        </div>
        
        {/* Render visualization if present */}
        {visualization && (
          <div className="mt-3">
            <RenderVisualization data={visualization} />
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(msg.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

export default function AiChat() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [message, setMessage] = useState("");
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [activeTab, setActiveTab] = useState("chat");
  
  const { data: chatHistory, isLoading } = trpc.ai.history.useQuery({ sessionId });
  
  const sendMutation = trpc.ai.chat.useMutation({
    onSuccess: () => {
      utils.ai.history.invalidate();
      setMessage("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate({ message: message.trim(), sessionId });
  };

  const handleSuggestedQuestion = (question: string) => {
    if (sendMutation.isPending) return;
    sendMutation.mutate({ message: question, sessionId });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Business Assistant
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/30">
              <Zap className="h-3 w-3 mr-1" />
              Enhanced
            </Badge>
          </h2>
          <p className="text-muted-foreground mt-1">
            Ask questions and get real-time visualizations for what-if scenarios
          </p>
        </div>
      </div>

      <div className="flex-1 grid gap-4 lg:grid-cols-[1fr,320px] min-h-0">
        {/* Chat Area */}
        <Card className="card-elegant flex flex-col min-h-0">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-20 flex-1 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : !chatHistory || chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
                  <p className="text-muted-foreground text-sm max-w-md mb-6">
                    Ask me anything about your matcha business. Try a what-if scenario 
                    to see interactive visualizations!
                  </p>
                  
                  {/* Quick scenario buttons */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSuggestedQuestion("What if I increase prices by 10%? Show me the impact analysis.")}
                      className="bg-primary/5 border-primary/20 hover:bg-primary/10"
                    >
                      <Calculator className="h-3 w-3 mr-1" />
                      Price Impact
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSuggestedQuestion("Forecast my inventory for the next 6 months")}
                      className="bg-primary/5 border-primary/20 hover:bg-primary/10"
                    >
                      <LineChart className="h-3 w-3 mr-1" />
                      Inventory Forecast
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSuggestedQuestion("Compare margin opportunities across all products")}
                      className="bg-primary/5 border-primary/20 hover:bg-primary/10"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Margin Analysis
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSuggestedQuestion("Show me a breakdown of profit by product category")}
                      className="bg-primary/5 border-primary/20 hover:bg-primary/10"
                    >
                      <PieChart className="h-3 w-3 mr-1" />
                      Profit Breakdown
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg: any) => (
                    <ChatMessage key={msg.id} msg={msg} />
                  ))}
                  
                  {/* Typing indicator */}
                  {sendMutation.isPending && (
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">Analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-muted/30">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about pricing, inventory, or try 'What if I increase prices by 15%?'"
                  disabled={sendMutation.isPending}
                  className="flex-1 bg-background"
                />
                <Button type="submit" disabled={!message.trim() || sendMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                💡 Try asking what-if questions to see interactive charts and visualizations
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Suggestions */}
        <div className="space-y-4">
          <Card className="card-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Scenario Questions
              </CardTitle>
              <CardDescription className="text-xs">
                These generate interactive visualizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.filter(q => q.isScenario).map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(item.question)}
                  disabled={sendMutation.isPending}
                  className="w-full text-left p-3 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-2">
                    <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm">{item.question}</p>
                      <Badge variant="outline" className="mt-2 text-xs bg-primary/10 border-primary/30">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Quick Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.filter(q => !q.isScenario).map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(item.question)}
                  disabled={sendMutation.isPending}
                  className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-2">
                    <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm">{item.question}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="card-elegant bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Enhanced AI</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask what-if questions to see real-time visualizations with 
                    interactive charts. Adjust parameters directly in the charts!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visualization Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span>Pricing scenario with slider</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>Margin comparison charts</span>
              </div>
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                <span>Inventory forecasts</span>
              </div>
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <span>Profit breakdowns</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
