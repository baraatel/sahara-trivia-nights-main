import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Play, Crown, ArrowLeft, Gamepad2, Trophy, Target, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface CreateTeamGameProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const CreateTeamGame = ({ language, onLanguageChange }: CreateTeamGameProps) => {
  const { purchaseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  const createTeamAndGame = async () => {
    if (!teamName.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال اسم الفريق" : "Please enter a team name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          description: teamDescription,
          max_players: maxPlayers,
          created_by: user.id,
          team_code: generateTeamCode()
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add user as team captain
      const { error: playerError } = await supabase
        .from('team_players')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'captain'
        });

      if (playerError) throw playerError;

      // Create team game
      const { data: teamGame, error: gameError } = await supabase
        .from('team_games')
        .insert({
          team_id: team.id,
          game_purchase_id: purchaseId,
          room_code: generateRoomCode(),
          created_by: user.id
        })
        .select()
        .single();

      if (gameError) throw gameError;

      toast({
        title: language === 'ar' ? "تم إنشاء الفريق بنجاح!" : "Team created successfully!",
        description: language === 'ar' 
          ? `تم إنشاء الفريق "${teamName}" ويمكنك الآن بدء اللعبة`
          : `Team "${teamName}" created and ready to start the game`,
      });

      // Navigate to team game
      navigate(`/team-game/${team.id}`);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في إنشاء الفريق" : "Error creating team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTeamCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  return (
    <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} />
      <main className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'العودة' : 'Go Back'}
              </Button>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'إنشاء فريق جديد' : 'Create New Team'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                {language === 'ar' 
                  ? 'أنشئ فريقك وابدأ اللعبة مع 36 سؤال من 6 فئات'
                  : 'Create your team and start the game with 36 questions from 6 categories'
                }
              </p>
            </div>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === 'ar' ? 'معلومات الفريق' : 'Team Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teamName">
                    {language === 'ar' ? 'اسم الفريق' : 'Team Name'}
                  </Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل اسم الفريق' : 'Enter team name'}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamDescription">
                    {language === 'ar' ? 'وصف الفريق (اختياري)' : 'Team Description (Optional)'}
                  </Label>
                  <Textarea
                    id="teamDescription"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder={language === 'ar' ? 'وصف مختصر للفريق' : 'Brief team description'}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPlayers">
                    {language === 'ar' ? 'الحد الأقصى للاعبين' : 'Maximum Players'}
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="maxPlayers"
                      type="number"
                      min="2"
                      max="8"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? 'لاعبين' : 'players'}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🎯 معلومات اللعبة
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>36 سؤال من 6 فئات مختارة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      <span>نظام نقاط متقدم (10-50 نقطة حسب الصعوبة)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      <span>3 مساعدات لكل فريق</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      <span>نظام سرقة الأسئلة</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={createTeamAndGame}
                    disabled={isLoading || !teamName.trim()}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {language === 'ar' ? 'إنشاء الفريق وبدء اللعبة' : 'Create Team & Start Game'}
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer language={language} />
    </div>
  );
};

export default CreateTeamGame;
