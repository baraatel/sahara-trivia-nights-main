import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, ShoppingCart, Trophy, TrendingUp, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserDashboardProps {
  user: any;
  language: 'ar' | 'en';
  onClose: () => void;
}

const UserDashboard = ({ user, language, onClose }: UserDashboardProps) => {
  const [userStats, setUserStats] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Stats error:', statsError);
      } else {
        setUserStats(stats);
      }

      // Fetch user purchases
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('user_game_purchases')
        .select(`
          *,
          categories (name_ar, name_en, description_ar, description_en)
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (purchaseError) {
        console.error('Purchase error:', purchaseError);
      } else {
        setPurchases(purchaseData || []);
      }

      // Fetch available categories for purchase
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_free', false)
        .order('name_en');

      if (categoryError) {
        console.error('Category error:', categoryError);
      } else {
        setCategories(categoryData || []);
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (categoryId: string, amount: number) => {
    try {
      const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`;
      
      const { error } = await supabase
        .from('user_game_purchases')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          amount: amount,
          payment_provider: 'stripe',
          transaction_id: `txn_${Date.now()}`,
          status: 'completed',
          order_id: orderId,
          order_status: 'completed'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: language === 'ar' ? "تم الشراء بنجاح" : "Purchase successful",
      });

      fetchUserData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderPurchasesTab = () => (
    <TabsContent value="purchases">
      <div className="space-y-4">
        {purchases.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                {language === 'ar' ? 'لا توجد مشتريات حتى الآن' : 'No purchases yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          purchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">
                        {language === 'ar' ? purchase.categories?.name_ar : purchase.categories?.name_en}
                      </h3>
                      <Badge className={
                        purchase.refund_status === 'completed' ? 'bg-red-500' :
                        purchase.order_status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      }>
                        {purchase.refund_status === 'completed' ? 
                          (language === 'ar' ? 'مُسترد' : 'Refunded') :
                          purchase.order_status
                        }
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? purchase.categories?.description_ar : purchase.categories?.description_en}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        <strong>{language === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</strong> {purchase.order_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {language === 'ar' ? 'تاريخ الشراء:' : 'Purchased:'} {new Date(purchase.purchased_at).toLocaleDateString()}
                      </p>
                      {purchase.refund_status === 'completed' && (
                        <p className="text-xs text-red-600">
                          <strong>{language === 'ar' ? 'مُسترد:' : 'Refunded:'}</strong> ${purchase.refund_amount} 
                          {purchase.refunded_at && ` on ${new Date(purchase.refunded_at).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${purchase.amount}</p>
                    {purchase.refund_status !== 'completed' && (
                      <Badge className="bg-green-500">Active</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </TabsContent>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            {language === 'ar' ? 'لوحة المستخدم' : 'User Dashboard'}
          </CardTitle>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
              </TabsTrigger>
              <TabsTrigger value="purchases" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {language === 'ar' ? 'المشتريات' : 'Purchases'}
              </TabsTrigger>
              <TabsTrigger value="store" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {language === 'ar' ? 'المتجر' : 'Store'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">{userStats?.games_played || 0}</p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'الألعاب المُلعبة' : 'Games Played'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{userStats?.total_score || 0}</p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'النقاط الإجمالية' : 'Total Score'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="h-8 w-8 mx-auto mb-2 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      Q
                    </div>
                    <p className="text-2xl font-bold">{userStats?.questions_answered || 0}</p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'الأسئلة المُجابة' : 'Questions Answered'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="h-8 w-8 mx-auto mb-2 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    <p className="text-2xl font-bold">{userStats?.correct_answers || 0}</p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'الإجابات الصحيحة' : 'Correct Answers'}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {userStats?.questions_answered > 0 && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">
                      {language === 'ar' ? 'معدل الدقة' : 'Accuracy Rate'}
                    </h3>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-500 h-4 rounded-full transition-all duration-300"
                        style={{
                          width: `${((userStats.correct_answers / userStats.questions_answered) * 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-center mt-2 text-lg font-semibold">
                      {Math.round((userStats.correct_answers / userStats.questions_answered) * 100)}%
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {renderPurchasesTab()}

            <TabsContent value="store">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.filter(cat => !purchases.some(p => p.category_id === cat.id)).map((category) => (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">
                        {language === 'ar' ? category.name_ar : category.name_en}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {language === 'ar' ? category.description_ar : category.description_en}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">${category.price}</span>
                        <Button 
                          onClick={() => handlePurchase(category.id, category.price)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          {language === 'ar' ? 'شراء' : 'Buy Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {categories.filter(cat => !purchases.some(p => p.category_id === cat.id)).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">
                      {language === 'ar' ? 'لقد اشتريت جميع الفئات المتاحة' : 'You have purchased all available categories'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
