import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Users, Play, Copy, UserPlus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface JoinGameProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const JoinGame = ({ language, onLanguageChange }: JoinGameProps) => {
  const [roomCode, setRoomCode] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleJoinGame = async () => {
    if (!roomCode.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال رمز الغرفة" : "Please enter a room code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find game by room code
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (gameError) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على الغرفة' : 'Room not found');
      }

      // Check if user is already in the game
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', game.id)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        setGameId(game.id);
        setGameDetails(game);
        toast({
          title: language === 'ar' ? "أنت بالفعل في هذه الغرفة" : "You are already in this room",
        });
        return;
      }

      // Join the game
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          user_id: user.id,
          is_ready: false
        });

      if (joinError) throw joinError;

      setGameId(game.id);
      setGameDetails(game);
      toast({
        title: language === 'ar' ? "تم الانضمام للغرفة" : "Joined Room",
        description: language === 'ar' ? `رمز الغرفة: ${game.room_code}` : `Room Code: ${game.room_code}`,
      });
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

  const copyRoomCode = () => {
    if (gameDetails?.room_code) {
      navigator.clipboard.writeText(gameDetails.room_code);
      toast({
        title: language === 'ar' ? "تم النسخ" : "Copied",
        description: language === 'ar' ? "تم نسخ رمز الغرفة" : "Room code copied to clipboard",
      });
    }
  };

  const startGame = async () => {
    if (!gameId) return;
    
    try {
      const { error } = await supabase
        .from('games')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: language === 'ar' ? "تم بدء اللعبة" : "Game Started",
        description: language === 'ar' ? "سيتم توجيهك للعبة الآن" : "You will be redirected to the game now",
      });

      // Navigate to game
      navigate(`/game/${gameId}`);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
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
              onClick={() => navigate('/')}
              className="mb-6 text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>

            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'انضم للعبة' : 'Join Game'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {language === 'ar' 
                  ? 'أدخل رمز الغرفة للانضمام للعبة مع الأصدقاء' 
                  : 'Enter the room code to join a game with friends'
                }
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              <Card className="h-full">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Gamepad2 className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">
                    {language === 'ar' ? 'انضم للغرفة' : 'Join Room'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!gameId ? (
                    <>
                      <div className="space-y-3">
                        <Input
                          placeholder={language === 'ar' ? 'أدخل رمز الغرفة' : 'Enter room code'}
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                          className="text-center text-lg font-mono"
                          maxLength={6}
                        />
                        <Button 
                          size="lg" 
                          className="w-full h-14 text-lg"
                          onClick={handleJoinGame}
                          disabled={isLoading || !roomCode.trim()}
                        >
                          {isLoading ? (
                            language === 'ar' ? "جاري الانضمام..." : "Joining..."
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-5 w-5" />
                              {language === 'ar' ? 'انضم للغرفة' : 'Join Room'}
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="text-center text-sm text-gray-500">
                        {language === 'ar' 
                          ? 'اطلب رمز الغرفة من صديقك لبدء اللعب معاً' 
                          : 'Ask your friend for the room code to start playing together'
                        }
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2">
                          {language === 'ar' ? 'رمز الغرفة' : 'Room Code'}
                        </h3>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl font-mono bg-primary/10 px-4 py-2 rounded">
                            {gameDetails?.room_code}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyRoomCode}
                            className="text-primary hover:bg-primary/10"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-center">
                        <Badge variant="default" className="text-lg px-4 py-2">
                          {language === 'ar' ? 'تم الانضمام بنجاح' : 'Successfully Joined'}
                        </Badge>
                      </div>

                      {gameDetails?.host_id === user?.id && (
                        <Button
                          onClick={startGame}
                          className="w-full bg-green-500 hover:bg-green-600"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {language === 'ar' ? 'بدء اللعبة' : 'Start Game'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                            ? 'اطلب رمز الغرفة من صديقك الذي أنشأ اللعبة' 
                            : 'Ask your friend who created the game for the room code'
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
                            ? 'أدخل رمز الغرفة في الحقل أعلاه' 
                            : 'Enter the room code in the field above'
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
                            ? 'انضم للغرفة وانتظر بدء اللعبة من المضيف' 
                            : 'Join the room and wait for the host to start the game'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5" />
                      {language === 'ar' ? 'معلومات مهمة' : 'Important Info'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ar' 
                          ? 'يمكنك الانضمام للغرف النشطة فقط' 
                          : 'You can only join active rooms'
                        }
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ar' 
                          ? 'رمز الغرفة يتكون من 6 أحرف' 
                          : 'Room code consists of 6 characters'
                        }
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ar' 
                          ? 'يمكن للجميع الانضمام للغرف المجانية' 
                          : 'Everyone can join free rooms'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer language={language} />
    </div>
  );
};

export default JoinGame;
