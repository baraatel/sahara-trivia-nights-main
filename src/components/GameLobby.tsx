
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Play, Copy, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QuizGame from "./QuizGame";

interface GameLobbyProps {
  category: any;
  gameMode: 'single' | 'multi' | 'team';
  language: 'ar' | 'en';
  onBack: () => void;
}

const GameLobby = ({ category, gameMode, language, onBack }: GameLobbyProps) => {
  const [roomCode, setRoomCode] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Start single player game immediately
  useEffect(() => {
    if (gameMode === 'single') {
      startSinglePlayerGame();
    }
  }, []);

  const startSinglePlayerGame = () => {
    setCurrentGame({
      id: 'single-player',
      category_id: category.id,
      mode: 'single'
    });
  };

  // Create multiplayer game
  const createGameMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate room code
      const { data: roomCodeData, error: roomCodeError } = await supabase
        .rpc('generate_room_code');
      
      if (roomCodeError) throw roomCodeError;

      const { data, error } = await supabase
        .from('games')
        .insert({
          host_id: user.id,
          category_id: category.id,
          room_code: roomCodeData,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      // Join the game as a player
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: data.id,
          user_id: user.id,
          is_ready: true
        });

      if (joinError) throw joinError;

      return data;
    },
    onSuccess: (data) => {
      setGameId(data.id);
      setRoomCode(data.room_code);
      toast({
        title: language === 'ar' ? "تم إنشاء الغرفة" : "Room Created",
        description: language === 'ar' ? `رمز الغرفة: ${data.room_code}` : `Room Code: ${data.room_code}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Join game by room code
  const joinGameMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find game by room code
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (gameError) throw new Error('Game not found');

      // Join the game
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          user_id: user.id,
          is_ready: false
        });

      if (joinError) throw joinError;

      return game;
    },
    onSuccess: (data) => {
      setGameId(data.id);
      setRoomCode(data.room_code);
      toast({
        title: language === 'ar' ? "تم الانضمام للغرفة" : "Joined Room",
        description: language === 'ar' ? `رمز الغرفة: ${data.room_code}` : `Room Code: ${data.room_code}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get game details and players
  const { data: gameDetails } = useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      if (!gameId || gameId === 'single-player') return null;
      
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_players (
            id,
            user_id,
            score,
            is_ready,
            users (full_name, username)
          )
        `)
        .eq('id', gameId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!gameId && gameId !== 'single-player',
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: language === 'ar' ? "تم النسخ" : "Copied",
      description: language === 'ar' ? "تم نسخ رمز الغرفة" : "Room code copied to clipboard",
    });
  };

  const startGame = async () => {
    if (!gameId || gameId === 'single-player') return;
    
    const { error } = await supabase
      .from('games')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', gameId);

    if (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // If game is active or single player, show quiz
  if (currentGame || (gameDetails && gameDetails.status === 'active')) {
    return (
      <QuizGame
        game={currentGame || gameDetails}
        category={category}
        language={language}
        onBack={onBack}
      />
    );
  }

  if (gameMode === 'single') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-white text-lg">{language === 'ar' ? 'جاري تحضير اللعبة...' : 'Preparing game...'}</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:bg-white/20 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'العودة' : 'Back'}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Game Setup */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-center">
                {language === 'ar' ? 'إعداد اللعبة الجماعية' : 'Multiplayer Setup'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!gameId ? (
                <>
                  <Button
                    onClick={() => createGameMutation.mutate()}
                    disabled={createGameMutation.isPending}
                    className="w-full h-12 bg-green-500 hover:bg-green-600"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    {language === 'ar' ? 'إنشاء غرفة جديدة' : 'Create New Room'}
                  </Button>

                  <div className="text-center text-white/60">
                    {language === 'ar' ? 'أو' : 'OR'}
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder={language === 'ar' ? 'أدخل رمز الغرفة' : 'Enter room code'}
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    />
                    <Button
                      onClick={() => joinGameMutation.mutate(roomCode)}
                      disabled={!roomCode || joinGameMutation.isPending}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {language === 'ar' ? 'انضمام للغرفة' : 'Join Room'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">
                      {language === 'ar' ? 'رمز الغرفة' : 'Room Code'}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-mono bg-white/20 px-4 py-2 rounded">
                        {roomCode}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyRoomCode}
                        className="text-white hover:bg-white/20"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {gameDetails && gameDetails.host_id && (
                    <Button
                      onClick={startGame}
                      className="w-full bg-green-500 hover:bg-green-600"
                      disabled={!gameDetails.game_players?.some((p: any) => p.is_ready)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {language === 'ar' ? 'بدء اللعبة' : 'Start Game'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players List */}
          {gameDetails && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>
                  {language === 'ar' ? 'اللاعبون' : 'Players'} ({gameDetails.game_players?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gameDetails.game_players?.map((player: any) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                      <span className="font-medium">
                        {player.users?.full_name || player.users?.username || 'Anonymous'}
                      </span>
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
  );
};

export default GameLobby;
