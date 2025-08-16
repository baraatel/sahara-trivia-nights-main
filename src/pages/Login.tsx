
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, Mail, Lock } from "lucide-react";

interface LoginProps {
  language: 'ar' | 'en';
}

const Login = ({ language }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: language === 'ar' ? "تم تسجيل الدخول بنجاح" : "Login Successful",
        description: language === 'ar' ? "مرحباً بك مرة أخرى!" : "Welcome back!",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في تسجيل الدخول" : "Login Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-warm dark:bg-gradient-dark">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Gamepad2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading 
                ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') 
                : (language === 'ar' ? 'تسجيل الدخول' : 'Login')
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}
              <Link to="/register" className="ml-2 text-accent hover:text-accent/80 transition-colors">
                {language === 'ar' ? 'إنشاء حساب' : 'Register'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
