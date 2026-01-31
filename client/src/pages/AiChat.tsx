import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Bot, User, Sparkles, Lightbulb, TrendingUp, Package, RefreshCw } from "lucide-react";
import { Streamdown } from "streamdown";

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
    icon: Lightbulb,
    question: "Suggest higher-margin alternatives for my low-performing products",
    category: "Recommendations",
  },
  {
    icon: Sparkles,
    question: "Analyze my top 3 clients by revenue contribution",
    category: "Analytics",
  },
];

export default function AiChat() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [message, setMessage] = useState("");
  const [sessionId] = useState(() => `session-${Date.now()}`);
  
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
          </h2>
          <p className="text-muted-foreground mt-1">
            Ask questions about your matcha business
          </p>
        </div>
        
      </div>

      <div className="flex-1 grid gap-4 lg:grid-cols-[1fr,300px] min-h-0">
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
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Ask me anything about your matcha business - pricing analysis, 
                    inventory insights, profitability recommendations, and more.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
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
                      <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <Streamdown className="prose prose-sm dark:prose-invert max-w-none">
                              {msg.content}
                            </Streamdown>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing indicator */}
                  {sendMutation.isPending && (
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about pricing, inventory, profitability..."
                  disabled={sendMutation.isPending}
                  className="flex-1"
                />
                <Button type="submit" disabled={!message.trim() || sendMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Suggestions */}
        <div className="space-y-4">
          <Card className="card-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Suggested Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(item.question)}
                  className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
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

          <Card className="card-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Analyze profitability by product, supplier, or client</p>
              <p>• Suggest higher-margin alternatives</p>
              <p>• Review inventory status and reorder needs</p>
              <p>• Calculate pricing scenarios</p>
              <p>• Explain margin impact of changes</p>
              <p>• Answer business model questions</p>
            </CardContent>
          </Card>

          <Card className="card-elegant bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Pro Tip</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Be specific in your questions for better insights. 
                    Include product names, time periods, or specific metrics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
