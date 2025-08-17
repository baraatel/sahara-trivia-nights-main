import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Play, Crown, ArrowLeft, Gamepad2, Trophy, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import QuizGame from "@/components/QuizGame";

interface TeamGameProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  max_players: number;
  created_by: string;
  created_at: string;
  team_code: string;
  players: TeamPlayer[];
}

interface TeamPlayer {
  id: string;
  user_id: string;
  team_id: string;
  role: 'captain' | 'member';
  joined_at: string;
  user: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface TeamGame {
  id: string;
  team_id: string;
  game_purchase_id?: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  room_code: string;
  created_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  total_score: number;
  questions_answered: number;
  correct_answers: number;
  players: TeamGamePlayer[];
}

interface TeamGamePlayer {
  id: string;
  team_game_id: string;
  user_id: string;
  team_id: string;
  score: number;
  questions_answered: number;
  correct_answers: number;
  is_ready: boolean;
  joined_at: string;
  user: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

const TeamGame = ({ language, onLanguageChange }: TeamGameProps) => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [teamGame, setTeamGame] = useState<TeamGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      loadTeamData();
    };
    getUser();
  }, [navigate, teamId]);

  const loadTeamData = async () => {
    if (!teamId) return;

    try {
      // Load team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          team_players (
            id,
            user_id,
            role,
            joined_at,
            users (full_name, username, avatar_url)
          )
        `)
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Check if user is in the team
      const isMember = teamData.team_players?.some((p: any) => p.user_id === user?.id);
      if (!isMember) {
        toast({
          title: language === 'ar' ? "غير مصرح" : "Unauthorized",
          description: language === 'ar' ? "أنت لست عضواً في هذا الفريق" : "You are not a member of this team",
          variant: "destructive",
        });
        navigate('/create-team');
        return;
      }

      // Load active team game
      const { data: gameData, error: gameError } = await supabase
        .from('team_games')
        .select(`
          *,
          players:team_game_players (
            id,
            team_game_id,
            user_id,
            team_id,
            score,
            questions_answered,
            correct_answers,
            is_ready,
            joined_at,
            users (full_name, username, avatar_url)
          )
        `)
        .eq('team_id', teamId)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (gameData) {
        setTeamGame(gameData);
      }
    } catch (error: any) {
      if (error.code !== 'PGRST116') { // No rows returned
        toast({
          title: language === 'ar' ? "خطأ في تحميل البيانات" : "Error loading data",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createTeamGame = async () => {
    if (!teamId || !user) return;

    setIsCreating(true);
    try {
      const { data: gameId, error } = await supabase
        .rpc('create_team_game', {
          team_id_param: teamId,
          created_by_param: user.id
        });

      if (error) throw error;

      toast({
        title: language === 'ar' ? "تم إنشاء اللعبة" : "Game Created",
        description: language === 'ar' ? "تم إنشاء لعبة جديدة للفريق" : "New team game created",
      });

      // Reload data
      await loadTeamData();
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في إنشاء اللعبة" : "Error creating game",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const startTeamGame = async () => {
    if (!teamGame) return;

    try {
      const { error } = await supabase
        .from('team_games')
        .update({ 
          status: 'active', 
          started_at: new Date().toISOString() 
        })
        .eq('id', teamGame.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? "تم بدء اللعبة" : "Game Started",
        description: language === 'ar' ? "سيتم توجيهك للعبة الآن" : "You will be redirected to the game now",
      });

      // Reload data
      await loadTeamData();
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في بدء اللعبة" : "Error starting game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyRoomCode = () => {
    if (teamGame?.room_code) {
      navigator.clipboard.writeText(teamGame.room_code);
      toast({
        title: language === 'ar' ? "تم النسخ" : "Copied",
        description: language === 'ar' ? "تم نسخ رمز الغرفة" : "Room code copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  // If game is active, show quiz
  if (teamGame && teamGame.status === 'active') {
    return (
      <QuizGame
        game={teamGame}
        category={null} // Team games don't have specific categories
        language={language}
        onBack={() => navigate('/create-team')}
        isTeamGame={true}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} />
      <main className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <Button
              variant="ghost"
              onClick={() => navigate('/create-team')}
              className="mb-6 text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'العودة لإدارة الفرق' : 'Back to Team Management'}
            </Button>

            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {team?.name}
              </h1>
              {team?.description && (
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  {team.description}
                </p>
              )}
              <Badge variant="outline" className="text-lg px-4 py-2 font-mono">
                {team?.team_code}
              </Badge>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {team?.players?.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.user.avatar_url} />
                            <AvatarFallback className="text-sm">
                              {player.user.full_name?.charAt(0) || player.user.username?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {player.user.full_name || player.user.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {player.role === 'captain' 
                                ? (language === 'ar' ? 'قائد الفريق' : 'Team Captain')
                                : (language === 'ar' ? 'عضو' : 'Member')
                              }
                            </p>
                          </div>
                        </div>
                        {player.role === 'captain' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {team?.players?.length || 0} / {team?.max_players} {language === 'ar' ? 'لاعب' : 'players'}
                  </p>
                </CardContent>
              </Card>

              {/* Game Management */}
              <div className="space-y-6">
                {!teamGame ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5" />
                        {language === 'ar' ? 'إنشاء لعبة جديدة' : 'Create New Game'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        {language === 'ar' 
                          ? 'أنشئ لعبة جديدة للفريق وابدأ اللعب معاً' 
                          : 'Create a new game for the team and start playing together'
                        }
                      </p>
                      <Button
                        onClick={createTeamGame}
                        className="w-full bg-green-500 hover:bg-green-600"
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          language === 'ar' ? "جاري الإنشاء..." : "Creating..."
                        ) : (
                          <>
                            <Gamepad2 className="mr-2 h-4 w-4" />
                            {language === 'ar' ? 'إنشاء لعبة' : 'Create Game'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {language === 'ar' ? 'اللعبة الحالية' : 'Current Game'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2">
                          {language === 'ar' ? 'رمز الغرفة' : 'Room Code'}
                        </h3>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <span className="text-2xl font-mono bg-primary/10 px-4 py-2 rounded">
                            {teamGame.room_code}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyRoomCode}
                            className="text-primary hover:bg-primary/10"
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'ar' ? 'الحالة' : 'Status'}
                          </span>
                          <Badge variant={teamGame.status === 'waiting' ? 'secondary' : 'default'}>
                            {teamGame.status === 'waiting' 
                              ? (language === 'ar' ? 'في الانتظار' : 'Waiting')
                              : (language === 'ar' ? 'نشط' : 'Active')
                            }
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'ar' ? 'اللاعبون الجاهزون' : 'Ready Players'}
                          </span>
                          <span className="text-sm font-medium">
                            {teamGame.players?.filter(p => p.is_ready).length || 0} / {teamGame.players?.length || 0}
                          </span>
                        </div>
                      </div>

                      {teamGame.status === 'waiting' && team?.created_by === user?.id && (
                        <Button
                          onClick={startTeamGame}
                          className="w-full bg-green-500 hover:bg-green-600"
                          disabled={!teamGame.players?.some(p => p.is_ready)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {language === 'ar' ? 'بدء اللعبة' : 'Start Game'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Game Players */}
                {teamGame && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {language === 'ar' ? 'لاعبو اللعبة' : 'Game Players'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teamGame.players?.map((player) => (
                          <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={player.user.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {player.user.full_name?.charAt(0) || player.user.username?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">
                                {player.user.full_name || player.user.username}
                              </span>
                            </div>
                            <Badge className={player.is_ready ? "bg-green-500" : "bg-gray-500"}>
                              {player.is_ready 
                                ? (language === 'ar' ? 'جاهز' : 'Ready')
                                : (language === 'ar' ? 'غير جاهز' : 'Not Ready')
                              }
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer language={language} />
    </div>
  );
};

export default TeamGame;
