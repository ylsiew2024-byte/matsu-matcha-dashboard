import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, User, Shield, Bell, Database, Lock, Info } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage your account and system preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="outline" className="capitalize mt-1">
                {user?.role?.replace('_', ' ') || 'User'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Sign In</p>
              <p className="font-medium">
                {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security
          </CardTitle>
          <CardDescription>Account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Authentication</p>
                <p className="text-sm text-muted-foreground">Managed via Manus OAuth</p>
              </div>
            </div>
            <Badge variant="outline" className="text-primary">Secure</Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">End your current session</p>
            </div>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Role Permissions
          </CardTitle>
          <CardDescription>Access levels for different roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Admin</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access to all features including user management, pricing, and system settings.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Operations</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage clients, suppliers, products, inventory, and orders. Cannot modify pricing or user roles.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Finance</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                View and manage pricing, costs, and financial analytics. Read-only access to operational data.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">View Only</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Read-only access to all data. Cannot create, update, or delete any records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Platform</p>
              <p className="font-medium">Matsu Matcha B2B Dashboard</p>
            </div>
            <div>
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Encryption</p>
              <Badge variant="outline" className="text-primary">Enabled</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Audit Logging</p>
              <Badge variant="outline" className="text-primary">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidential Notice */}
      <Card className="card-elegant border-destructive/20 bg-destructive/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Confidential Business System</p>
              <p className="text-sm text-muted-foreground mt-1">
                This system contains sensitive B2B pricing, supplier relationships, and business intelligence data. 
                All access is logged and monitored. Unauthorized disclosure is strictly prohibited.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
