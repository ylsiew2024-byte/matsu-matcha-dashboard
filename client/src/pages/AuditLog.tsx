import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History, Search, Filter, Eye, Shield, User, Clock } from "lucide-react";

const actionColors: Record<string, string> = {
  create: "bg-green-500/10 text-green-600 border-green-500/20",
  update: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  delete: "bg-red-500/10 text-red-600 border-red-500/20",
  login: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  logout: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  view: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

const entityIcons: Record<string, string> = {
  client: "👥",
  supplier: "🚚",
  sku: "📦",
  pricing: "💰",
  inventory: "📊",
  order: "📋",
  user: "👤",
};

export default function AuditLog() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  const { data: auditLogs, isLoading } = trpc.auditLogs.list.useQuery({
    entityType: entityFilter !== 'all' ? entityFilter : undefined,
  });
  const { data: users } = trpc.users.list.useQuery();

  const getUserName = (userId: number) => {
    const foundUser = users?.find((u: any) => u.id === userId);
    return foundUser?.name || `User #${userId}`;
  };

  const filteredLogs = auditLogs?.filter((log: any) => {
    if (!searchQuery) return true;
    const userName = getUserName(log.userId).toLowerCase();
    const entityType = log.entityType?.toLowerCase() || '';
    const action = log.action?.toLowerCase() || '';
    return userName.includes(searchQuery.toLowerCase()) ||
           entityType.includes(searchQuery.toLowerCase()) ||
           action.includes(searchQuery.toLowerCase());
  });

  const formatChanges = (changes: string | null) => {
    if (!changes) return null;
    try {
      return JSON.parse(changes);
    } catch {
      return changes;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Audit Log
          </h2>
          <p className="text-muted-foreground mt-1">
            Complete history of all system actions
          </p>
        </div>
        <Badge variant="outline" className="w-fit flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {isAdmin ? "Full Access" : "Read Only"}
        </Badge>
      </div>

      {/* Filters */}
      <Card className="card-elegant">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, entity, or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
                <SelectItem value="sku">Products</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Creates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {auditLogs?.filter((l: any) => l.action === 'create').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {auditLogs?.filter((l: any) => l.action === 'update').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deletes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {auditLogs?.filter((l: any) => l.action === 'delete').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
          <CardDescription>Detailed log of all system changes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No audit logs found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || actionFilter !== 'all' || entityFilter !== 'all' 
                  ? "Try adjusting your filters" 
                  : "Actions will be logged as you use the system"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-center">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getUserName(log.userId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={actionColors[log.action || ''] || ''}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{entityIcons[log.entityType || ''] || '📄'}</span>
                        <span className="capitalize">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-muted-foreground">#{log.entityId}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {log.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this action
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{getUserName(selectedLog.userId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Action</p>
                  <Badge variant="outline" className={actionColors[selectedLog.action || ''] || ''}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity</p>
                  <p className="font-medium capitalize">
                    {selectedLog.entityType} #{selectedLog.entityId}
                  </p>
                </div>
              </div>
              
              {selectedLog.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedLog.description}</p>
                </div>
              )}
              
              {selectedLog.previousData && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Previous Data</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-[200px]">
                    {JSON.stringify(formatChanges(selectedLog.previousData), null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.newData && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">New Data</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-[200px]">
                    {JSON.stringify(formatChanges(selectedLog.newData), null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.ipAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
