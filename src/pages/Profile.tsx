import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import OrderHistory from "@/components/profile/OrderHistory";
import RefundRequests from "@/components/profile/RefundRequests";
import IssueReports from "@/components/profile/IssueReports";
import RedemptionCodes from "@/components/profile/RedemptionCodes";

interface ProfileProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const Profile = ({ language, onLanguageChange }: ProfileProps) => {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [redemptionCount, setRedemptionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();

  const text = {
    ar: {
      loadingProfile: "جاري تحميل الملف الشخصي...",
      profileNotFound: "الملف الشخصي غير موجود",
      unableToLoad: "غير قادر على تحميل معلومات ملفك الشخصي.",
      returnHome: "العودة للرئيسية",
      joinedDate: "انضم في",
      gamesPlayed: "الألعاب المُلعبة",
      accuracy: "دقة",
      totalScore: "النتيجة الإجمالية",
      correctAnswers: "الإجابات الصحيحة",
      orders: "الطلبات",
      totalPurchases: "إجمالي المشتريات",
      redemptions: "الاستردادات",
      codesRedeemed: "الأكواد المستردة",
      personalInfo: "المعلومات الشخصية",
      fullName: "الاسم الكامل",
      username: "اسم المستخدم",
      email: "البريد الإلكتروني",
      bio: "النبذة الشخصية",
      gameStats: "إحصائيات الألعاب",
      questionsAnswered: "الأسئلة المُجابة"
    },
    en: {
      loadingProfile: "Loading profile...",
      profileNotFound: "Profile Not Found",
      unableToLoad: "Unable to load your profile information.",
      returnHome: "Return to Home",
      joinedDate: "Joined",
      gamesPlayed: "Games Played",
      accuracy: "accuracy",
      totalScore: "Total Score",
      correctAnswers: "correct answers",
      orders: "Orders",
      totalPurchases: "Total purchases",
      redemptions: "Redemptions",
      codesRedeemed: "Codes redeemed",
      personalInfo: "Personal Information",
      fullName: "Full Name",
      username: "Username",
      email: "Email",
      bio: "Bio",
      gameStats: "Game Statistics",
      questionsAnswered: "Questions Answered"
    }
  };

  const t = text[language];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = "/login";
        return;
      }

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        });
        return;
      }

      setUser(userData);

      // Fetch user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching stats:', statsError);
      } else {
        setUserStats(statsData || {
          games_played: 0,
          total_score: 0,
          correct_answers: 0,
          questions_answered: 0
        });
      }

      // Fetch purchase count
      const { count: purchaseCountData } = await supabase
        .from('user_game_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      setPurchaseCount(purchaseCountData || 0);

      // Fetch redemption count
      const { count: redemptionCountData } = await supabase
        .from('code_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      setRedemptionCount(redemptionCountData || 0);

    } catch (error) {
      console.error('Auth check error:', error);
      toast({
        title: "Error",
        description: "Authentication error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const calculateAccuracy = () => {
    if (!userStats?.questions_answered || userStats.questions_answered === 0) return 0;
    return Math.round((userStats.correct_answers / userStats.questions_answered) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t.loadingProfile}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t.profileNotFound}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{t.unableToLoad}</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold dark:text-white">{t.personalInfo}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.fullName}</label>
                    <p className="text-base dark:text-white">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.username}</label>
                    <p className="text-base dark:text-white">@{user.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.email}</label>
                    <p className="text-base dark:text-white">{user.email}</p>
                  </div>
                  {user.bio && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.bio}</label>
                      <p className="text-base dark:text-white">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "stats":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">{t.gameStats}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t.gamesPlayed}:</span>
                <span className="font-medium dark:text-white">{userStats?.games_played || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t.totalScore}:</span>
                <span className="font-medium dark:text-white">{userStats?.total_score || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t.correctAnswers}:</span>
                <span className="font-medium dark:text-white">{userStats?.correct_answers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t.questionsAnswered}:</span>
                <span className="font-medium dark:text-white">{userStats?.questions_answered || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t.accuracy}:</span>
                <span className="font-medium dark:text-white">{calculateAccuracy()}%</span>
              </div>
            </div>
          </div>
        );

      case "orders":
        return <OrderHistory userId={user.id} />;

      case "refunds":
        return <RefundRequests userId={user.id} />;

      case "issues":
        return <IssueReports userId={user.id} />;

      case "redemption":
        return <RedemptionCodes userId={user.id} language={language} />;

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex w-full ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <ProfileSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          language={language}
          onLanguageChange={onLanguageChange}
        />
        
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b dark:border-gray-700 px-4 bg-white dark:bg-gray-900">
            <SidebarTrigger className="-ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="text-sm">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold dark:text-white">{user.full_name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">@{user.username}</p>
              </div>
            </div>
          </header>

          <div className="flex-1 p-6">
            {/* Profile Header */}
            <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    <AvatarFallback className="text-lg">{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.full_name}</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">@{user.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    {user.bio && (
                      <p className="mt-2 text-gray-700 dark:text-gray-300">{user.bio}</p>
                    )}
                    <div className="mt-2 flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {t.joinedDate} {format(new Date(user.created_at), 'MMMM yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-white">{t.gamesPlayed}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold dark:text-white">{userStats?.games_played || 0}</div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {calculateAccuracy()}% {t.accuracy}
                  </p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-white">{t.totalScore}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold dark:text-white">{userStats?.total_score || 0}</div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {userStats?.correct_answers || 0} {t.correctAnswers}
                  </p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-white">{t.orders}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold dark:text-white">{purchaseCount}</div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {t.totalPurchases}
                  </p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-white">{t.redemptions}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold dark:text-white">{redemptionCount}</div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {t.codesRedeemed}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dynamic Content */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                {renderContent()}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
