import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, ShoppingCart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface BuyGameProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const BuyGame = ({ language, onLanguageChange }: BuyGameProps) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const handlePurchaseGame = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Create a new game purchase
      const { data: gamePurchase, error: purchaseError } = await supabase
        .from('game_purchases')
        .insert({
          user_id: user.id,
          price: 9.99,
          status: 'active',
          is_used: false
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      toast({
        title: "تم شراء اللعبة بنجاح!",
        description: "يمكنك الآن اختيار 6 فئات للعب",
      });

      // Navigate to category selection with the purchase ID
      navigate(`/select-categories/${gamePurchase.id}`);
    } catch (error: any) {
      toast({
        title: "خطأ في الشراء",
        description: error.message || "حدث خطأ أثناء شراء اللعبة",
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              شراء لعبة جديدة
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              اشتر لعبة واختر 6 فئات للحصول على أسئلة عشوائية وفريدة
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <Card className="h-full">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Gamepad2 className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">حزمة لعبة واحدة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">$9.99</div>
                  <p className="text-gray-600 dark:text-gray-400">لعبة واحدة</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>اختيار 6 فئات مختلفة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>أسئلة عشوائية وفريدة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>لا تتكرر الأسئلة بين الألعاب</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>تجربة لعب مميزة</span>
                  </div>
                </div>

                <Badge variant="secondary" className="w-full justify-center">
                  الأكثر شعبية
                </Badge>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    كيف تعمل؟
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">اشتر اللعبة</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        اشتر حزمة لعبة واحدة مقابل $9.99
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">اختر 6 فئات</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        اختر 6 فئات مختلفة من الفئات المتاحة
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">العب واستمتع</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        احصل على أسئلة عشوائية وفريدة من الفئات المختارة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg"
                onClick={handlePurchaseGame}
                disabled={isLoading || !user}
              >
                {isLoading ? "جاري الشراء..." : "شراء اللعبة الآن"}
              </Button>

              <p className="text-sm text-gray-500 text-center">
                ستتم إعادة توجيهك لاختيار الفئات بعد الشراء
              </p>
            </div>
          </div>
        </div>
      </div>
      </main>
      <Footer language={language} />
    </div>
  );
};

export default BuyGame;