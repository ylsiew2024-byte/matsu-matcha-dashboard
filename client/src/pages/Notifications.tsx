import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  XCircle,
  Check,
  Trash2
} from "lucide-react";

const severityConfig: Record<string, { icon: any; color: string; bg: string }> = {
  critical: { 
    icon: XCircle, 
    color: "text-destructive", 
    bg: "bg-destructive/10 border-destructive/20" 
  },
  warning: { 
    icon: AlertTriangle, 
    color: "text-warning", 
    bg: "bg-warning/10 border-warning/20" 
  },
  info: { 
    icon: Info, 
    color: "text-blue-500", 
    bg: "bg-blue-500/10 border-blue-500/20" 
  },
  success: { 
    icon: CheckCircle2, 
    color: "text-green-500", 
    bg: "bg-green-500/10 border-green-500/20" 
  },
};

export default function Notifications() {
  const utils = trpc.useUtils();
  
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery({});
  
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });
  
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("All notifications marked as read");
    },
  });
  
  // Note: Delete functionality not yet implemented in backend

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground mt-1">
            System alerts and important updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <Card className="card-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No notifications</h3>
            <p className="text-muted-foreground text-sm mt-1">
              You're all caught up! New alerts will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = severityConfig[notification.severity || 'info'];
            const Icon = config.icon;
            
            return (
              <Card 
                key={notification.id} 
                className={`card-elegant transition-all ${!notification.isRead ? config.bg : 'opacity-75'}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`font-medium ${!notification.isRead ? '' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge 
                            variant={notification.severity === 'critical' ? 'destructive' : 'outline'}
                            className="capitalize"
                          >
                            {notification.severity}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markReadMutation.mutate({ id: notification.id })}
                              disabled={markReadMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notification Types Info */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-base">Notification Types</CardTitle>
          <CardDescription>Understanding alert severity levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-sm">Critical</p>
                <p className="text-xs text-muted-foreground">
                  Requires immediate attention. Stock depleted, major pricing issues.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-sm">Warning</p>
                <p className="text-xs text-muted-foreground">
                  Action recommended soon. Low stock, margin alerts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Info</p>
                <p className="text-xs text-muted-foreground">
                  General updates. New orders, system changes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Success</p>
                <p className="text-xs text-muted-foreground">
                  Positive confirmations. Order completed, goals met.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
