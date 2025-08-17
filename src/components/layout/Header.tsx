
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, User, ShoppingCart, Trophy, Home, Grid3X3, LogOut, Settings, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import LanguageSelector from "@/components/ui/language-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface HeaderProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const Header = ({ language, onLanguageChange }: HeaderProps) => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        fetchCartCount(session.user.id);
        checkAdminStatus(session.user.email);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCartCount(session.user.id);
        checkAdminStatus(session.user.email);
      } else {
        setCartCount(0);
        setIsAdmin(false);
      }
    });

    // Handle scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const checkAdminStatus = async (email: string) => {
    try {
      const { data: adminStatus, error } = await supabase
        .rpc('get_user_admin_status', { user_email: email });

      if (error) {
        console.error('Error fetching user admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(adminStatus === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

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

  const navigationItems = [
    { path: '/', icon: Home, label: language === 'ar' ? 'الرئيسية' : 'Home' },
    { path: '/categories', icon: Grid3X3, label: language === 'ar' ? 'الفئات' : 'Categories' },
    { path: '/game', icon: Gamepad2, label: language === 'ar' ? 'الألعاب' : 'Games' },
    { path: '/leaderboard', icon: Trophy, label: language === 'ar' ? 'المتصدرين' : 'Leaderboard' },
  ];

  const NavButton = ({ item, isMobile = false }: { item: any; isMobile?: boolean }) => {
    const Icon = item.icon;
    return (
      <Link to={item.path}>
        <Button 
          variant={isActive(item.path) ? "default" : "ghost"} 
          size={isMobile ? "sm" : "sm"}
          className={`transition-all duration-200 ${
            isActive(item.path) 
              ? "bg-primary text-primary-foreground shadow-lg scale-105" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105"
          } ${isMobile ? "w-full justify-start" : ""}`}
        >
          <Icon className={`h-4 w-4 ${isMobile ? "mr-3" : "mr-2"}`} />
          {item.label}
        </Button>
      </Link>
    );
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? "bg-card/95 backdrop-blur-md border-b border-border shadow-lg" 
        : "bg-card/80 backdrop-blur-md border-b border-border"
    }`}>
      {/* Top gradient bar */}
      <div className="gradient-primary h-1"></div>
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Gamepad2 className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <div className="absolute inset-0 bg-primary/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
            </div>
            <h1 className="text-2xl font-bold text-gradient-primary transition-colors duration-300 group-hover:text-primary">
              {language === 'ar' ? 'لعبة المسابقات' : 'Trivia Game'}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navigationItems.map((item) => (
              <NavButton key={item.path} item={item} />
            ))}
            
            {user && (
              <Link to="/cart">
                <Button 
                  variant={isActive('/cart') ? "default" : "ghost"} 
                  size="sm" 
                  className={`transition-all duration-200 relative ${
                    isActive('/cart') 
                      ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                      : "text-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'السلة' : 'Cart'}
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground animate-pulse">
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">
                      {language === 'ar' ? 'حسابي' : 'My Account'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center text-foreground hover:bg-accent transition-colors duration-200">
                      <User className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center text-foreground hover:bg-accent transition-colors duration-200">
                          <Settings className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="flex items-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Link to="/login">
                  <Button 
                    size="sm" 
                    className="btn-primary-gradient transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    {language === 'ar' ? 'تسجيل دخول' : 'Login'}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
                  >
                    {language === 'ar' ? 'إنشاء حساب' : 'Register'}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-80 bg-card border-border">
                <SheetHeader>
                  <SheetTitle className="text-foreground">
                    {language === 'ar' ? 'القائمة' : 'Menu'}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {navigationItems.map((item) => (
                    <NavButton key={item.path} item={item} isMobile />
                  ))}
                  
                  {user && (
                    <Link to="/cart">
                      <Button 
                        variant={isActive('/cart') ? "default" : "ghost"} 
                        size="sm" 
                        className={`w-full justify-start transition-all duration-200 ${
                          isActive('/cart') 
                            ? "bg-primary text-primary-foreground shadow-lg" 
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-3" />
                        {language === 'ar' ? 'السلة' : 'Cart'}
                        {cartCount > 0 && (
                          <Badge className="ml-auto bg-accent text-accent-foreground">
                            {cartCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  )}
                  
                  {user && (
                    <>
                      <div className="pt-4 border-t border-border">
                        <Link to="/profile">
                          <Button variant="ghost" size="sm" className="w-full justify-start text-foreground hover:bg-accent">
                            <User className="h-4 w-4 mr-3" />
                            {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                          </Button>
                        </Link>
                        
                        {isAdmin && (
                          <Link to="/admin">
                            <Button variant="ghost" size="sm" className="w-full justify-start text-foreground hover:bg-accent">
                              <Settings className="h-4 w-4 mr-3" />
                              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                            </Button>
                          </Link>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleLogout}
                          className="w-full justify-start text-foreground hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
