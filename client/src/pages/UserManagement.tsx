import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  Shield, 
  Search, 
  UserCog, 
  Building2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Crown,
  Briefcase,
  HardHat,
  User
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

type UserRole = "super_admin" | "manager" | "employee" | "business_client";

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  super_admin: {
    label: "Super Admin",
    icon: <Crown className="h-4 w-4" />,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "Unrestricted access to all features, user management, and system settings"
  },
  manager: {
    label: "Manager",
    icon: <Briefcase className="h-4 w-4" />,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "Access to operational data, financial reports, and staff management"
  },
  employee: {
    label: "Employee",
    icon: <HardHat className="h-4 w-4" />,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Inventory view/update and order creation/processing only"
  },
  business_client: {
    label: "Business Client",
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "View-only dashboard with AI predictions for their account"
  }
};

export default function UserManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<{
    id: number;
    name: string | null;
    email: string | null;
    role: UserRole;
    linkedClientId: number | null;
  } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("employee");
  const [newLinkedClientId, setNewLinkedClientId] = useState<string>("");

  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery({});
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      refetch();
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    }
  });

  // Check if current user is Super Admin
  if (user?.role !== "super_admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Only Super Admins can access User Management.</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredUsers = users?.filter((u: any) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const handleEditUser = (u: any) => {
    setEditingUser(u);
    setNewRole(u.role);
    setNewLinkedClientId(u.linkedClientId?.toString() || "");
  };

  const handleSaveRole = () => {
    if (!editingUser) return;
    
    updateRoleMutation.mutate({
      userId: editingUser.id,
      role: newRole,
      linkedClientId: newRole === "business_client" && newLinkedClientId 
        ? parseInt(newLinkedClientId) 
        : undefined
    });
  };

  const getRoleBadge = (role: UserRole) => {
    const config = ROLE_CONFIG[role];
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage user roles and permissions for the Matsu Matcha system
            </p>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 px-3 py-1">
            <Shield className="h-4 w-4 mr-2" />
            Super Admin Only
          </Badge>
        </div>

        {/* Role Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, config]) => {
            const count = users?.filter((u: any) => u.role === role).length || 0;
            return (
              <Card key={role} className="bg-card/50 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {config.icon}
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {config.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="role-filter">Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="business_client">Business Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              All Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Click on a user to edit their role and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>No users found matching your criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Linked Client</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: any) => (
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{u.name || "Unnamed User"}</div>
                            <div className="text-xs text-muted-foreground">ID: {u.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email || "No email"}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(u.role)}
                      </TableCell>
                      <TableCell>
                        {u.linkedClientId ? (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
                            <Building2 className="h-3 w-3 mr-1" />
                            Client #{u.linkedClientId}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.lastSignedIn 
                          ? new Date(u.lastSignedIn).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(u)}
                          disabled={u.id === user?.id}
                        >
                          <UserCog className="h-4 w-4 mr-1" />
                          Edit Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Edit User Role
              </DialogTitle>
              <DialogDescription>
                Change the role and permissions for {editingUser?.name || "this user"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Current User</Label>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="font-medium">{editingUser?.name || "Unnamed User"}</div>
                  <div className="text-sm text-muted-foreground">{editingUser?.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-role">New Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, config]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ROLE_CONFIG[newRole].description}
                </p>
              </div>

              {newRole === "business_client" && (
                <div className="space-y-2">
                  <Label htmlFor="linked-client">Link to Client Account</Label>
                  <Select value={newLinkedClientId} onValueChange={setNewLinkedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No linked client</SelectItem>
                      {clients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Business clients will only see data related to their linked account
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-500">Security Notice</div>
                    <p className="text-sm text-muted-foreground">
                      Role changes take effect immediately. The user will gain or lose access to features based on their new role.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRole}
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
