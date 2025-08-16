
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Game from "./pages/Game";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import BuyGame from "./pages/BuyGame";
import SelectCategories from "./pages/SelectCategories";

const queryClient = new QueryClient();

const App = () => {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-warm dark:bg-gradient-dark text-foreground transition-all duration-300">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Routes without layout (auth pages) */}
                <Route path="/login" element={<Login language={language} />} />
                <Route path="/register" element={<Register language={language} />} />
                
                {/* Routes with layout */}
                <Route path="/*" element={
                  <Layout language={language} onLanguageChange={setLanguage}>
                    <Routes>
                      <Route path="/" element={<Index language={language} />} />
                      <Route path="/categories" element={<Categories language={language} />} />
                      <Route path="/leaderboard" element={<Leaderboard language={language} />} />
                      <Route path="/profile" element={<Profile language={language} onLanguageChange={setLanguage} />} />
                      <Route path="/cart" element={<Cart language={language} />} />
                      <Route path="/game" element={<Game language={language} />} />
                      <Route path="/admin" element={<Admin language={language} onLanguageChange={setLanguage} />} />
                      <Route path="/buy-game" element={<BuyGame language={language} onLanguageChange={setLanguage} />} />
                      <Route path="/select-categories/:purchaseId" element={<SelectCategories language={language} onLanguageChange={setLanguage} />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                } />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
