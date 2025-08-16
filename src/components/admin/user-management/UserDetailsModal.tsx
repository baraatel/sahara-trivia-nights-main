
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { User, Calendar, Mail, Trophy, ShoppingCart, Gift, AlertTriangle } from "lucide-react";
import UserPurchases from "./UserPurchases";
import UserRedemptions from "./UserRedemptions";
import UserViolations from "./UserViolations";

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
}

interface UserDetailsModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserDetailsModal = ({ user, open, onClose, onUserUpdated }: UserDetailsModalProps) => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchUserDetails();
    }
  }, [open, user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);

      // Fetch detailed user information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          user_stats (*),
          user_game_purchases (
            id,
            amount,
            category_id,
            purchased_at,
            status,
            order_status,
            payment_provider,
            categories (name_en, name_ar)
          ),
          code_redemptions (
            id,
            redeemed_at,
            redemption_codes (code, code_type, value_type, value_data)
          )
        `)
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      setUserDetails(userData);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAccuracy = (stats: any) => {
    if (!stats || !stats.questions_answered || stats.questions_answered === 0) return 0;
    return Math.round((stats.correct_answers / stats.questions_answered) * 100);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const stats = userDetails?.user_stats?.[0] || {
    games_played: 0,
    total_score: 0,
    correct_answers: 0,
    questions_answered: 0,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userDetails?.avatar_url} alt={userDetails?.full_name} />
              <AvatarFallback>{getInitials(userDetails?.full_name || '')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{userDetails?.full_name}</div>
              <div className="text-sm text-gray-500">@{userDetails?.username}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.games_played}</div>
                <p className="text-xs text-muted-foreground">
                  {calculateAccuracy(stats)}% accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Score</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_score}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.correct_answers} correct answers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchases</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userDetails?.user_game_purchases?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total spent: ${userDetails?.user_game_purchases?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0).toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Redemptions</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userDetails?.code_redemptions?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Codes redeemed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Details and Management */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
              <TabsTrigger value="violations">Violations</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </label>
                      <div className="p-2 bg-gray-50 rounded">{userDetails?.full_name}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <div className="p-2 bg-gray-50 rounded">{userDetails?.email}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <div className="p-2 bg-gray-50 rounded">@{userDetails?.username}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Joined
                      </label>
                      <div className="p-2 bg-gray-50 rounded">
                        {format(new Date(userDetails?.created_at), 'MMMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  {userDetails?.bio && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bio</label>
                      <div className="p-2 bg-gray-50 rounded">{userDetails.bio}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases">
              <UserPurchases userId={user.id} onPurchaseUpdated={fetchUserDetails} />
            </TabsContent>

            <TabsContent value="redemptions">
              <UserRedemptions userId={user.id} onRedemptionUpdated={fetchUserDetails} />
            </TabsContent>

            <TabsContent value="violations">
              <UserViolations userId={user.id} onViolationUpdated={fetchUserDetails} />
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Game Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.games_played}</div>
                      <div className="text-sm text-gray-500">Games Played</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.total_score}</div>
                      <div className="text-sm text-gray-500">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.correct_answers}</div>
                      <div className="text-sm text-gray-500">Correct Answers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{calculateAccuracy(stats)}%</div>
                      <div className="text-sm text-gray-500">Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
