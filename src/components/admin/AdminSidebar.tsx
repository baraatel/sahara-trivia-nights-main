
import { Users, BarChart3, FolderOpen, HelpCircle, CreditCard, Package, Gift, Menu, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import LanguageSelector from "@/components/ui/language-selector";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const AdminSidebar = ({ activeTab, setActiveTab, language, onLanguageChange }: AdminSidebarProps) => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const text = {
    ar: {
      adminPanel: "لوحة الإدارة",
      navigation: "التنقل",
      language: "اللغة",
      arabic: "العربية",
      english: "الإنجليزية",
      financialDashboard: "لوحة المعلومات المالية",
      userManagement: "إدارة المستخدمين",
      categories: "الفئات",
      questions: "الأسئلة",
      paymentSettings: "إعدادات الدفع",
      orderMonitoring: "مراقبة الطلبات",
      redemptionCodes: "أكواد الاسترداد"
    },
    en: {
      adminPanel: "Admin Panel",
      navigation: "Navigation",
      language: "Language",
      arabic: "Arabic",
      english: "English",
      financialDashboard: "Financial Dashboard",
      userManagement: "User Management",
      categories: "Categories",
      questions: "Questions",
      paymentSettings: "Payment Settings",
      orderMonitoring: "Order Monitoring",
      redemptionCodes: "Redemption Codes"
    }
  };

  const t = text[language];

  const menuItems = [
    {
      id: "stats",
      title: t.financialDashboard,
      icon: BarChart3,
    },
    {
      id: "users",
      title: t.userManagement,
      icon: Users,
    },
    {
      id: "categories",
      title: t.categories,
      icon: FolderOpen,
    },
    {
      id: "questions",
      title: t.questions,
      icon: HelpCircle,
    },
    {
      id: "payments",
      title: t.paymentSettings,
      icon: CreditCard,
    },
    {
      id: "orders",
      title: t.orderMonitoring,
      icon: Package,
    },
    {
      id: "codes",
      title: t.redemptionCodes,
      icon: Gift,
    },
  ];

  return (
    <div className={`border-l border-r-0 rtl:border-r rtl:border-l-0 bg-white dark:bg-gray-900 shadow-sm h-full ${language === 'ar' ? 'sidebar-rtl' : ''}`}>
      <SidebarHeader className="border-b dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.adminPanel}</h2>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {!isCollapsed && (
          <LanguageSelector
            language={language}
            onLanguageChange={onLanguageChange}
            variant="dropdown"
          />
        )}
      </SidebarHeader>

      <SidebarContent className="bg-gray-50 dark:bg-gray-800">
        <SidebarGroup>
          <SidebarGroupLabel className={`${isCollapsed ? "sr-only" : ""} text-gray-600 dark:text-gray-300`}>
            {t.navigation}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full justify-start transition-colors ${
                      activeTab === item.id 
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </div>
  );
};

export default AdminSidebar;
