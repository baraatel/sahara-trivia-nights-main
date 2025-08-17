
import { Link } from "react-router-dom";
import { Gamepad2, Mail, Phone, MapPin, Heart, ExternalLink, Shield, Users, Trophy } from "lucide-react";

interface FooterProps {
  language: 'ar' | 'en';
}

const Footer = ({ language }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      
      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6 group">
              <div className="relative">
                <Gamepad2 className="h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <div className="absolute inset-0 bg-primary/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
              </div>
              <h3 className="text-3xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary">
                {language === 'ar' ? 'لعبة المسابقات' : 'Trivia Game'}
              </h3>
            </div>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed max-w-lg">
              {language === 'ar' 
                ? 'استمتع بأفضل لعبة مسابقات تفاعلية مع أصدقائك واختبر معلوماتك في مختلف المجالات. اكتشف عالم المعرفة بطريقة ممتعة ومثيرة!'
                : 'Enjoy the best interactive trivia game with your friends and test your knowledge across various topics. Discover the world of knowledge in a fun and exciting way!'
              }
            </p>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-200 group">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm">support@triviagame.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-200 group">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-200">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg text-foreground">
                {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              </h4>
            </div>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/categories" 
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {language === 'ar' ? 'الفئات' : 'Categories'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/leaderboard" 
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {language === 'ar' ? 'المتصدرين' : 'Leaderboard'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/game" 
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {language === 'ar' ? 'الألعاب' : 'Games'}
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-accent" />
              <h4 className="font-semibold text-lg text-foreground">
                {language === 'ar' ? 'الدعم' : 'Support'}
              </h4>
            </div>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {language === 'ar' ? 'مركز المساعدة' : 'Help Center'}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:translate-x-1 flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-center md:text-left">
              © {currentYear} {language === 'ar' ? 'لعبة المسابقات' : 'Trivia Game'}. 
              {language === 'ar' ? ' جميع الحقوق محفوظة.' : ' All rights reserved.'}
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">
                {language === 'ar' ? 'صنع بـ' : 'Made with'}
              </span>
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <span className="text-sm">
                {language === 'ar' ? 'للعشاق' : 'for trivia lovers'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
