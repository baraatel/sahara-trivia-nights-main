import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  image_url?: string;
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
    loadCategories();
  }, [navigate]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_ar, name_en, description_ar, image_url')
        .order('name_ar');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الفئات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
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
  };

  const handleConfirmSelection = async () => {
    if (selectedCategories.length !== 6) {
      toast({
        title: "يجب اختيار 6 فئات بالضبط",
        description: `لقد اخترت ${selectedCategories.length} فئات من أصل 6`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Insert selected categories for this game purchase
      const categoryInserts = selectedCategories.map(categoryId => ({
        game_purchase_id: purchaseId,
        category_id: categoryId
      }));

      const { error } = await supabase
        .from('game_purchase_categories')
        .insert(categoryInserts);

      if (error) throw error;

      toast({
        title: "تم حفظ اختيارك بنجاح!",
        description: "يمكنك الآن إنشاء لعبة جديدة باستخدام هذه الفئات",
      });

      navigate('/game');
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

  return (
    <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} />
      <main className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              اختر 6 فئات للعبتك
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              اختر بالضبط 6 فئات للحصول على أسئلة متنوعة ومثيرة
            </p>
            <Badge variant={selectedCategories.length === 6 ? "default" : "secondary"} className="text-lg px-4 py-2">
              {selectedCategories.length} / 6 فئات مختارة
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const canSelect = selectedCategories.length < 6 || isSelected;

              return (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : canSelect 
                        ? 'hover:shadow-lg hover:scale-105' 
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canSelect && handleCategoryToggle(category.id)}
                >
                  <CardHeader className="relative">
                    <div className="absolute top-4 right-4">
                      {isSelected ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
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
              disabled={selectedCategories.length !== 6 || isLoading}
            >
              {isLoading ? "جاري الحفظ..." : "تأكيد الاختيار والمتابعة"}
            </Button>
          </div>
        </div>
      </div>
      </main>
      <Footer language={language} />
    </div>
  );
};

export default SelectCategories;