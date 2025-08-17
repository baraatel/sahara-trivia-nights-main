import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Star, Users, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  image_url?: string;
  difficulty_level?: number;
  question_count?: number;
  avg_score?: number;
}

interface SelectCategoriesProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const SelectCategories = ({ language, onLanguageChange }: SelectCategoriesProps) => {
  const { purchaseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [team1Categories, setTeam1Categories] = useState<string[]>([]);
  const [team2Categories, setTeam2Categories] = useState<string[]>([]);
  const [currentTeam, setCurrentTeam] = useState<'team1' | 'team2'>('team1');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (loadError) {
      toast({
        title: "خطأ في تحميل الفئات",
        description: loadError,
        variant: "destructive",
      });
    }
  }, [loadError, toast]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_ar, name_en, description_ar, image_url')
        .order('name_ar');

      if (error) throw error;
      
      // Load additional stats separately
      const categoriesWithStats = await Promise.all(
        (data || []).map(async (category) => {
          // Get question count
          const { count: questionCount } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            difficulty_level: Math.floor(Math.random() * 5) + 1, // Random difficulty for now
            question_count: questionCount || 0,
            avg_score: 75 // Default average score
          };
        })
      );

      setCategories(categoriesWithStats);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error.message);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (showTeamSelection) {
      // Team selection mode
      if (currentTeam === 'team1') {
        setTeam1Categories(prev => {
          if (prev.includes(categoryId)) {
            return prev.filter(id => id !== categoryId);
          } else if (prev.length < 3) {
            // Check if category is already selected by team2
            if (team2Categories.includes(categoryId)) {
              toast({
                title: "لا يمكن اختيار نفس الفئة للفريقين",
                description: "هذه الفئة مختارة بالفعل للفريق الثاني",
                variant: "destructive",
              });
              return prev;
            }
            return [...prev, categoryId];
          } else {
            toast({
              title: "لا يمكن اختيار أكثر من 3 فئات للفريق الأول",
              description: "يرجى إلغاء تحديد فئة أخرى أولاً",
              variant: "destructive",
            });
            return prev;
          }
        });
      } else {
        setTeam2Categories(prev => {
          if (prev.includes(categoryId)) {
            return prev.filter(id => id !== categoryId);
          } else if (prev.length < 3) {
            // Check if category is already selected by team1
            if (team1Categories.includes(categoryId)) {
              toast({
                title: "لا يمكن اختيار نفس الفئة للفريقين",
                description: "هذه الفئة مختارة بالفعل للفريق الأول",
                variant: "destructive",
              });
              return prev;
            }
            return [...prev, categoryId];
          } else {
            toast({
              title: "لا يمكن اختيار أكثر من 3 فئات للفريق الثاني",
              description: "يرجى إلغاء تحديد فئة أخرى أولاً",
              variant: "destructive",
            });
            return prev;
          }
        });
      }
    } else {
      // Regular selection mode
      setSelectedCategories(prev => {
        if (prev.includes(categoryId)) {
          return prev.filter(id => id !== categoryId);
        } else if (prev.length < 6) {
          return [...prev, categoryId];
        } else {
          toast({
            title: "لا يمكن اختيار أكثر من 6 فئات",
            description: "يرجى إلغاء تحديد فئة أخرى أولاً",
            variant: "destructive",
          });
          return prev;
        }
      });
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-blue-600 bg-blue-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 4: return 'text-orange-600 bg-orange-100';
      case 5: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'سهل';
      case 2: return 'متوسط';
      case 3: return 'صعب';
      case 4: return 'صعب جداً';
      case 5: return 'خبير';
      default: return 'غير محدد';
    }
  };

  const handleConfirmSelection = async () => {
    if (showTeamSelection) {
      if (team1Categories.length !== 3 || team2Categories.length !== 3) {
        toast({
          title: "يجب اختيار 3 فئات لكل فريق",
          description: `الفريق الأول: ${team1Categories.length}/3 | الفريق الثاني: ${team2Categories.length}/3`,
          variant: "destructive",
        });
        return;
      }
      
      // Check for duplicate categories between teams
      const allCategories = [...team1Categories, ...team2Categories];
      const uniqueCategories = new Set(allCategories);
      if (uniqueCategories.size !== allCategories.length) {
        toast({
          title: "خطأ في اختيار الفئات",
          description: "لا يمكن اختيار نفس الفئة للفريقين",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (selectedCategories.length !== 6) {
        toast({
          title: "يجب اختيار 6 فئات بالضبط",
          description: `لقد اخترت ${selectedCategories.length} فئات من أصل 6`,
          variant: "destructive",
        });
        return;
      }
      
      // Check for duplicate categories
      const uniqueCategories = new Set(selectedCategories);
      if (uniqueCategories.size !== selectedCategories.length) {
        toast({
          title: "خطأ في اختيار الفئات",
          description: "لا يمكن اختيار نفس الفئة مرتين",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const categoriesToSave = showTeamSelection 
        ? [...team1Categories, ...team2Categories]
        : selectedCategories;

      try {
        // First, delete any existing categories for this purchase to avoid duplicates
        const { error: deleteError } = await supabase
          .from('game_purchase_categories')
          .delete()
          .eq('game_purchase_id', purchaseId);

        if (deleteError) throw deleteError;

        // Insert selected categories for this game purchase
        const categoryInserts = categoriesToSave.map(categoryId => ({
          game_purchase_id: purchaseId,
          category_id: categoryId,
          team_assignment: showTeamSelection 
            ? (team1Categories.includes(categoryId) ? 'team1' : 'team2')
            : null
        }));

        const { error } = await supabase
          .from('game_purchase_categories')
          .insert(categoryInserts);

        if (error) {
          // If there's still a duplicate error, try a different approach
          if (error.message.includes('duplicate key value')) {
            // Use upsert instead
            const { error: upsertError } = await supabase
              .from('game_purchase_categories')
              .upsert(categoryInserts, { 
                onConflict: 'game_purchase_id,category_id',
                ignoreDuplicates: true 
              });
            
            if (upsertError) throw upsertError;
          } else {
            throw error;
          }
        }
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        throw new Error(`خطأ في قاعدة البيانات: ${dbError.message}`);
      }

      toast({
        title: "تم حفظ اختيارك بنجاح!",
        description: showTeamSelection 
          ? "تم تقسيم الفئات بين الفريقين بنجاح - 36 سؤال من 6 فئات"
          : "تم اختيار 6 فئات بنجاح - 36 سؤال متنوع",
      });

      // Navigate to start game page
      navigate(`/start-game/${purchaseId}`);
    } catch (error: any) {
      toast({
        title: "خطأ في حفظ الاختيار",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTeamSelection = () => {
    setShowTeamSelection(!showTeamSelection);
    setSelectedCategories([]);
    setTeam1Categories([]);
    setTeam2Categories([]);
    setCurrentTeam('team1');
  };

  const getStrategicTips = () => {
    if (!showTeamSelection) {
      return [
        "🎯 اختر فئات متنوعة في الصعوبة لضمان التحدي",
        "📚 ركز على الفئات التي تعرفها جيداً",
        "⚖️ وازن بين الفئات السهلة والصعبة",
        "🎲 كل فئة تحتوي على 6 أسئلة مرتبة من الأسهل للأصعب",
        "💡 الأسئلة الأصعب تعطي نقاط أكثر (10-50 نقطة)"
      ];
    }

    const team1Difficulty = team1Categories
      .map(id => categories.find(c => c.id === id)?.difficulty_level || 1)
      .reduce((sum, diff) => sum + diff, 0) / Math.max(team1Categories.length, 1);

    const team2Difficulty = team2Categories
      .map(id => categories.find(c => c.id === id)?.difficulty_level || 1)
      .reduce((sum, diff) => sum + diff, 0) / Math.max(team2Categories.length, 1);

    const tips = [
      "🎯 وازن الصعوبة بين الفريقين لضمان المنافسة العادلة",
      "📊 الفريق الأول متوسط الصعوبة: " + Math.round(team1Difficulty * 10) / 10,
      "📊 الفريق الثاني متوسط الصعوبة: " + Math.round(team2Difficulty * 10) / 10,
      "🎲 كل فريق يحصل على 18 سؤال (3 فئات × 6 أسئلة)",
      "💡 الأسئلة الأصعب تعطي نقاط أكثر (10-50 نقطة)"
    ];

    if (Math.abs(team1Difficulty - team2Difficulty) > 1) {
      tips.push("⚠️ الفرق في الصعوبة كبير - فكر في إعادة التوازن");
    } else {
      tips.push("✅ التوازن جيد بين الفريقين");
    }

    return tips;
  };

  const getCategoryRecommendations = () => {
    if (!showTeamSelection) return null;

    const availableCategories = categories.filter(cat => 
      !team1Categories.includes(cat.id) && !team2Categories.includes(cat.id)
    );

    const currentTeamCategories = currentTeam === 'team1' ? team1Categories : team2Categories;
    const currentTeamDifficulty = currentTeamCategories
      .map(id => categories.find(c => c.id === id)?.difficulty_level || 1)
      .reduce((sum, diff) => sum + diff, 0) / Math.max(currentTeamCategories.length, 1);

    // Recommend categories that would balance the team
    const recommendations = availableCategories
      .map(cat => ({
        ...cat,
        balanceScore: Math.abs((currentTeamDifficulty + cat.difficulty_level) / 2 - 3) // Closer to 3 (medium) is better
      }))
      .sort((a, b) => a.balanceScore - b.balanceScore)
      .slice(0, 3);

    return recommendations;
  };

  return (
    <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <main className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {showTeamSelection ? 'اختر الفئات للفريقين' : 'اختر 6 فئات للعبتك'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              {showTeamSelection 
                ? 'اختر 3 فئات لكل فريق - 36 سؤال (6 أسئلة لكل فئة)'
                : 'اختر بالضبط 6 فئات - 36 سؤال (6 أسئلة لكل فئة)'
              }
            </p>
            
            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant={showTeamSelection ? "default" : "outline"}
                onClick={toggleTeamSelection}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {showTeamSelection ? 'وضع الفرق مفعل' : 'وضع الفرق'}
              </Button>
              
              {showTeamSelection ? (
                <div className="flex gap-4">
                  <Badge variant={team1Categories.length === 3 ? "default" : "secondary"} className="text-lg px-4 py-2">
                    الفريق الأول: {team1Categories.length} / 3
                  </Badge>
                  <Badge variant={team2Categories.length === 3 ? "default" : "secondary"} className="text-lg px-4 py-2">
                    الفريق الثاني: {team2Categories.length} / 3
                  </Badge>
                </div>
              ) : (
                <Badge variant={selectedCategories.length === 6 ? "default" : "secondary"} className="text-lg px-4 py-2">
                  {selectedCategories.length} / 6 فئات مختارة
                </Badge>
              )}
            </div>

            {showTeamSelection && (
              <div className="flex justify-center gap-4 mb-4">
                <Button
                  variant={currentTeam === 'team1' ? "default" : "outline"}
                  onClick={() => setCurrentTeam('team1')}
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  الفريق الأول
                </Button>
                <Button
                  variant={currentTeam === 'team2' ? "default" : "outline"}
                  onClick={() => setCurrentTeam('team2')}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  الفريق الثاني
                </Button>
              </div>
            )}

            {/* Strategic Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 نصائح استراتيجية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
                {getStrategicTips().map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-300">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Recommendations */}
            {showTeamSelection && getCategoryRecommendations() && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  🎯 توصيات للفريق {currentTeam === 'team1' ? 'الأول' : 'الثاني'}
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                  هذه الفئات ستساعد في تحقيق توازن أفضل:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {getCategoryRecommendations()?.map((rec) => (
                    <div 
                      key={rec.id}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-300 dark:border-green-700 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                      onClick={() => handleCategoryToggle(rec.id)}
                    >
                      <div className="font-medium text-green-900 dark:text-green-100">
                        {rec.name_ar}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        صعوبة: {getDifficultyText(rec.difficulty_level)}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {rec.question_count} سؤال
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {categories.map((category) => {
              const isSelected = showTeamSelection 
                ? (team1Categories.includes(category.id) || team2Categories.includes(category.id))
                : selectedCategories.includes(category.id);
              
              const isTeam1Selected = team1Categories.includes(category.id);
              const isTeam2Selected = team2Categories.includes(category.id);
              
              const canSelect = showTeamSelection 
                ? (currentTeam === 'team1' ? team1Categories.length < 3 : team2Categories.length < 3) || isSelected
                : selectedCategories.length < 6 || isSelected;

              return (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? isTeam1Selected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : isTeam2Selected 
                          ? 'ring-2 ring-green-500 bg-green-50'
                          : 'ring-2 ring-primary bg-primary/5' 
                      : canSelect 
                        ? 'hover:shadow-lg hover:scale-105' 
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canSelect && handleCategoryToggle(category.id)}
                >
                  <CardHeader className="relative">
                    <div className="absolute top-4 right-4">
                      {isSelected ? (
                        <div className="flex items-center gap-1">
                          {isTeam1Selected && <Badge variant="default" className="bg-blue-500">1</Badge>}
                          {isTeam2Selected && <Badge variant="default" className="bg-green-500">2</Badge>}
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        </div>
                      ) : canSelect ? (
                        <div className="h-6 w-6 border-2 border-gray-300 rounded-full" />
                      ) : (
                        <XCircle className="h-6 w-6 text-gray-300" />
                      )}
                    </div>
                    
                    {category.image_url && (
                      <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={category.image_url} 
                          alt={category.name_ar}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <CardTitle className="text-xl">{category.name_ar}</CardTitle>
                    {category.name_en && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.name_en}
                      </p>
                    )}

                    {/* Difficulty and Stats */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {category.difficulty_level && (
                        <Badge className={getDifficultyColor(category.difficulty_level)}>
                          <Star className="h-3 w-3 mr-1" />
                          {getDifficultyText(category.difficulty_level)}
                        </Badge>
                      )}
                      {category.question_count && (
                        <Badge variant="outline">
                          {category.question_count} سؤال
                        </Badge>
                      )}
                      {category.avg_score && (
                        <Badge variant="outline">
                          متوسط: {Math.round(category.avg_score)}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  {category.description_ar && (
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description_ar}
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="px-12 py-4 text-lg"
              onClick={handleConfirmSelection}
              disabled={
                showTeamSelection 
                  ? (team1Categories.length !== 3 || team2Categories.length !== 3)
                  : selectedCategories.length !== 6 || isLoading
              }
            >
              {isLoading ? "جاري الحفظ..." : "تأكيد الاختيار والمتابعة"}
            </Button>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
};

export default SelectCategories;