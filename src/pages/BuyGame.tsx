import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, ShoppingCart, Star, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type GamePackage = Tables<"game_packages"> & {
  features?: Tables<"game_package_features">[];
};

type PackageFeature = Tables<"game_package_features">;

interface BuyGameProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const BuyGame = ({ language, onLanguageChange }: BuyGameProps) => {
  const [user, setUser] = useState<any>(null);
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);
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

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      
      // Load active packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('game_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (packagesError) throw packagesError;

      // Load features for each package
      const packagesWithFeatures = await Promise.all(
        (packagesData || []).map(async (pkg) => {
          const { data: featuresData, error: featuresError } = await supabase
            .from('game_package_features')
            .select('*')
            .eq('package_id', pkg.id)
            .order('sort_order');

          if (featuresError) throw featuresError;

          return {
            ...pkg,
            features: featuresData || []
          };
        })
      );

      setPackages(packagesWithFeatures);
      
      // Set the first package as selected by default
      if (packagesWithFeatures.length > 0) {
        setSelectedPackage(packagesWithFeatures[0]);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الحزم",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePurchaseGame = async () => {
    if (!user || !selectedPackage) return;

    setIsLoading(true);
    try {
      // Create multiple game purchases based on games_count
      const gamePurchases = [];
      
      for (let i = 0; i < selectedPackage.games_count; i++) {
        const { data: gamePurchase, error: purchaseError } = await supabase
          .from('game_purchases')
          .insert({
            user_id: user.id,
            price: selectedPackage.price / selectedPackage.games_count, // Divide price by number of games
            status: 'active',
            is_used: false,
            package_id: selectedPackage.id
          })
          .select()
          .single();

        if (purchaseError) throw purchaseError;
        gamePurchases.push(gamePurchase);
      }

      toast({
        title: "تم شراء الحزمة بنجاح!",
        description: `تم إنشاء ${selectedPackage.games_count} لعبة بنجاح`,
      });

      // Navigate to category selection with the first purchase ID
      if (gamePurchases.length > 0) {
        navigate(`/select-categories/${gamePurchases[0].id}`);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الشراء",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'CheckCircle':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Star':
      default:
        return <Star className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (loadingPackages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            شراء حزمة ألعاب
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            اختر الحزمة المناسبة لك واستمتع بتجربة لعب مميزة
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              لا توجد حزم ألعاب متاحة حالياً
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPackage?.id === pkg.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-lg hover:scale-105'
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <CardHeader className="text-center relative">
                    {pkg.is_popular && (
                      <Badge variant="secondary" className="absolute top-4 right-4">
                        الأكثر شعبية
                      </Badge>
                    )}
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <Gamepad2 className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{pkg.name_ar}</CardTitle>
                    {pkg.description_ar && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {pkg.description_ar}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">${pkg.price}</div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {pkg.games_count} {pkg.games_count === 1 ? 'لعبة' : 'ألعاب'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {pkg.features?.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          {getIconComponent(feature.icon || 'Star')}
                          <span className="text-sm">{feature.feature_ar}</span>
                        </div>
                      ))}
                    </div>

                    {pkg.games_count > 1 && (
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                          توفير ${((pkg.games_count * 9.99) - pkg.price).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedPackage && (
              <div className="grid md:grid-cols-2 gap-8 items-start">
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
                        <h4 className="font-semibold">اشتر الحزمة</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          اشتر حزمة {selectedPackage.name_ar} مقابل ${selectedPackage.price}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">اختر الفئات</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          اختر 6 فئات مختلفة لكل لعبة من الفئات المتاحة
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

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>تفاصيل الحزمة المختارة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>اسم الحزمة:</span>
                        <span className="font-medium">{selectedPackage.name_ar}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>عدد الألعاب:</span>
                        <span className="font-medium">{selectedPackage.games_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>السعر الإجمالي:</span>
                        <span className="font-medium text-primary">${selectedPackage.price}</span>
                      </div>
                      {selectedPackage.games_count > 1 && (
                        <div className="flex justify-between items-center">
                          <span>السعر لكل لعبة:</span>
                          <span className="font-medium text-green-600">
                            ${(selectedPackage.price / selectedPackage.games_count).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg"
                    onClick={handlePurchaseGame}
                    disabled={isLoading || !user}
                  >
                    {isLoading ? "جاري الشراء..." : `شراء ${selectedPackage.name_ar}`}
                  </Button>

                  <p className="text-sm text-gray-500 text-center">
                    ستتم إعادة توجيهك لاختيار الفئات بعد الشراء
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BuyGame;