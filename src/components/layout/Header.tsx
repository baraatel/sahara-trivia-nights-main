
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, User, ShoppingCart, Trophy, Home, Grid3X3, LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import LanguageSelector from "@/components/ui/language-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const Header = ({ language, onLanguageChange }: HeaderProps) => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        fetchCartCount(session.user.id);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCartCount(session.user.id);
      } else {
        setCartCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCartCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_cart')
        .select('quantity')
        .eq('user_id', userId);

      if (error) throw error;
      
      const totalCount = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(totalCount);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {language === 'ar' ? 'لعبة المسابقات' : 'Trivia Game'}
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button 
                variant={isActive('/') ? "default" : "ghost"} 
                size="sm" 
                className={isActive('/') ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground"}
              >
                <Home className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </Button>
            </Link>
            
            <Link to="/categories">
              <Button 
                variant={isActive('/categories') ? "default" : "ghost"} 
                size="sm" 
                className={isActive('/categories') ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground"}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'الفئات' : 'Categories'}
              </Button>
            </Link>
            
            <Link to="/game">
              <Button 
                variant={isActive('/game') ? "default" : "ghost"} 
                size="sm" 
                className={isActive('/game') ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground"}
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'الألعاب' : 'Games'}
              </Button>
            </Link>
            
            <Link to="/leaderboard">
              <Button 
                variant={isActive('/leaderboard') ? "default" : "ghost"} 
                size="sm" 
                className={isActive('/leaderboard') ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground"}
              >
                <Trophy className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'المتصدرين' : 'Leaderboard'}
              </Button>
            </Link>

            {user && (
              <Link to="/cart">
                <Button 
                  variant={isActive('/cart') ? "default" : "ghost"} 
                  size="sm" 
                  className={`${isActive('/cart') ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground"} relative`}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'السلة' : 'Cart'}
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Selector */}
            <LanguageSelector
              language={language}
              onLanguageChange={onLanguageChange}
              variant="button"
            />

            {/* User Menu or Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    <User className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'حسابي' : 'My Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center text-foreground">
                      <User className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </Link>
                  </DropdownMenuItem>
                  {user.email === 'admin@gmail.com' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center text-foreground">
                          <Settings className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-foreground">
                    <LogOut className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Link to="/login">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {language === 'ar' ? 'تسجيل دخول' : 'Login'}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                    {language === 'ar' ? 'إنشاء حساب' : 'Register'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
