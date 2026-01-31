import { useState } from "react";
import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, AlertTriangle } from "lucide-react";

export function PanicScreen() {
  const { isPanicMode, deactivatePanicMode, isSessionExpired } = useSecurity();
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  
  if (!isPanicMode) return null;
  
  const handleUnlock = () => {
    if (confirmText.toLowerCase() === "unlock" || confirmText === user?.name?.toLowerCase()) {
      deactivatePanicMode();
      setConfirmText("");
    }
  };
  
  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            currentColor 20px,
            currentColor 21px
          )`
        }} />
      </div>
      
      <Card className="w-full max-w-md mx-4 border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">
            {isSessionExpired ? "Session Expired" : "Screen Locked"}
          </CardTitle>
          <CardDescription>
            {isSessionExpired 
              ? "Your session has timed out due to inactivity"
              : "Sensitive data is hidden for security"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500">CONFIDENTIAL System</p>
              <p className="text-muted-foreground mt-1">
                This is a secure B2B system. Unauthorized access is prohibited.
              </p>
            </div>
          </div>
          
          {/* User info */}
          {user && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Logged in as: <span className="font-medium text-foreground">{user.name || user.email}</span></p>
              <p className="text-xs mt-1">Role: {user.role}</p>
            </div>
          )}
          
          {/* Unlock form */}
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Type "<span className="font-mono font-medium">unlock</span>" to continue
            </p>
            <Input
              type="text"
              placeholder="Type 'unlock' to continue..."
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              className="text-center"
              autoFocus
            />
            <Button 
              onClick={handleUnlock} 
              className="w-full"
              disabled={confirmText.toLowerCase() !== "unlock" && confirmText.toLowerCase() !== user?.name?.toLowerCase()}
            >
              <Eye className="h-4 w-4 mr-2" />
              Unlock Screen
            </Button>
          </div>
          
          {/* Keyboard shortcut hint */}
          <p className="text-xs text-center text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl+Shift+L</kbd> to lock anytime
          </p>
        </CardContent>
      </Card>
      
      {/* Watermark */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground/50">
          MATSU MATCHA — CONFIDENTIAL B2B SYSTEM
        </p>
      </div>
    </div>
  );
}

export default PanicScreen;
