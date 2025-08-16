import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download, UserX, Shield, AlertTriangle } from "lucide-react";
import UserList from "./user-management/UserList";
import UserDetailsModal from "./user-management/UserDetailsModal";
import BulkActionsModal from "./user-management/BulkActionsModal";
import GrantAccessModal from "./user-management/GrantAccessModal";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  created_at: string;
  avatar_url?: string;
  bio?: string;
  stats?: {
    games_played: number;
    total_score: number;
    correct_answers: number;
  };
  purchase_count?: number;
  last_activity?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showGrantAccess, setShowGrantAccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users first
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      if (!usersData) {
        console.log('No users found');
        setUsers([]);
        return;
      }

      // Fetch user stats separately for each user
      const usersWithStats = await Promise.all(
        usersData.map(async (user) => {
          // Fetch user stats
          const { data: statsData } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

          // Fetch purchase count
          const { count: purchaseCount } = await supabase
            .from('user_game_purchases')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return {
            ...user,
            stats: statsData || {
              games_played: 0,
              total_score: 0,
              correct_answers: 0
            },
            purchase_count: purchaseCount || 0,
          } as User;
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('log_admin_action', {
          p_admin_id: user.id,
          p_action_type: 'delete_user',
          p_target_type: 'user',
          p_target_id: userId,
        });
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.stats && user.stats.games_played > 0).length;
  const purchasingUsers = users.filter(user => user.purchase_count && user.purchase_count > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchasing Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchasingUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setShowGrantAccess(true)}
                disabled={selectedUsers.length === 0}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Grant Access
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkActions(true)}
                disabled={selectedUsers.length === 0}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Bulk Actions
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implement export functionality
                  toast({
                    title: "Export",
                    description: "Export functionality coming soon",
                  });
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email, username, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                  className="text-blue-700 hover:text-blue-900"
                >
                  Clear selection
                </Button>
              </div>
            </div>
          )}

          <UserList
            users={paginatedUsers}
            loading={loading}
            selectedUsers={selectedUsers}
            onUserSelect={handleUserSelect}
            onSelectAll={handleSelectAll}
            onUserClick={(user) => {
              setSelectedUser(user);
              setShowUserDetails(true);
            }}
            onDeleteUser={handleDeleteUser}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          open={showUserDetails}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onUserUpdated={fetchUsers}
        />
      )}

      {showBulkActions && (
        <BulkActionsModal
          selectedUserIds={selectedUsers}
          open={showBulkActions}
          onClose={() => setShowBulkActions(false)}
          onActionCompleted={() => {
            setSelectedUsers([]);
            fetchUsers();
          }}
        />
      )}

      {showGrantAccess && (
        <GrantAccessModal
          selectedUserIds={selectedUsers}
          open={showGrantAccess}
          onClose={() => setShowGrantAccess(false)}
          onAccessGranted={() => {
            setSelectedUsers([]);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
