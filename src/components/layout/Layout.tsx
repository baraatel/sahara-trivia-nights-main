
import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const Layout = ({ children, language, onLanguageChange }: LayoutProps) => {
  return (
    <div className={`min-h-screen bg-gradient-warm dark:bg-gradient-dark ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer language={language} />
    </div>
  );
};

export default Layout;
