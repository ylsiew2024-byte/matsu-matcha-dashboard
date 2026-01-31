import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  Users, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  BarChart3
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: suppliers, isLoading: loadingSuppliers } = trpc.suppliers.list.useQuery({});
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery({});
  const { data: skus, isLoading: loadingSkus } = trpc.skus.list.useQuery({});
  const { data: inventory, isLoading: loadingInventory } = trpc.inventory.list.useQuery();
  const { data: lowStock, isLoading: loadingLowStock } = trpc.inventory.lowStock.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery({ unreadOnly: true });

  const isLoading = loadingSuppliers || loadingClients || loadingSkus || loadingInventory;

  // Calculate total inventory value (simplified)
  const totalInventoryKg = inventory?.reduce((sum, inv) => sum + Number(inv.totalStockKg || 0), 0) || 0;
  const allocatedKg = inventory?.reduce((sum, inv) => sum + Number(inv.allocatedStockKg || 0), 0) || 0;
  const unallocatedKg = totalInventoryKg - allocatedKg;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h2>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your matcha trading operations
          </p>
        </div>
        <Badge variant="outline" className="w-fit capitalize">
          {user?.role?.replace('_', ' ')} Access
        </Badge>
      </div>

      {/* Alert Banner */}
      {(lowStock?.length || 0) > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Low Stock Alert</p>
              <p className="text-sm text-muted-foreground">
                {lowStock?.length} product{lowStock?.length !== 1 ? 's' : ''} below threshold
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation('/inventory')}>
              View Inventory
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Suppliers
            </CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingSuppliers ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Active Japanese suppliers
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingClients ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{clients?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              B2B café clients
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matcha SKUs
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingSkus ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{skus?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Product varieties
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inventory
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingInventory ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalInventoryKg.toFixed(1)} kg</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {unallocatedKg.toFixed(1)} kg unallocated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={() => setLocation('/clients')}
            >
              <Users className="mr-3 h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="font-medium">Manage Clients</div>
                <div className="text-xs text-muted-foreground">Add or edit client information</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={() => setLocation('/products')}
            >
              <Package className="mr-3 h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="font-medium">Product Catalog</div>
                <div className="text-xs text-muted-foreground">View and manage matcha SKUs</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={() => setLocation('/pricing')}
            >
              <DollarSign className="mr-3 h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="font-medium">Update Pricing</div>
                <div className="text-xs text-muted-foreground">Manage costs and selling prices</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-3"
              onClick={() => setLocation('/ai-chat')}
            >
              <TrendingUp className="mr-3 h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="font-medium">AI Business Assistant</div>
                <div className="text-xs text-muted-foreground">Get insights and recommendations</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-lg font-display">Inventory Status</CardTitle>
            <CardDescription>Stock levels and allocation</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInventory || loadingLowStock ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : inventory?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No inventory data yet</p>
                <p className="text-sm">Add products to start tracking inventory</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Inventory Summary Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Allocation</span>
                    <span className="font-medium">
                      {totalInventoryKg > 0 ? ((allocatedKg / totalInventoryKg) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${totalInventoryKg > 0 ? (allocatedKg / totalInventoryKg) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Allocated: {allocatedKg.toFixed(1)} kg</span>
                    <span>Available: {unallocatedKg.toFixed(1)} kg</span>
                  </div>
                </div>

                {/* Low Stock Items */}
                {(lowStock?.length || 0) > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Low Stock Items
                    </h4>
                    <div className="space-y-2">
                      {lowStock?.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-warning/5">
                          <span className="text-sm">SKU #{item.skuId}</span>
                          <Badge variant="outline" className="text-warning border-warning/50">
                            {(Number(item.totalStockKg) - Number(item.allocatedStockKg)).toFixed(1)} kg left
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setLocation('/inventory')}
                >
                  View Full Inventory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications Preview */}
      {(notifications?.length || 0) > 0 && (
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-display">Recent Alerts</CardTitle>
              <CardDescription>Notifications requiring attention</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/notifications')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications?.slice(0, 3).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    notification.severity === 'critical' ? 'bg-destructive/5' :
                    notification.severity === 'warning' ? 'bg-warning/5' : 'bg-muted/50'
                  }`}
                >
                  <div className={`mt-0.5 ${
                    notification.severity === 'critical' ? 'text-destructive' :
                    notification.severity === 'warning' ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                  </div>
                  <Badge 
                    variant={notification.severity === 'critical' ? 'destructive' : 'outline'}
                    className="shrink-0"
                  >
                    {notification.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
