import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Users, Play, Trophy, Clock } from "lucide-react";
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
        <div className="text-center text-white">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Gamepad2 className="h-8 w-8" />
          {language === 'ar' ? 'الألعاب' : 'Games'}
        </h1>

        {gameState === 'lobby' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Game */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {language === 'ar' ? 'إنشاء لعبة جديدة' : 'Create New Game'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {language === 'ar' ? 'اختر الفئة' : 'Select Category'}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                  >
                    <option value="">
                      {language === 'ar' ? 'اختر فئة' : 'Choose a category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id} className="bg-gray-800">
                        {language === 'ar' ? category.name_ar : category.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={createGame}
                  disabled={!selectedCategory}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {language === 'ar' ? 'إنشاء لعبة' : 'Create Game'}
                </Button>
              </CardContent>
            </Card>

            {/* Join Game */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === 'ar' ? 'انضم إلى لعبة' : 'Join Game'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {language === 'ar' ? 'رمز الغرفة' : 'Room Code'}
                  </label>
                  <Input
                    placeholder={language === 'ar' ? 'أدخل رمز الغرفة' : 'Enter room code'}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
                <Button
                  onClick={joinGame}
                  disabled={!roomCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {language === 'ar' ? 'انضم' : 'Join Game'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {gameState === 'waiting' && currentGame && (
          <div className="space-y-6">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{language === 'ar' ? 'غرفة اللعبة' : 'Game Room'}</span>
                  <Badge className="bg-blue-500 text-white text-lg px-3 py-1">
                    {currentGame.room_code}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white">
                    {language === 'ar' ? 'الفئة:' : 'Category:'} {
                      categories.find(c => c.id === currentGame.category_id)
                        ? (language === 'ar' 
                          ? categories.find(c => c.id === currentGame.category_id)?.name_ar 
                          : categories.find(c => c.id === currentGame.category_id)?.name_en)
                        : 'Unknown'
                    }
                  </span>
                  <span className="text-white">
                    {language === 'ar' ? 'اللاعبون:' : 'Players:'} {players.length}/{currentGame.max_players}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded">
                      <span className="text-white">
                        {player.users?.full_name || player.users?.username || 'Anonymous'}
                        {player.user_id === currentGame.host_id && (
                          <Badge className="ml-2 bg-yellow-500 text-black">
                            {language === 'ar' ? 'المضيف' : 'Host'}
                          </Badge>
                        )}
                      </span>
                      <Badge className={player.is_ready ? 'bg-green-500' : 'bg-red-500'}>
                        {player.is_ready ? (language === 'ar' ? 'جاهز' : 'Ready') : (language === 'ar' ? 'غير جاهز' : 'Not Ready')}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={toggleReady}
                    className={players.find(p => p.user_id === user?.id)?.is_ready ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {players.find(p => p.user_id === user?.id)?.is_ready 
                      ? (language === 'ar' ? 'إلغاء الجاهزية' : 'Not Ready') 
                      : (language === 'ar' ? 'جاهز' : 'Ready')}
                  </Button>
                  
                  {currentGame.host_id === user?.id && (
                    <Button
                      onClick={startGame}
                      disabled={players.some(p => !p.is_ready) || players.length < 2}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'بدء اللعبة' : 'Start Game'}
                    </Button>
                  )}
                  
                  <Button
                    onClick={leaveGame}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {language === 'ar' ? 'مغادرة' : 'Leave'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {gameState === 'playing' && (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-blue-400" />
              <h2 className="text-2xl font-bold text-white mb-4">
                {language === 'ar' ? 'اللعبة جارية' : 'Game in Progress'}
              </h2>
              <p className="text-gray-400">
                {language === 'ar' ? 'سيتم تطبيق واجهة اللعبة الكاملة قريباً' : 'Full game interface will be implemented soon'}
              </p>
              <Button onClick={leaveGame} className="mt-4">
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
