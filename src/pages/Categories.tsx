
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, ShoppingCart, Star, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CategoriesProps {
  language: 'ar' | 'en';
}

const Categories = ({ language }: CategoriesProps) => {
  const [categories, setCategories] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name_en');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch user purchases if logged in
      if (session?.user) {
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('user_game_purchases')
          .select('category_id')
          .eq('user_id', session.user.id);

        if (purchasesError) throw purchasesError;
        setUserPurchases(purchasesData?.map(p => p.category_id) || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (categoryId: string) => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'مطلوب تسجيل الدخول' : 'Login Required',
        description: language === 'ar' ? 'يجب تسجيل الدخول لإضافة عناصر إلى السلة' : 'Please login to add items to cart',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if already in cart
      const { data: existingItem, error: checkError } = await supabase
        .from('user_cart')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingItem) {
        // Update quantity
        const { error: updateError } = await supabase
          .from('user_cart')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('user_cart')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            quantity: 1
          });

        if (insertError) throw insertError;
      }

      toast({
        title: language === 'ar' ? 'نجح الأمر' : 'Success',
        description: language === 'ar' ? 'تم إضافة العنصر إلى السلة' : 'Item added to cart',
      });

    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Grid3X3 className="h-8 w-8" />
          {language === 'ar' ? 'الفئات' : 'Categories'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const isPurchased = userPurchases.includes(category.id);
            const isFree = category.is_free;

            return (
              <Card key={category.id} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">
                      {language === 'ar' ? category.name_ar : category.name_en}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isFree && (
                        <Badge className="bg-green-500 text-white">
                          {language === 'ar' ? 'مجاني' : 'Free'}
                        </Badge>
                      )}
                      {isPurchased && (
                        <Badge className="bg-blue-500 text-white">
                          {language === 'ar' ? 'مُشترى' : 'Owned'}
                        </Badge>
                      )}
                      {!isFree && !isPurchased && (
                        <Lock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={language === 'ar' ? category.name_ar : category.name_en}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  
                  <p className="text-gray-300 text-sm">
                    {language === 'ar' ? category.description_ar : category.description_en}
                  </p>

                  <div className="flex items-center justify-between">
                    {!isFree && (
                      <span className="text-xl font-bold text-white">
                        ${category.price}
                      </span>
                    )}
                    
                    <div className="flex gap-2 ml-auto">
                      {isFree || isPurchased ? (
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Star className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'العب الآن' : 'Play Now'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => addToCart(category.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {categories.length === 0 && (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8 text-center">
              <Grid3X3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-white mb-2">
                {language === 'ar' ? 'لا توجد فئات متاحة' : 'No categories available'}
              </h2>
              <p className="text-gray-400">
                {language === 'ar' ? 'سيتم إضافة فئات جديدة قريباً' : 'New categories will be added soon'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Categories;
