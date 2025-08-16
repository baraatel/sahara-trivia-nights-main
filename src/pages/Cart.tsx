
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CartProps {
  language: 'ar' | 'en';
}

const Cart = ({ language }: CartProps) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_cart')
        .select(`
          *,
          categories (
            id,
            name_ar,
            name_en,
            description_ar,
            description_en,
            price,
            image_url
          )
        `)
        .eq('user_id', session.user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل السلة' : 'Failed to load cart',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('user_cart')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('user_cart')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(cartItems.filter(item => item.id !== itemId));
      toast({
        title: language === 'ar' ? 'نجح الأمر' : 'Success',
        description: language === 'ar' ? 'تم حذف العنصر من السلة' : 'Item removed from cart',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.categories?.price * item.quantity);
    }, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Process each item in the cart
      for (const item of cartItems) {
        await supabase
          .from('user_game_purchases')
          .insert({
            user_id: session.user.id,
            category_id: item.categories.id,
            amount: item.categories.price * item.quantity,
            payment_provider: 'stripe',
            transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'completed'
          });
      }

      // Clear the cart
      await supabase
        .from('user_cart')
        .delete()
        .eq('user_id', session.user.id);

      toast({
        title: language === 'ar' ? 'نجح الأمر' : 'Success',
        description: language === 'ar' ? 'تم الشراء بنجاح' : 'Purchase completed successfully',
      });

      setCartItems([]);
      navigate('/profile');
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          {language === 'ar' ? 'السلة' : 'Shopping Cart'}
        </h1>

        {cartItems.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-white mb-2">
                {language === 'ar' ? 'سلتك فارغة' : 'Your cart is empty'}
              </h2>
              <p className="text-gray-400 mb-4">
                {language === 'ar' ? 'ابدأ بإضافة بعض الفئات إلى سلتك' : 'Start by adding some categories to your cart'}
              </p>
              <Button onClick={() => navigate('/categories')}>
                {language === 'ar' ? 'تصفح الفئات' : 'Browse Categories'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="bg-white/10 border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {item.categories?.image_url && (
                        <img
                          src={item.categories.image_url}
                          alt={language === 'ar' ? item.categories.name_ar : item.categories.name_en}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {language === 'ar' ? item.categories?.name_ar : item.categories?.name_en}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {language === 'ar' ? item.categories?.description_ar : item.categories?.description_en}
                        </p>
                        <p className="text-lg font-bold text-white mt-1">
                          ${item.categories?.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-white min-w-[2rem] text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                          className="ml-2 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="bg-white/10 border-white/20 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white">
                    {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          {language === 'ar' ? item.categories?.name_ar : item.categories?.name_en} × {item.quantity}
                        </span>
                        <span className="text-white">
                          ${(item.categories?.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">
                        {language === 'ar' ? 'المجموع' : 'Total'}
                      </span>
                      <span className="text-white">${calculateTotal()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {processing 
                      ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...') 
                      : (language === 'ar' ? 'إتمام الشراء' : 'Complete Purchase')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
