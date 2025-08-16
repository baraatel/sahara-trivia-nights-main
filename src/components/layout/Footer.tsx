
import { Link } from "react-router-dom";
import { Gamepad2, Mail, Phone, MapPin } from "lucide-react";

interface FooterProps {
  language: 'ar' | 'en';
}

const Footer = ({ language }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">
                {language === 'ar' ? 'لعبة المسابقات' : 'Trivia Game'}
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              {language === 'ar' 
                ? 'استمتع بأفضل لعبة مسابقات تفاعلية مع أصدقائك واختبر معلوماتك في مختلف المجالات'
                : 'Enjoy the best interactive trivia game with your friends and test your knowledge across various topics'
              }
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                support@triviagame.com
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                +1 (555) 123-4567
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  {language === 'ar' ? 'الفئات' : 'Categories'}
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  {language === 'ar' ? 'المتصدرين' : 'Leaderboard'}
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">
              {language === 'ar' ? 'الدعم' : 'Support'}
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {language === 'ar' ? 'مركز المساعدة' : 'Help Center'}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>
            © {currentYear} {language === 'ar' ? 'لعبة المسابقات' : 'Trivia Game'}. 
            {language === 'ar' ? ' جميع الحقوق محفوظة.' : ' All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
