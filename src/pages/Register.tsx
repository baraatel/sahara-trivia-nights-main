
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, Mail, Lock, User } from "lucide-react";

interface RegisterProps {
  language: 'ar' | 'en';
}

const Register = ({ language }: RegisterProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            username: username
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            username: username
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      toast({
        title: language === 'ar' ? "تم إنشاء الحساب بنجاح" : "Registration Successful",
        description: language === 'ar' ? "مرحباً بك! يمكنك الآن تسجيل الدخول" : "Welcome! You can now login",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في إنشاء الحساب" : "Registration Error",
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
            {language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            
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
                : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لديك حساب بالفعل؟' : "Already have an account?"}
              <Link to="/login" className="ml-2 text-accent hover:text-accent/80 transition-colors">
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
