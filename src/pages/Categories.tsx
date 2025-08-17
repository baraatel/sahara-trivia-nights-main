
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Gamepad2, 
  Users, 
  Trophy, 
  Lock, 
  Play, 
  Search, 
  Filter,
  MapPin,
  Building,
  Car,
  Camera,
  User,
  BookOpen,
  Globe,
  Music,
  Heart,
  Star,
  Zap,
  Target,
  Shield,
  Lightbulb,
  Palette,
  Coffee,
  Leaf,
  MountainSnow,
  CloudRain,
  Home,
  School,
  Hospital,
  CreditCard,
  Utensils,
  ShoppingBag,
  PlaneTakeoff,
  TramFront,
  Bus,
  Ship,
  Bike,
  Truck,
  Flame,
  Droplets,
  Wind,
  Sun,
  Moon,
  Cloud,
  CloudSnow,
  Building2,
  Flag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CategoriesProps {
  language: 'ar' | 'en';
}

// Character icons mapping for different categories
const characterIcons = {
  places: [MapPin, Building, Building2, Flag, Home, School, Hospital, CreditCard, Utensils, ShoppingBag],
  characters: [User, Shield, Star, Heart, Target, Zap, Lightbulb, Palette],
  sports: [Trophy, Target, Shield, Star, Zap, Heart, Users, Gamepad2],
  nature: [Leaf, MountainSnow, CloudRain, Sun, Moon, Cloud, CloudSnow, Zap],
  transport: [Car, PlaneTakeoff, TramFront, Bus, Ship, Bike, Truck],
  objects: [Camera, BookOpen, Globe, Music, Coffee, Flame, Droplets, Star, Wind],
  // Add more categories as needed
};

const Categories = ({ language }: CategoriesProps) => {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const handleCategorySelect = (category: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!category.is_free) {
      toast({
        title: language === 'ar' ? "فئة مدفوعة" : "Premium Category",
        description: language === 'ar' ? "هذه الفئة تتطلب الشراء" : "This category requires purchase",
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to game selection
    navigate(`/select-categories/${category.id}`);
  };

  // Filter categories based on search and filter
  const filteredCategories = categories?.filter(category => {
    const matchesSearch = searchTerm === '' || 
      (language === 'ar' 
        ? category.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
        : category.name_en.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'free' && category.is_free) ||
      (selectedFilter === 'premium' && !category.is_free);
    
    return matchesSearch && matchesFilter;
  });

  // Group categories by type for better organization
  const groupedCategories = {
    places: filteredCategories?.filter(cat => cat.name_en.toLowerCase().includes('place') || cat.name_ar.includes('مكان')) || [],
    characters: filteredCategories?.filter(cat => cat.name_en.toLowerCase().includes('character') || cat.name_ar.includes('شخصية')) || [],
    sports: filteredCategories?.filter(cat => cat.name_en.toLowerCase().includes('sport') || cat.name_ar.includes('رياضة')) || [],
    nature: filteredCategories?.filter(cat => cat.name_en.toLowerCase().includes('nature') || cat.name_ar.includes('طبيعة')) || [],
    transport: filteredCategories?.filter(cat => cat.name_en.toLowerCase().includes('transport') || cat.name_ar.includes('نقل')) || [],
    objects: filteredCategories?.filter(cat => cat.name_en.toLowerCase().includes('object') || cat.name_ar.includes('شيء')) || [],
    other: filteredCategories?.filter(cat => 
      !cat.name_en.toLowerCase().includes('place') && 
      !cat.name_en.toLowerCase().includes('character') &&
      !cat.name_en.toLowerCase().includes('sport') &&
      !cat.name_en.toLowerCase().includes('nature') &&
      !cat.name_en.toLowerCase().includes('transport') &&
      !cat.name_en.toLowerCase().includes('object') &&
      !cat.name_ar.includes('مكان') &&
      !cat.name_ar.includes('شخصية') &&
      !cat.name_ar.includes('رياضة') &&
      !cat.name_ar.includes('طبيعة') &&
      !cat.name_ar.includes('نقل') &&
      !cat.name_ar.includes('شيء')
    ) || []
  };

  const getRandomIcon = (categoryName: string) => {
    const iconArrays = Object.values(characterIcons);
    const randomArray = iconArrays[Math.floor(Math.random() * iconArrays.length)];
    return randomArray[Math.floor(Math.random() * randomArray.length)];
  };

  const renderCategorySection = (title: string, categories: any[], iconKey: string) => {
    if (categories.length === 0) return null;

    return (
      <div className="mb-12">
        <div className="section-header">
          <div className="section-line"></div>
          <h2 className="arabic-heading text-2xl">
            {language === 'ar' ? title : title}
          </h2>
        </div>
        
        <div className="trivia-grid">
          {categories.map((category, index) => {
            const IconComponent = getRandomIcon(category.name_en);
            return (
              <Card
                key={category.id}
                className="character-card"
                onClick={() => handleCategorySelect(category)}
              >
                <div className="character-avatar bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <div className="character-name">
                  {language === 'ar' ? category.name_ar : category.name_en}
                </div>
                {!category.is_free && (
                  <Badge className="mt-2 bg-accent text-accent-foreground text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'مدفوع' : 'Premium'}
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Section with Gradient */}
      <div className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Gamepad2 className="h-4 w-4" />
              {language === 'ar' ? 'اكتشف عالم المعرفة' : 'Discover the World of Knowledge'}
            </div>
            <h1 className="text-5xl font-bold mb-4">
              {language === 'ar' ? 'اختر الفئات' : 'Choose Categories'}
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {language === 'ar' 
                ? 'اختر من بين مجموعة متنوعة من الفئات المثيرة للاهتمام' 
                : 'Choose from a variety of interesting categories'
              }
            </p>
          </div>
          
          {/* Search and Filter Section */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={language === 'ar' ? 'البحث في الفئات...' : 'Search categories...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                  className={selectedFilter === 'all' ? 'bg-white text-primary' : 'border-white/20 text-white hover:bg-white/10'}
                >
                  {language === 'ar' ? 'الكل' : 'All'}
                </Button>
                <Button
                  variant={selectedFilter === 'free' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('free')}
                  className={selectedFilter === 'free' ? 'bg-white text-primary' : 'border-white/20 text-white hover:bg-white/10'}
                >
                  {language === 'ar' ? 'مجاني' : 'Free'}
                </Button>
                <Button
                  variant={selectedFilter === 'premium' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('premium')}
                  className={selectedFilter === 'premium' ? 'bg-white text-primary' : 'border-white/20 text-white hover:bg-white/10'}
                >
                  {language === 'ar' ? 'مدفوع' : 'Premium'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((section) => (
              <div key={section}>
                <div className="section-header">
                  <div className="section-line"></div>
                  <Skeleton className="h-8 w-32" />
                </div>
                <div className="trivia-grid">
                  {[1, 2, 3, 4, 5, 6].map((card) => (
                    <Card key={card} className="character-card">
                      <Skeleton className="w-16 h-16 rounded-full mb-3" />
                      <Skeleton className="h-4 w-20" />
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {renderCategorySection('أماكن', groupedCategories.places, 'places')}
            {renderCategorySection('شخصيات', groupedCategories.characters, 'characters')}
            {renderCategorySection('رياضة', groupedCategories.sports, 'sports')}
            {renderCategorySection('طبيعة', groupedCategories.nature, 'nature')}
            {renderCategorySection('نقل', groupedCategories.transport, 'transport')}
            {renderCategorySection('أشياء', groupedCategories.objects, 'objects')}
            {renderCategorySection('أخرى', groupedCategories.other, 'other')}
            
            {filteredCategories?.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {language === 'ar' ? 'لا توجد نتائج' : 'No Results Found'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar' 
                    ? 'جرب البحث بكلمات مختلفة أو تغيير الفلتر' 
                    : 'Try searching with different words or changing the filter'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
