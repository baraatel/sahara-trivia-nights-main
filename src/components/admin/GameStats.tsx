
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Trophy, Clock, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GameStats = () => {
  const [stats, setStats] = useState({
    totalGames: 0,
    totalPlayers: 0,
    totalQuestions: 0,
    totalCategories: 0,
    activeGames: 0,
    recentGames: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total games
      const { count: totalGames } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true });

      // Get active games
      const { count: activeGames } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total unique players
      const { count: totalPlayers } = await supabase
        .from('game_players')
        .select('user_id', { count: 'exact', head: true });

      // Get total questions
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      // Get total categories
      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      // Get recent games with details
      const { data: recentGames } = await supabase
        .from('games')
        .select(`
          *,
          categories (name_en),
          game_players (id)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalGames: totalGames || 0,
        activeGames: activeGames || 0,
        totalPlayers: totalPlayers || 0,
        totalQuestions: totalQuestions || 0,
        totalCategories: totalCategories || 0,
        recentGames: recentGames || []
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Game Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Games</p>
                <p className="text-2xl font-bold">{stats.totalGames}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-2xl font-bold">{stats.totalPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold">{stats.totalQuestions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Games</p>
                <p className="text-2xl font-bold">{stats.activeGames}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentGames.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No games found</p>
          ) : (
            <div className="space-y-4">
              {stats.recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Room: {game.room_code}</p>
                    <p className="text-sm text-gray-600">
                      Category: {game.categories?.name_en || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Players: {game.game_players?.length || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      game.status === 'active' ? 'text-green-600' :
                      game.status === 'finished' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(game.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GameStats;
