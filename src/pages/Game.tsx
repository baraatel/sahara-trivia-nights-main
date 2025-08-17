import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Users, Play, Trophy, Clock, Plus, Hash, Crown, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface GameProps {
  language: 'ar' | 'en';
}

const Game = ({ language }: GameProps) => {
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentGame, setCurrentGame] = useState(null);
  const [gameState, setGameState] = useState('lobby'); // lobby, waiting, playing, finished
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchCategories();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/login');
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_en');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const createGame = async () => {
    if (!selectedCategory || !user) return;

    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          host_id: user.id,
          category_id: selectedCategory,
          room_code: roomCode,
          status: 'waiting',
          max_players: 10,
          total_questions: 10
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Join the game as host
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          is_ready: true
        });

      if (playerError) throw playerError;

      setCurrentGame(gameData);
      setGameState('waiting');
      fetchGamePlayers(gameData.id);

      toast({
        title: language === 'ar' ? 'نجح الأمر' : 'Success',
        description: language === 'ar' ? `تم إنشاء اللعبة. رمز الغرفة: ${roomCode}` : `Game created. Room code: ${roomCode}`,
      });

    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const joinGame = async () => {
    if (!roomCode.trim() || !user) return;

    try {
      // Find the game by room code
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('room_code', roomCode.trim().toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (gameError || !gameData) {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: language === 'ar' ? 'رمز الغرفة غير صحيح أو اللعبة غير متاحة' : 'Invalid room code or game not available',
          variant: 'destructive',
        });
        return;
      }

      // Check if already joined
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', gameData.id)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        setCurrentGame(gameData);
        setGameState('waiting');
        fetchGamePlayers(gameData.id);
        return;
      }

      // Join the game
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          is_ready: false
        });

      if (playerError) throw playerError;

      setCurrentGame(gameData);
      setGameState('waiting');
      fetchGamePlayers(gameData.id);

      toast({
        title: language === 'ar' ? 'نجح الأمر' : 'Success',
        description: language === 'ar' ? 'تم الانضمام إلى اللعبة' : 'Joined game successfully',
      });

    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchGamePlayers = async (gameId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .select(`
          *,
          users!inner(username, full_name)
        `)
        .eq('game_id', gameId);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const toggleReady = async () => {
    if (!currentGame || !user) return;

    try {
      const currentPlayer = players.find(p => p.user_id === user.id);
      const newReadyState = !currentPlayer?.is_ready;

      const { error } = await supabase
        .from('game_players')
        .update({ is_ready: newReadyState })
        .eq('game_id', currentGame.id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchGamePlayers(currentGame.id);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const startGame = async () => {
    if (!currentGame || !user || currentGame.host_id !== user.id) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'playing',
          started_at: new Date().toISOString(),
          current_question: 1
        })
        .eq('id', currentGame.id);

      if (error) throw error;

      setGameState('playing');
      toast({
        title: language === 'ar' ? 'نجح الأمر' : 'Success',
        description: language === 'ar' ? 'بدأت اللعبة!' : 'Game started!',
      });

    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const leaveGame = () => {
    setCurrentGame(null);
    setGameState('lobby');
    setPlayers([]);
    setRoomCode('');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <Skeleton className="h-12 w-64 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-3 rounded-full text-lg font-medium mb-6">
            <Gamepad2 className="h-6 w-6" />
            {language === 'ar' ? 'غرف الألعاب' : 'Game Rooms'}
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            {language === 'ar' ? 'الألعاب' : 'Games'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'أنشئ غرفة جديدة أو انضم إلى غرفة موجودة للعب مع الأصدقاء' 
              : 'Create a new room or join an existing one to play with friends'
            }
          </p>
        </div>

        {gameState === 'lobby' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Game */}
            <Card className="bg-card border-border shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {language === 'ar' ? 'إنشاء لعبة جديدة' : 'Create New Game'}
                </CardTitle>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'أنشئ غرفة جديدة وادع أصدقاءك' : 'Create a new room and invite your friends'}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    {language === 'ar' ? 'اختر الفئة' : 'Select Category'}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    <option value="">
                      {language === 'ar' ? 'اختر فئة' : 'Choose a category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id} className="bg-background">
                        {language === 'ar' ? category.name_ar : category.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={createGame}
                  disabled={!selectedCategory}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-lg font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {language === 'ar' ? 'إنشاء لعبة' : 'Create Game'}
                </Button>
              </CardContent>
            </Card>

            {/* Join Game */}
            <Card className="bg-card border-border shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Hash className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {language === 'ar' ? 'انضم إلى لعبة' : 'Join Game'}
                </CardTitle>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'انضم إلى غرفة موجودة باستخدام رمز الغرفة' : 'Join an existing room using the room code'}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    {language === 'ar' ? 'رمز الغرفة' : 'Room Code'}
                  </label>
                  <Input
                    placeholder={language === 'ar' ? 'أدخل رمز الغرفة' : 'Enter room code'}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-widest bg-background border-border focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    maxLength={6}
                  />
                </div>
                <Button
                  onClick={joinGame}
                  disabled={!roomCode.trim()}
                  className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground text-lg font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Users className="h-5 w-5 mr-2" />
                  {language === 'ar' ? 'انضم' : 'Join Game'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {gameState === 'waiting' && currentGame && (
          <div className="space-y-8">
            <Card className="bg-card border-border shadow-2xl">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                  <Hash className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-foreground flex items-center justify-center gap-4">
                  <span>{language === 'ar' ? 'غرفة اللعبة' : 'Game Room'}</span>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl px-6 py-2 border-0 shadow-lg">
                    {currentGame.room_code}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted/50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground">
                        {language === 'ar' ? 'الفئة:' : 'Category:'}
                      </span>
                    </div>
                    <p className="text-lg">
                      {categories.find(c => c.id === currentGame.category_id)
                        ? (language === 'ar' 
                          ? categories.find(c => c.id === currentGame.category_id)?.name_ar 
                          : categories.find(c => c.id === currentGame.category_id)?.name_en)
                        : 'Unknown'
                      }
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-accent" />
                      <span className="font-semibold text-foreground">
                        {language === 'ar' ? 'اللاعبون:' : 'Players:'}
                      </span>
                    </div>
                    <p className="text-lg">
                      {players.length}/{currentGame.max_players}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground text-center">
                    {language === 'ar' ? 'قائمة اللاعبين' : 'Player List'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {player.user_id === currentGame.host_id ? (
                              <Crown className="h-5 w-5 text-primary" />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {player.users?.full_name || player.users?.username || 'Anonymous'}
                            </p>
                            {player.user_id === currentGame.host_id && (
                              <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs">
                                {language === 'ar' ? 'المضيف' : 'Host'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge className={`px-3 py-1 ${
                          player.is_ready 
                            ? "bg-green-500/20 text-green-600 border border-green-500/30" 
                            : "bg-red-500/20 text-red-600 border border-red-500/30"
                        }`}>
                          {player.is_ready ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          {player.is_ready ? (language === 'ar' ? 'جاهز' : 'Ready') : (language === 'ar' ? 'غير جاهز' : 'Not Ready')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    onClick={toggleReady}
                    className={`flex-1 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 ${
                      players.find(p => p.user_id === user?.id)?.is_ready 
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg' 
                        : 'bg-green-500 hover:bg-green-600 shadow-lg'
                    }`}
                  >
                    {players.find(p => p.user_id === user?.id)?.is_ready 
                      ? (language === 'ar' ? 'إلغاء الجاهزية' : 'Not Ready') 
                      : (language === 'ar' ? 'جاهز' : 'Ready')}
                  </Button>
                  
                  {currentGame.host_id === user?.id && (
                    <Button
                      onClick={startGame}
                      disabled={players.some(p => !p.is_ready) || players.length < 2}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      {language === 'ar' ? 'بدء اللعبة' : 'Start Game'}
                    </Button>
                  )}
                  
                  <Button
                    onClick={leaveGame}
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-muted py-3 text-lg transition-all duration-200 hover:scale-105"
                  >
                    {language === 'ar' ? 'مغادرة' : 'Leave'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {gameState === 'playing' && (
          <Card className="bg-card border-border shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-8 shadow-2xl">
                <Clock className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {language === 'ar' ? 'اللعبة جارية' : 'Game in Progress'}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {language === 'ar' 
                  ? 'سيتم تطبيق واجهة اللعبة الكاملة قريباً. استمتع باللعب!' 
                  : 'Full game interface will be implemented soon. Enjoy playing!'
                }
              </p>
              <Button 
                onClick={leaveGame} 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {language === 'ar' ? 'العودة إلى اللوبي' : 'Back to Lobby'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Game;
