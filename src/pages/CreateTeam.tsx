import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Crown, Shield, ArrowLeft, Copy, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface CreateTeamProps {
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

const CreateTeam = ({ language, onLanguageChange }: CreateTeamProps) => {
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      loadUserTeams(user.id);
    };
    getUser();
  }, [navigate]);

  const loadUserTeams = async (userId: string) => {
    try {
      // Get teams where user is captain
      const { data: captainTeams, error: captainError } = await supabase
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
        .eq('created_by', userId);

      if (captainError) throw captainError;

      // Get teams where user is member
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_players')
        .select(`
          team_id,
          teams (
            *,
            team_players (
              id,
              user_id,
              role,
              joined_at,
              users (full_name, username, avatar_url)
            )
          )
        `)
        .eq('user_id', userId)
        .neq('role', 'captain');

      if (memberError) throw memberError;

      const allTeams = [
        ...(captainTeams || []),
        ...(memberTeams?.map(mt => mt.teams) || [])
      ];

      setUserTeams(allTeams);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في تحميل الفرق" : "Error loading teams",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال اسم الفريق" : "Please enter a team name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Generate team code
      const { data: teamCodeData, error: teamCodeError } = await supabase
        .rpc('generate_team_code');
      
      if (teamCodeError) throw teamCodeError;

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          description: teamDescription,
          max_players: maxPlayers,
          created_by: user.id,
          team_code: teamCodeData
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as captain
      const { error: playerError } = await supabase
        .from('team_players')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'captain'
        });

      if (playerError) throw playerError;

      toast({
        title: language === 'ar' ? "تم إنشاء الفريق" : "Team Created",
        description: language === 'ar' ? `رمز الفريق: ${team.team_code}` : `Team Code: ${team.team_code}`,
      });

      // Reload teams
      await loadUserTeams(user.id);
      
      // Clear form
      setTeamName("");
      setTeamDescription("");
      setMaxPlayers(4);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في إنشاء الفريق" : "Error creating team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyTeamCode = (teamCode: string) => {
    navigator.clipboard.writeText(teamCode);
    toast({
      title: language === 'ar' ? "تم النسخ" : "Copied",
      description: language === 'ar' ? "تم نسخ رمز الفريق" : "Team code copied to clipboard",
    });
  };

  const startTeamGame = (team: Team) => {
    navigate(`/team-game/${team.id}`);
  };

  return (
    <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} />
      <main className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-6 text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>

            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'إدارة الفرق' : 'Team Management'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {language === 'ar' 
                  ? 'أنشئ فريقك أو انضم لفريق موجود للعب معاً' 
                  : 'Create your team or join an existing team to play together'
                }
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Create Team Form */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    {language === 'ar' ? 'إنشاء فريق جديد' : 'Create New Team'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'اسم الفريق' : 'Team Name'}
                    </label>
                    <Input
                      placeholder={language === 'ar' ? 'أدخل اسم الفريق' : 'Enter team name'}
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'وصف الفريق (اختياري)' : 'Team Description (Optional)'}
                    </label>
                    <Input
                      placeholder={language === 'ar' ? 'وصف مختصر للفريق' : 'Brief team description'}
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'ar' ? 'الحد الأقصى للاعبين' : 'Maximum Players'}
                    </label>
                    <select
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value={2}>2 {language === 'ar' ? 'لاعب' : 'players'}</option>
                      <option value={3}>3 {language === 'ar' ? 'لاعبين' : 'players'}</option>
                      <option value={4}>4 {language === 'ar' ? 'لاعبين' : 'players'}</option>
                      <option value={5}>5 {language === 'ar' ? 'لاعبين' : 'players'}</option>
                      <option value={6}>6 {language === 'ar' ? 'لاعبين' : 'players'}</option>
                    </select>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg"
                    onClick={handleCreateTeam}
                    disabled={isCreating || !teamName.trim()}
                  >
                    {isCreating ? (
                      language === 'ar' ? "جاري الإنشاء..." : "Creating..."
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-5 w-5" />
                        {language === 'ar' ? 'إنشاء الفريق' : 'Create Team'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* User Teams */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'ar' ? 'فرقك' : 'Your Teams'}
                </h2>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="flex justify-between">
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                            <div className="h-8 bg-gray-200 rounded w-24"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : userTeams.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {language === 'ar' ? 'لا توجد فرق' : 'No Teams'}
                      </h3>
                      <p className="text-gray-500">
                        {language === 'ar' 
                          ? 'أنشئ فريقك الأول أو انضم لفريق موجود' 
                          : 'Create your first team or join an existing one'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {userTeams.map((team) => (
                      <Card key={team.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {team.name}
                              </h3>
                              {team.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  {team.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {team.team_code}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyTeamCode(team.team_code)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Team Members */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {language === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {team.players?.map((player) => (
                                <div key={player.id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={player.user.avatar_url} />
                                    <AvatarFallback className="text-xs">
                                      {player.user.full_name?.charAt(0) || player.user.username?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {player.user.full_name || player.user.username}
                                  </span>
                                  {player.role === 'captain' && (
                                    <Crown className="h-3 w-3 text-yellow-500" />
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {team.players?.length || 0} / {team.max_players} {language === 'ar' ? 'لاعب' : 'players'}
                            </p>
                          </div>

                          {/* Team Actions */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {team.created_by === user?.id && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {language === 'ar' ? 'قائد الفريق' : 'Team Captain'}
                                </Badge>
                              )}
                            </div>
                            
                            <Button
                              onClick={() => startTeamGame(team)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Gamepad2 className="mr-2 h-4 w-4" />
                              {language === 'ar' ? 'ابدأ اللعب' : 'Start Playing'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Join Team Section */}
            <div className="mt-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'ar' ? 'انضم لفريق موجود' : 'Join Existing Team'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {language === 'ar' 
                        ? 'اطلب رمز الفريق من قائد الفريق للانضمام' 
                        : 'Ask the team captain for the team code to join'
                      }
                    </p>
                    <Button
                      onClick={() => navigate('/join-team')}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {language === 'ar' ? 'انضم لفريق' : 'Join Team'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer language={language} />
    </div>
  );
};

export default CreateTeam;
