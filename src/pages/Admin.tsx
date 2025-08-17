
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import UserManagement from "@/components/admin/UserManagement";
import CategoryManager from "@/components/admin/CategoryManager";
import QuestionManager from "@/components/admin/QuestionManager";
import PackageManager from "@/components/admin/PackageManager";
import PackageStats from "@/components/admin/PackageStats";
import FinancialDashboard from "@/components/admin/FinancialDashboard";
import OrderMonitoring from "@/components/admin/OrderMonitoring";
import RedemptionCodeManager from "@/components/admin/RedemptionCodeManager";
import PaymentSettings from "@/components/admin/PaymentSettings";
import GameStats from "@/components/admin/GameStats";

interface AdminProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const Admin = ({ language, onLanguageChange }: AdminProps) => {
  const [activeSection, setActiveSection] = useState("stats");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Apply RTL when Arabic is selected
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Check if user is admin using the new safe function
      const { data: adminStatus, error } = await supabase
        .rpc('is_admin_user');

      if (error) {
        console.error('Error fetching user data:', error);
        setIsAdmin(false);
        toast({
          title: language === 'ar' ? "خطأ" : "Error",
          description: language === 'ar' ? "فشل في التحقق من صلاحية الإدارة" : "Failed to check admin access",
          variant: "destructive",
        });
        return;
      }

      const isUserAdmin = adminStatus === true;
      setIsAdmin(isUserAdmin);
      
      if (!isUserAdmin) {
        toast({
          title: language === 'ar' ? "تم رفض الوصول" : "Access Denied",
          description: language === 'ar' ? "ليس لديك صلاحية للوصول إلى لوحة الإدارة." : "You don't have permission to access the admin panel.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل في التحقق من صلاحية الإدارة" : "Failed to check admin access",
        variant: "destructive",
      });
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const text = {
    ar: {
      loading: "جاري التحقق من صلاحية الإدارة...",
      accessDenied: "تم رفض الوصول",
      noPermission: "ليس لديك صلاحية للوصول إلى لوحة الإدارة."
    },
    en: {
      loading: "Checking admin access...",
      accessDenied: "Access Denied",
      noPermission: "You don't have permission to access the admin panel."
    }
  };

  const t = text[language];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "users":
        return <UserManagement />;
      case "categories":
        return <CategoryManager />;
      case "questions":
        return <QuestionManager />;
      case "packages":
        return <PackageManager />;
      case "package-stats":
        return <PackageStats />;
      case "financial":
        return <FinancialDashboard />;
      case "stats":
        return <FinancialDashboard />;
      case "orders":
        return <OrderMonitoring />;
      case "codes":
        return <RedemptionCodeManager />;
      case "payments":
        return <PaymentSettings />;
      case "game-stats":
        return <GameStats />;

      default:
        return <UserManagement />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t.accessDenied}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{t.noPermission}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side={language === 'ar' ? 'right' : 'left'}>
        <AdminSidebar 
          activeTab={activeSection} 
          setActiveTab={setActiveSection}
          language={language}
          onLanguageChange={onLanguageChange}
        />
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          <div className="h-full overflow-auto p-6">
            {renderActiveSection()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Admin;
