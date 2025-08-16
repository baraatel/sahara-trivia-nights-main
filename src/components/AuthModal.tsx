
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AuthTabs from "./auth/AuthTabs";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
}

const AuthModal = ({ isOpen, onClose, language }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: language === 'ar' ? "فشل تسجيل الدخول" : "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: language === 'ar' ? "مرحباً بعودتك!" : "Welcome back!",
          description: language === 'ar' ? "تم تسجيل الدخول بنجاح" : "You have been signed in successfully.",
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حدث خطأ غير متوقع" : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, fullName: string, username: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: language === 'ar' ? "فشل إنشاء الحساب" : "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: language === 'ar' ? "تم إنشاء الحساب!" : "Account Created!",
          description: language === 'ar' ? "يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك" : "Please check your email to verify your account.",
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حدث خطأ غير متوقع" : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {language === 'ar' ? 'مرحباً بك في لعبة المسابقات' : 'Welcome to Arabic Trivia'}
          </DialogTitle>
        </DialogHeader>
        <AuthTabs 
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          loading={loading}
          language={language}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
