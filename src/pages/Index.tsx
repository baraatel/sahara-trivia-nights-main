
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Users, Trophy, Lock, Play, Sparkles, Target, Zap, ShoppingCart, UserPlus, GamepadIcon } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import GameLobby from "@/components/GameLobby";
import UserDashboard from "@/components/UserDashboard";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface IndexProps {
  language: 'ar' | 'en';
}

const Index = ({ language }: IndexProps) => {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [gameMode, setGameMode] = useState<'single' | 'multi' | 'team' | null>(null);
  const [showGameOptions, setShowGameOptions] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch categories (limited for homepage)
  const { data: categories, isLoading } = useQuery({
    queryKey: ['featured-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .limit(6)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const handleCategorySelect = (category: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!category.is_free) {
      toast({
        title: language === 'ar' ? "فئة مدفوعة" : "Premium Category",
        description: language === 'ar' ? "هذه الفئة تتطلب الشراء" : "This category requires purchase",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedCategory(category);
    setShowGameOptions(true);
  };

  const handleGameModeSelect = (mode: 'single' | 'multi' | 'team') => {
    setGameMode(mode);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setGameMode(null);
    setShowGameOptions(false);
  };

  const handleBuyGame = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/buy-game');
  };

  const handleJoinGame = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/join-game');
  };

  const handleCreateTeam = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/create-team');
  };

  if (selectedCategory && gameMode) {
    return (
      <GameLobby 
        category={selectedCategory} 
        gameMode={gameMode}
        language={language}
        onBack={handleBackToCategories}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8">
        {selectedCategory && showGameOptions ? (
          <div className="max-w-4xl mx-auto">
            <Card className="card-character">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Gamepad2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">
                  {language === 'ar' ? selectedCategory.name_ar : selectedCategory.name_en}
                </CardTitle>
                <p className="text-muted-foreground text-lg mt-2">
                  {language === 'ar' ? selectedCategory.description_ar : selectedCategory.description_en}
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-6 text-foreground">
                    {language === 'ar' ? 'اختر نوع اللعبة' : 'Choose Game Mode'}
                  </h3>
                </div>
                
                <div className="grid gap-6">
                  <Button
                    onClick={() => handleGameModeSelect('single')}
                    className="h-20 btn-primary-gradient text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Play className="mr-3 h-7 w-7" />
                    {language === 'ar' ? 'لعب فردي' : 'Single Player'}
                  </Button>
                  
                  <Button
                    onClick={() => handleGameModeSelect('multi')}
                    className="h-20 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Users className="mr-3 h-7 w-7" />
                    {language === 'ar' ? 'لعب جماعي' : 'Multiplayer'}
                  </Button>

                  <Button
                    onClick={() => handleGameModeSelect('team')}
                    className="h-20 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <UserPlus className="mr-3 h-7 w-7" />
                    {language === 'ar' ? 'لعب بالفرق' : 'Team Play'}
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  onClick={handleBackToCategories}
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                >
                  {language === 'ar' ? 'العودة للفئات' : 'Back to Categories'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="h-4 w-4" />
                  {language === 'ar' ? 'اكتشف عالم المعرفة' : 'Discover the World of Knowledge'}
                </div>
                <h2 className="text-6xl font-bold text-gradient-primary mb-6">
                  {language === 'ar' ? 'اختبر معلوماتك' : 'Test Your Knowledge'}
                </h2>
                <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                  {language === 'ar' 
                    ? 'العب مع الأصدقاء واكتشف معلومات جديدة في بيئة تفاعلية وممتعة' 
                    : 'Play with friends and discover new knowledge in an interactive and fun environment'
                  }
                </p>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                <Button
                  onClick={handleBuyGame}
                  className="h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <ShoppingCart className="mr-3 h-6 w-6" />
                  {language === 'ar' ? 'شراء لعبة' : 'Buy Game'}
                </Button>
                
                <Button
                  onClick={handleJoinGame}
                  className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <GamepadIcon className="mr-3 h-6 w-6" />
                  {language === 'ar' ? 'انضم للعبة' : 'Join Game'}
                </Button>
                
                <Button
                  onClick={handleCreateTeam}
                  className="h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <UserPlus className="mr-3 h-6 w-6" />
                  {language === 'ar' ? 'إنشاء فريق' : 'Create Team'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {language === 'ar' ? 'تحديات ممتعة' : 'Fun Challenges'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'أسئلة متنوعة ومثيرة' : 'Diverse and exciting questions'}
                  </p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {language === 'ar' ? 'لعب جماعي' : 'Multiplayer'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'تنافس مع الأصدقاء' : 'Compete with friends'}
                  </p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {language === 'ar' ? 'سهل الاستخدام' : 'Easy to Play'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'واجهة بسيطة وواضحة' : 'Simple and clear interface'}
                  </p>
                </div>
              </div>
            </div>

            {/* Featured Categories */}
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
                <div>
                  <h3 className="text-4xl font-bold text-foreground mb-2">
                    {language === 'ar' ? 'الفئات المميزة' : 'Featured Categories'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'اختر من بين مجموعة متنوعة من الفئات' : 'Choose from a variety of categories'}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/categories')}
                  variant="outline" 
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105 shadow-md"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                </Button>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="card-character overflow-hidden">
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-6" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categories?.map((category, index) => (
                    <Card
                      key={category.id}
                      className="card-character hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-2 overflow-hidden group"
                      onClick={() => handleCategorySelect(category)}
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                            {language === 'ar' ? category.name_ar : category.name_en}
                          </h4>
                          {!category.is_free && (
                            <Badge className="bg-accent text-accent-foreground shadow-md">
                              <Lock className="h-3 w-3 mr-1" />
                              {language === 'ar' ? 'مدفوع' : 'Premium'}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                          {language === 'ar' ? category.description_ar : category.description_en}
                        </p>
                        
                        <div className="flex justify-between items-center">
                          {category.is_free ? (
                            <Badge className="bg-primary text-primary-foreground shadow-md">
                              {language === 'ar' ? 'مجاني' : 'Free'}
                            </Badge>
                          ) : (
                            <Badge className="bg-accent text-accent-foreground shadow-md">
                              ${category.price}
                            </Badge>
                          )}
                          
                          <Button
                            size="sm"
                            className="btn-primary-gradient shadow-md transition-all duration-200 hover:scale-105"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {language === 'ar' ? 'العب الآن' : 'Play Now'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)}
            language={language}
          />
        )}

        {/* User Dashboard */}
        {showUserDashboard && user && (
          <UserDashboard
            user={user}
            language={language}
            onClose={() => setShowUserDashboard(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
