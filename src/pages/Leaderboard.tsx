
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star } from "lucide-react";

interface LeaderboardProps {
  language: 'ar' | 'en';
}

const Leaderboard = ({ language }: LeaderboardProps) => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Star className="h-6 w-6 text-blue-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600";
      default:
        return "bg-white/10";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          {language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}
        </h1>
        <p className="text-xl text-white/80">
          {language === 'ar' 
            ? 'أفضل اللاعبين حول العالم' 
            : 'Top players from around the world'
          }
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 animate-pulse">
              <CardContent className="p-6 h-20" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Top 3 Special Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {leaderboard?.slice(0, 3).map((player, index) => (
              <Card
                key={player.id}
                className={`${getRankColor(index + 1)} backdrop-blur-md border-white/20 text-white`}
              >
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    {getRankIcon(index + 1)}
                  </div>
                  <CardTitle className="text-lg">
                    #{index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <h3 className="font-bold text-lg mb-2">{player.full_name || player.username}</h3>
                  <div className="space-y-1">
                    <p className="text-sm opacity-90">
                      {language === 'ar' ? 'النقاط: ' : 'Score: '}{player.total_score}
                    </p>
                    <p className="text-sm opacity-90">
                      {language === 'ar' ? 'الألعاب: ' : 'Games: '}{player.games_played}
                    </p>
                    <p className="text-sm opacity-90">
                      {language === 'ar' ? 'الدقة: ' : 'Accuracy: '}{player.accuracy_percentage}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Remaining Players */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {language === 'ar' ? 'باقي المتصدرين' : 'Other Top Players'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard?.slice(3).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(0)}
                        <span className="text-white font-bold">#{player.rank}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">
                          {player.full_name || player.username}
                        </h4>
                        <p className="text-white/60 text-sm">
                          {language === 'ar' ? 'ألعاب: ' : 'Games: '}{player.games_played} | 
                          {language === 'ar' ? ' دقة: ' : ' Accuracy: '}{player.accuracy_percentage}%
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500 text-white">
                      {player.total_score} {language === 'ar' ? 'نقطة' : 'pts'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
