
import { useState } from "react";
import { 
  User, 
  Trophy, 
  ShoppingCart, 
  DollarSign, 
  AlertCircle, 
  Gift,
  Menu,
  X
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import LanguageSelector from "@/components/ui/language-selector";

interface ProfileSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const ProfileSidebar = ({ activeTab, setActiveTab, language, onLanguageChange }: ProfileSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const text = {
    ar: {
      profile: "الملف الشخصي",
      personalInfo: "المعلومات الشخصية",
      gameStats: "إحصائيات الألعاب",
      orders: "الطلبات",
      refunds: "المبالغ المستردة",
      issues: "البلاغات",
      redemption: "أكواد الاسترداد",
      language: "اللغة",
      arabic: "العربية",
      english: "الإنجليزية"
    },
    en: {
      profile: "Profile",
      personalInfo: "Personal Info",
      gameStats: "Game Statistics",
      orders: "Orders",
      refunds: "Refunds",
      issues: "Issues",
      redemption: "Redemption Codes",
      language: "Language",
      arabic: "Arabic",
      english: "English"
    }
  };

  const t = text[language];

  const menuItems = [
    { id: "profile", label: t.personalInfo, icon: User },
    { id: "stats", label: t.gameStats, icon: Trophy },
    { id: "orders", label: t.orders, icon: ShoppingCart },
    { id: "refunds", label: t.refunds, icon: DollarSign },
    { id: "issues", label: t.issues, icon: AlertCircle },
    { id: "redemption", label: t.redemption, icon: Gift },
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} border-l border-r-0 rtl:border-r rtl:border-l-0 bg-white dark:bg-gray-900 shadow-sm h-full transition-all duration-300 ${language === 'ar' ? 'sidebar-rtl' : ''}`}>
      <SidebarHeader className="border-b dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.profile}</h2>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
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
            {t.profile}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full justify-start transition-colors ${
                      activeTab === item.id 
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">{item.label}</span>}
                  </Button>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </div>
  );
};

export default ProfileSidebar;
