
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";

interface AuthTabsProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  loading: boolean;
  language: 'ar' | 'en';
}

const AuthTabs = ({ onLogin, onSignUp, loading, language }: AuthTabsProps) => {
  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">
          {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
        </TabsTrigger>
        <TabsTrigger value="signup">
          {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="login" className="space-y-4">
        <LoginForm onSubmit={onLogin} loading={loading} language={language} />
      </TabsContent>
      <TabsContent value="signup" className="space-y-4">
        <SignUpForm onSubmit={onSignUp} loading={loading} language={language} />
      </TabsContent>
    </Tabs>
  );
};

export default AuthTabs;
