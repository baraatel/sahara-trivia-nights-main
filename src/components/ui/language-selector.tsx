import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  variant?: 'button' | 'dropdown' | 'select';
  className?: string;
}

const LanguageSelector = ({ 
  language, 
  onLanguageChange, 
  variant = 'button',
  className = '' 
}: LanguageSelectorProps) => {
  const languages = {
    ar: { code: 'ar', name: 'العربية', label: 'Arabic' },
    en: { code: 'en', name: 'English', label: 'English' }
  };

  const currentLang = languages[language];
  const otherLang = languages[language === 'ar' ? 'en' : 'ar'];

  if (variant === 'button') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`text-foreground hover:bg-accent hover:text-accent-foreground ${className}`}
          >
            <Globe className="h-4 w-4 mr-2" />
            {currentLang.name}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onLanguageChange('ar')}>
            <Globe className="h-4 w-4 mr-2" />
            العربية
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLanguageChange('en')}>
            <Globe className="h-4 w-4 mr-2" />
            English
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={className}>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">
          <Globe className="h-4 w-4 inline mr-1" />
          {language === 'ar' ? 'اللغة' : 'Language'}
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
            >
              <span>{currentLang.name}</span>
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-full">
            <DropdownMenuItem onClick={() => onLanguageChange('ar')}>
              العربية
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLanguageChange('en')}>
              English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (variant === 'select') {
    return (
      <div className={className}>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">
          <Globe className="h-4 w-4 inline mr-1" />
          {language === 'ar' ? 'اللغة' : 'Language'}
        </label>
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ar">العربية</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
};

export default LanguageSelector;
