import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Calendar, Package, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GamePurchase {
  id: string;
  purchased_at: string;
  price: number;
  status: string;
  is_used: boolean;
  categories: {
    id: string;
    name_ar: string;
    name_en: string;
  }[];
}

const MyGames = () => {
  const [gamePurchases, setGamePurchases] = useState<GamePurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
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
      loadGamePurchases(user.id);
    };
    getUser();
  }, [navigate]);

  const loadGamePurchases = async (userId: string) => {
    try {
      // Get game purchases with their categories
      const { data: purchases, error: purchasesError } = await supabase
        .from('game_purchases')
        .select(`
          id,
          purchased_at,
          price,
          status,
          is_used,
          game_purchase_categories (
            categories (
              id,
              name_ar,
              name_en
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('purchased_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      // Transform the data to flatten categories
      const transformedPurchases = (purchases || []).map(purchase => ({
        ...purchase,
        categories: purchase.game_purchase_categories?.map((gpc: any) => gpc.categories) || []
      }));

      setGamePurchases(transformedPurchases);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الألعاب",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayGame = async (purchaseId: string) => {
    try {
      // Mark the game as used
      const { error } = await supabase
        .from('game_purchases')
        .update({ is_used: true })
        .eq('id', purchaseId);

      if (error) throw error;

      // Navigate to create game with this purchase
      navigate(`/game?purchase=${purchaseId}`);
    } catch (error: any) {
      toast({
        title: "خطأ في بدء اللعبة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (gamePurchases.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent className="space-y-4">
          <Package className="h-16 w-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            لا توجد ألعاب مشتراة
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            اشتر لعبة جديدة للبدء في اللعب
          </p>
          <Button onClick={() => navigate('/buy-game')}>
            شراء لعبة جديدة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          ألعابي ({gamePurchases.length})
        </h2>
        <Button onClick={() => navigate('/buy-game')}>
          شراء لعبة جديدة
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gamePurchases.map((purchase) => (
          <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">لعبة #{purchase.id.slice(-8)}</CardTitle>
                </div>
                <Badge variant={purchase.is_used ? "secondary" : "default"}>
                  {purchase.is_used ? "مُستخدمة" : "متاحة"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                {new Date(purchase.purchased_at).toLocaleDateString('ar-SA')}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">الفئات المختارة:</h4>
                <div className="flex flex-wrap gap-1">
                  {purchase.categories.slice(0, 3).map((category) => (
                    <Badge key={category.id} variant="outline" className="text-xs">
                      {category.name_ar}
                    </Badge>
                  ))}
                  {purchase.categories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{purchase.categories.length - 3} أخرى
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full"
                  onClick={() => handlePlayGame(purchase.id)}
                  disabled={purchase.is_used}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {purchase.is_used ? "تم اللعب" : "ابدأ اللعب"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyGames;