import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Gamepad2, 
  Users, 
  Play, 
  Trophy, 
  Clock, 
  Target,
  ArrowLeft,
  CheckCircle,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import QuizGame from "@/components/QuizGame";

interface StartGameProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

interface GamePurchase {
  id: string;
  user_id: string;
  purchased_at: string;
  price: number;
  status: string;
  categories: GamePurchaseCategory[];
}

interface GamePurchaseCategory {
  id: string;
  game_purchase_id: string;
  category_id: string;
  team_assignment: string | null;
  category: {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
  };
}

const StartGame = ({ language, onLanguageChange }: StartGameProps) => {
  const { purchaseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [gamePurchase, setGamePurchase] = useState<GamePurchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      loadGamePurchase();
    };
    getUser();
  }, [navigate, purchaseId]);

  const loadGamePurchase = async () => {
    if (!purchaseId) return;

    try {
      // Load game purchase with categories
      const { data: purchase, error: purchaseError } = await supabase
        .from('game_purchases')
        .select(`
          *,
          categories:game_purchase_categories (
            id,
            game_purchase_id,
            category_id,
            team_assignment,
            category:categories (
              id,
              name_ar,
              name_en,
              description_ar
            )
          )
        `)
        .eq('id', purchaseId)
        .single();

      if (purchaseError) throw purchaseError;
      setGamePurchase(purchase);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في تحميل بيانات اللعبة" : "Error loading game data",
        description: error.message,
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async () => {
    if (!gamePurchase) return;

    setIsStarting(true);
    try {
      // Create a game session
      const gameData = {
        id: purchaseId, // Use the purchase ID directly as the game ID
        game_purchase_id: purchaseId,
        user_id: user.id,
        status: 'active',
        started_at: new Date().toISOString()
      };

      setGameStarted(true);
      
      toast({
        title: language === 'ar' ? "تم بدء اللعبة!" : "Game Started!",
        description: language === 'ar' 
          ? "استعد للعب مع 36 سؤال من 6 فئات"
          : "Get ready to play with 36 questions from 6 categories",
      });

    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في بدء اللعبة" : "Error starting game",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleBackToCategories = () => {
    navigate(`/select-categories/${purchaseId}`);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <main className="min-h-screen">
          <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center">
                <Skeleton className="h-12 w-96 mx-auto mb-4" />
                <Skeleton className="h-6 w-64 mx-auto mb-8" />
                <Skeleton className="h-64 w-full mb-8" />
                <Skeleton className="h-12 w-48 mx-auto" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (gameStarted && gamePurchase) {
    const selectedCategories = gamePurchase.categories || [];
    const isTeamGame = selectedCategories.some(cat => cat.team_assignment !== null);
    
    return (
      <QuizGame
        game={{ id: purchaseId, game_purchase_id: purchaseId }}
        category={null}
        language={language}
        onBack={() => setGameStarted(false)}
        isTeamGame={isTeamGame}
      />
    );
  }

  if (!gamePurchase) {
    return (
      <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <main className="min-h-screen">
          <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {language === 'ar' ? 'لعبة غير موجودة' : 'Game Not Found'}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  {language === 'ar' ? 'لم يتم العثور على بيانات اللعبة' : 'Game data not found'}
                </p>
                <Button onClick={() => navigate('/')}>
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const selectedCategories = gamePurchase.categories || [];
  const isTeamGame = selectedCategories.some(cat => cat.team_assignment !== null);
  const team1Categories = selectedCategories.filter(cat => cat.team_assignment === 'team1');
  const team2Categories = selectedCategories.filter(cat => cat.team_assignment === 'team2');

  return (
    <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <main className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={handleBackToCategories}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'العودة لاختيار الفئات' : 'Back to Category Selection'}
              </Button>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'استعد للعب!' : 'Get Ready to Play!'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                {language === 'ar' 
                  ? 'تم اختيار الفئات بنجاح. استعد للعب مع 36 سؤال متنوع!'
                  : 'Categories selected successfully. Get ready to play with 36 diverse questions!'
                }
              </p>
            </div>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-6 w-6" />
                  {language === 'ar' ? 'معلومات اللعبة' : 'Game Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">36</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? 'سؤال' : 'Questions'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">6</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? 'فئة' : 'Categories'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">3</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? 'مساعدات' : 'Lifelines'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  {language === 'ar' ? 'الفئات المختارة' : 'Selected Categories'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isTeamGame ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-600 mb-3">
                        {language === 'ar' ? 'الفريق الأول' : 'Team 1'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {team1Categories.map((cat) => (
                          <Badge key={cat.id} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {cat.category.name_ar}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-600 mb-3">
                        {language === 'ar' ? 'الفريق الثاني' : 'Team 2'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {team2Categories.map((cat) => (
                          <Badge key={cat.id} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {cat.category.name_ar}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedCategories.map((cat) => (
                      <Badge key={cat.id} className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {cat.category.name_ar}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                onClick={startGame}
                disabled={isStarting}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-4 text-xl font-semibold shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {isStarting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {language === 'ar' ? 'جاري بدء اللعبة...' : 'Starting Game...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="h-6 w-6" />
                    {language === 'ar' ? 'ابدأ اللعبة الآن!' : 'Start Game Now!'}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StartGame;
