
import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

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

interface UserListProps {
  users: User[];
  loading: boolean;
  selectedUsers: string[];
  onUserSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUserClick: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const UserList = ({
  users,
  loading,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onUserClick,
  onDeleteUser,
  currentPage,
  totalPages,
  onPageChange,
}: UserListProps) => {
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const allSelected = users.length > 0 && users.every(user => selectedUsers.includes(user.id));
  const someSelected = users.some(user => selectedUsers.includes(user.id));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityBadge = (user: User) => {
    const gamesPlayed = user.stats?.games_played || 0;
    const purchaseCount = user.purchase_count || 0;

    if (gamesPlayed > 10 && purchaseCount > 0) {
      return <Badge className="bg-green-100 text-green-800">Active Buyer</Badge>;
    } else if (gamesPlayed > 5) {
      return <Badge className="bg-blue-100 text-blue-800">Active Player</Badge>;
    } else if (purchaseCount > 0) {
      return <Badge className="bg-purple-100 text-purple-800">Buyer</Badge>;
    } else if (gamesPlayed > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Player</Badge>;
    } else {
      return <Badge variant="secondary">New User</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table className="[&_tr]:border-b [&_tr]:border-gray-100 [&_td]:py-4 [&_th]:py-4">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 py-4 font-medium text-center">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="py-4 font-medium text-center">User</TableHead>
            <TableHead className="py-4 font-medium text-center">Status</TableHead>
            <TableHead className="py-4 font-medium text-center">Games</TableHead>
            <TableHead className="py-4 font-medium text-center">Purchases</TableHead>
            <TableHead className="py-4 font-medium text-center">Joined</TableHead>
            <TableHead className="py-4 font-medium text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-gray-50">
              <TableCell className="align-middle py-4 text-center">
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => onUserSelect(user.id, !!checked)}
                  aria-label={`Select ${user.full_name}`}
                />
              </TableCell>
              <TableCell className="align-middle py-4 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="align-middle py-4 text-center">
                {getActivityBadge(user)}
              </TableCell>
              <TableCell className="align-middle py-4 text-center">
                <div className="text-sm">
                  <div>{user.stats?.games_played || 0} played</div>
                  <div className="text-gray-500">{user.stats?.total_score || 0} pts</div>
                </div>
              </TableCell>
              <TableCell className="align-middle py-4 text-center">
                <div className="text-sm">
                  <div>{user.purchase_count || 0} purchases</div>
                </div>
              </TableCell>
              <TableCell className="align-middle py-4 text-center">
                <div className="text-sm text-gray-500">
                  {format(new Date(user.created_at), 'MMM dd, yyyy')}
                </div>
              </TableCell>
              <TableCell className="align-middle py-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUserClick(user)}
                    className="h-8 w-8 p-0 flex items-center justify-center"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {user.full_name}? This action cannot be undone.
                          All user data, purchases, and game history will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
