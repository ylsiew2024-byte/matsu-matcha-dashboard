import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Bot, Send, User, Sparkles, X, Minimize2, Maximize2,
  Lightbulb, ChevronRight
} from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export type AIContext = 
  | "clients" 
  | "suppliers" 
  | "products" 
  | "pricing" 
  | "inventory" 
  | "orders" 
  | "analytics"
  | "general";

interface AIAssistantProps {
  context: AIContext;
  contextData?: any;
  suggestedQuestions?: string[];
  className?: string;
  minimized?: boolean;
  onMinimize?: () => void;
}

const contextDescriptions: Record<AIContext, string> = {
  clients: "I can help you analyze client data, suggest pricing strategies, identify growth opportunities, and recommend client retention strategies.",
  suppliers: "I can help you evaluate suppliers, compare costs, analyze lead times, and suggest optimal ordering strategies.",
  products: "I can help you analyze product performance, suggest pricing adjustments, identify best-sellers, and recommend inventory levels.",
  pricing: "I can help you optimize pricing strategies, calculate margins, analyze profitability, and suggest competitive pricing.",
  inventory: "I can help you forecast demand, identify low stock items, suggest reorder quantities, and optimize inventory levels.",
  orders: "I can help you analyze order patterns, identify trends, suggest fulfillment optimizations, and forecast future orders.",
  analytics: "I can help you understand business metrics, identify trends, create reports, and provide actionable insights.",
  general: "I can help you with any questions about your matcha business operations.",
};

const defaultSuggestions: Record<AIContext, string[]> = {
  clients: [
    "Which clients have the highest profit margins?",
    "Suggest pricing strategies for my top clients",
    "Identify clients at risk of churning",
    "What products should I recommend to each client?",
  ],
  suppliers: [
    "Compare my suppliers by cost efficiency",
    "Which supplier has the best lead times?",
    "Suggest optimal order quantities per supplier",
    "Analyze supplier reliability and quality",
  ],
  products: [
    "Which products have the best margins?",
    "Suggest products to discontinue or promote",
    "Analyze seasonal product trends",
    "Recommend pricing adjustments for each product",
  ],
  pricing: [
    "What if I increase prices by 10%?",
    "Calculate optimal margins for each product",
    "Compare my pricing to market rates",
    "Suggest discount strategies for bulk orders",
  ],
  inventory: [
    "Which items need to be reordered soon?",
    "Forecast inventory levels for next 3 months",
    "Identify slow-moving inventory",
    "Suggest optimal stock levels per SKU",
  ],
  orders: [
    "Analyze order patterns by client",
    "Predict next month's order volume",
    "Identify peak ordering periods",
    "Suggest order fulfillment optimizations",
  ],
  analytics: [
    "Summarize this month's business performance",
    "What are my top growth opportunities?",
    "Compare this quarter to last quarter",
    "Identify areas for cost reduction",
  ],
  general: [
    "How is my business performing overall?",
    "What should I focus on this week?",
    "Identify my biggest challenges",
    "Suggest ways to increase profitability",
  ],
};

export function AIAssistant({ 
  context, 
  contextData, 
  suggestedQuestions,
  className,
  minimized: initialMinimized = true,
  onMinimize
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(!initialMinimized);
  const [message, setMessage] = useState("");
  const [sessionId] = useState(() => `${context}-${Date.now()}`);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: chatHistory, isLoading } = trpc.ai.contextChat.useQuery(
    { sessionId, context },
    { enabled: isOpen }
  );

  const utils = trpc.useUtils();

  const sendMutation = trpc.ai.contextChat.useMutation({
    onSuccess: () => {
      utils.ai.contextChat.invalidate();
      setMessage("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to get AI response");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate({ 
      message: message.trim(), 
      sessionId,
      context,
      contextData: contextData ? JSON.stringify(contextData) : undefined
    });
  };

  const handleSuggestion = (question: string) => {
    if (sendMutation.isPending) return;
    sendMutation.mutate({ 
      message: question, 
      sessionId,
      context,
      contextData: contextData ? JSON.stringify(contextData) : undefined
    });
  };

  const suggestions = suggestedQuestions || defaultSuggestions[context];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
          className
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col",
      "border-primary/20 bg-background/95 backdrop-blur",
      className
    )}>
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground capitalize">{context} Context</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setIsOpen(false);
                onMinimize?.();
              }}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 p-3" ref={scrollRef}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <Skeleton className="h-16 flex-1 rounded-lg" />
                </div>
              ))}
            </div>
          ) : !chatHistory || chatHistory.length === 0 ? (
            <div className="space-y-4">
              {/* Welcome message */}
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <p className="mb-2">👋 Hi! {contextDescriptions[context]}</p>
                  <p className="text-muted-foreground text-xs">Try one of these questions:</p>
                </div>
              </div>

              {/* Suggested questions */}
              <div className="space-y-2 pl-8">
                {suggestions.slice(0, 4).map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(question)}
                    disabled={sendMutation.isPending}
                    className="w-full text-left px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-xs flex items-center gap-2 group"
                  >
                    <Lightbulb className="h-3 w-3 text-primary shrink-0" />
                    <span className="flex-1">{question}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((msg: any, i: number) => (
                <div key={i} className={cn(
                  "flex gap-2",
                  msg.role === 'user' && "flex-row-reverse"
                )}>
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {msg.role === 'user' ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                  </div>
                  <div className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {msg.role === 'assistant' ? (
                      <Streamdown className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </Streamdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {sendMutation.isPending && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="p-3 border-t">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              disabled={sendMutation.isPending}
              className="flex-1 h-9 text-sm"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!message.trim() || sendMutation.isPending}
              className="h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline AI suggestion component for forms
interface AIInlineSuggestionProps {
  context: AIContext;
  prompt: string;
  onSuggestion?: (suggestion: string) => void;
  className?: string;
}

export function AIInlineSuggestion({ context, prompt, onSuggestion, className }: AIInlineSuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestion = trpc.ai.quickSuggestion.useMutation({
    onSuccess: (data) => {
      setSuggestion(data.suggestion);
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const handleGetSuggestion = () => {
    setIsLoading(true);
    getSuggestion.mutate({ context, prompt });
  };

  if (suggestion) {
    return (
      <div className={cn("flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20", className)}>
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="text-muted-foreground text-xs mb-1">AI Suggestion:</p>
          <p>{suggestion}</p>
          {onSuggestion && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={() => onSuggestion(suggestion)}
            >
              Apply suggestion
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setSuggestion(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGetSuggestion}
      disabled={isLoading}
      className={cn("gap-1 text-xs", className)}
    >
      <Sparkles className="h-3 w-3" />
      {isLoading ? "Thinking..." : "Get AI suggestion"}
    </Button>
  );
}

export default AIAssistant;
