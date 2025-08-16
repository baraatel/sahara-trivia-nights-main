
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Users, Trophy, Lock, Play } from "lucide-react";
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
  const [gameMode, setGameMode] = useState<'single' | 'multi' | null>(null);
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
  };

  const handleGameModeSelect = (mode: 'single' | 'multi') => {
    setGameMode(mode);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setGameMode(null);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {selectedCategory ? (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-center text-2xl text-foreground">
                  {language === 'ar' ? selectedCategory.name_ar : selectedCategory.name_en}
                </CardTitle>
                <p className="text-center text-muted-foreground">
                  {language === 'ar' ? selectedCategory.description_ar : selectedCategory.description_en}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl mb-4 text-foreground">
                    {language === 'ar' ? 'اختر نوع اللعبة' : 'Choose Game Mode'}
                  </h3>
                </div>
                
                <div className="grid gap-4">
                  <Button
                    onClick={() => handleGameModeSelect('single')}
                    className="h-16 bg-primary hover:bg-primary/90 text-primary-foreground text-lg"
                  >
                    <Play className="mr-2 h-6 w-6" />
                    {language === 'ar' ? 'لعب فردي' : 'Single Player'}
                  </Button>
                  
                  <Button
                    onClick={() => handleGameModeSelect('multi')}
                    className="h-16 bg-accent hover:bg-accent/90 text-accent-foreground text-lg"
                  >
                    <Users className="mr-2 h-6 w-6" />
                    {language === 'ar' ? 'لعب جماعي' : 'Multiplayer'}
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  onClick={handleBackToCategories}
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {language === 'ar' ? 'العودة للفئات' : 'Back to Categories'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-foreground mb-4">
                {language === 'ar' ? 'اختبر معلوماتك' : 'Test Your Knowledge'}
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                {language === 'ar' 
                  ? 'العب مع الأصدقاء واكتشف معلومات جديدة' 
                  : 'Play with friends and discover new knowledge'
                }
              </p>
              
              <div className="flex justify-center gap-8 text-foreground">
                <div className="text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'تحديات ممتعة' : 'Fun Challenges'}
                  </p>
                </div>
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'لعب جماعي' : 'Multiplayer'}
                  </p>
                </div>
                <div className="text-center">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'سهل الاستخدام' : 'Easy to Play'}
                  </p>
                </div>
              </div>
            </div>

            {/* Featured Categories */}
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-foreground">
                  {language === 'ar' ? 'الفئات المميزة' : 'Featured Categories'}
                </h3>
                <Button 
                  onClick={() => navigate('/categories')}
                  variant="outline" 
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                </Button>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-6 h-48" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories?.map((category) => (
                    <Card
                      key={category.id}
                      className="bg-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
                      onClick={() => handleCategorySelect(category)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-bold text-foreground">
                            {language === 'ar' ? category.name_ar : category.name_en}
                          </h4>
                          {!category.is_free && (
                            <Badge className="bg-accent text-accent-foreground">
                              <Lock className="h-3 w-3 mr-1" />
                              {language === 'ar' ? 'مدفوع' : 'Premium'}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4">
                          {language === 'ar' ? category.description_ar : category.description_en}
                        </p>
                        
                        <div className="flex justify-between items-center">
                          {category.is_free ? (
                            <Badge className="bg-primary text-primary-foreground">
                              {language === 'ar' ? 'مجاني' : 'Free'}
                            </Badge>
                          ) : (
                            <Badge className="bg-accent text-accent-foreground">
                              ${category.price}
                            </Badge>
                          )}
                          
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
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
