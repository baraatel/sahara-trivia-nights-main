import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Crown, ArrowLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface JoinTeamProps {
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
  captain: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
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

const JoinTeam = ({ language, onLanguageChange }: JoinTeamProps) => {
  const [teamCode, setTeamCode] = useState("");
  const [teamDetails, setTeamDetails] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [user, setUser] = useState<any>(null);
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
    };
    getUser();
  }, [navigate]);

  const handleSearchTeam = async () => {
    if (!teamCode.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال رمز الفريق" : "Please enter a team code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find team by code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          team_players (
            id,
            user_id,
            role,
            joined_at,
            users (full_name, username, avatar_url)
          ),
          captain:users!teams_created_by_fkey (full_name, username, avatar_url)
        `)
        .eq('team_code', teamCode.toUpperCase())
        .single();

      if (teamError) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على الفريق' : 'Team not found');
      }

      // Check if user is already in the team
      const existingPlayer = team.team_players?.find(p => p.user_id === user.id);
      if (existingPlayer) {
        toast({
          title: language === 'ar' ? "أنت بالفعل في هذا الفريق" : "You are already in this team",
        });
        navigate('/create-team');
        return;
      }

      // Check if team is full
      if (team.team_players?.length >= team.max_players) {
        throw new Error(language === 'ar' ? 'الفريق ممتلئ' : 'Team is full');
      }

      setTeamDetails(team);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!teamDetails) return;

    setIsJoining(true);
    try {
      // Join the team
      const { error: joinError } = await supabase
        .from('team_players')
        .insert({
          team_id: teamDetails.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) throw joinError;

      toast({
        title: language === 'ar' ? "تم الانضمام للفريق" : "Joined Team",
        description: language === 'ar' ? `مرحباً بك في فريق ${teamDetails.name}` : `Welcome to team ${teamDetails.name}`,
      });

      // Navigate to team management
      navigate('/create-team');
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في الانضمام" : "Error joining team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} />
      <main className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
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
                {language === 'ar' ? 'انضم لفريق' : 'Join Team'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {language === 'ar' 
                  ? 'أدخل رمز الفريق للانضمام لفريق موجود' 
                  : 'Enter the team code to join an existing team'
                }
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              <Card className="h-fit">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Users className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">
                    {language === 'ar' ? 'البحث عن فريق' : 'Search for Team'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!teamDetails ? (
                    <>
                      <div className="space-y-3">
                        <Input
                          placeholder={language === 'ar' ? 'أدخل رمز الفريق' : 'Enter team code'}
                          value={teamCode}
                          onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                          className="text-center text-lg font-mono"
                          maxLength={6}
                        />
                        <Button 
                          size="lg" 
                          className="w-full h-14 text-lg"
                          onClick={handleSearchTeam}
                          disabled={isLoading || !teamCode.trim()}
                        >
                          {isLoading ? (
                            language === 'ar' ? "جاري البحث..." : "Searching..."
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-5 w-5" />
                              {language === 'ar' ? 'البحث عن الفريق' : 'Search Team'}
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="text-center text-sm text-gray-500">
                        {language === 'ar' 
                          ? 'اطلب رمز الفريق من قائد الفريق للانضمام' 
                          : 'Ask the team captain for the team code to join'
                        }
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <Badge variant="default" className="text-lg px-4 py-2 font-mono">
                          {teamDetails.team_code}
                        </Badge>
                      </div>

                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {teamDetails.name}
                        </h3>
                        {teamDetails.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            {teamDetails.description}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleJoinTeam}
                        className="w-full bg-green-500 hover:bg-green-600"
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          language === 'ar' ? "جاري الانضمام..." : "Joining..."
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {language === 'ar' ? 'انضم للفريق' : 'Join Team'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Details */}
              {teamDetails && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {language === 'ar' ? 'معلومات الفريق' : 'Team Information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'ar' ? 'قائد الفريق' : 'Team Captain'}
                        </span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={teamDetails.captain?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {teamDetails.captain?.full_name?.charAt(0) || teamDetails.captain?.username?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {teamDetails.captain?.full_name || teamDetails.captain?.username}
                          </span>
                          <Crown className="h-3 w-3 text-yellow-500" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'ar' ? 'عدد الأعضاء' : 'Members'}
                        </span>
                        <Badge variant="outline">
                          {teamDetails.players?.length || 0} / {teamDetails.max_players}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(teamDetails.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {language === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teamDetails.players?.map((player) => (
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
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Instructions */}
              {!teamDetails && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {language === 'ar' ? 'كيف تعمل؟' : 'How it works?'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {language === 'ar' ? 'احصل على الرمز' : 'Get the Code'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'ar' 
                              ? 'اطلب رمز الفريق من قائد الفريق' 
                              : 'Ask the team captain for the team code'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {language === 'ar' ? 'أدخل الرمز' : 'Enter the Code'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'ar' 
                              ? 'أدخل رمز الفريق في الحقل أعلاه' 
                              : 'Enter the team code in the field above'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {language === 'ar' ? 'انضم وابدأ اللعب' : 'Join and Start Playing'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'ar' 
                              ? 'انضم للفريق وابدأ اللعب مع الفريق' 
                              : 'Join the team and start playing with the team'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {language === 'ar' ? 'معلومات مهمة' : 'Important Info'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {language === 'ar' 
                            ? 'يمكنك الانضمام لفريق واحد فقط في كل مرة' 
                            : 'You can only join one team at a time'
                          }
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {language === 'ar' 
                            ? 'رمز الفريق يتكون من 6 أحرف' 
                            : 'Team code consists of 6 characters'
                          }
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {language === 'ar' 
                            ? 'يمكن لقائد الفريق إزالتك من الفريق' 
                            : 'Team captain can remove you from the team'
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer language={language} />
    </div>
  );
};

export default JoinTeam;
