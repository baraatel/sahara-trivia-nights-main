-- Create game_packages table for managing different game packages
CREATE TABLE public.game_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price NUMERIC(10,2) NOT NULL,
  games_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_package_features table for package features
CREATE TABLE public.game_package_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.game_packages(id) ON DELETE CASCADE,
  feature_ar TEXT NOT NULL,
  feature_en TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.game_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_package_features ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_packages
CREATE POLICY "Anyone can view active game packages" 
ON public.game_packages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage all game packages" 
ON public.game_packages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@gmail.com'
));

-- RLS policies for game_package_features
CREATE POLICY "Anyone can view package features" 
ON public.game_package_features 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.game_packages 
  WHERE game_packages.id = package_id AND game_packages.is_active = true
));

CREATE POLICY "Admin can manage package features" 
ON public.game_package_features 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@gmail.com'
));

-- Insert default packages
INSERT INTO public.game_packages (name_ar, name_en, description_ar, description_en, price, games_count, is_popular, sort_order) VALUES
('حزمة لعبة واحدة', 'Single Game Package', 'حزمة تحتوي على لعبة واحدة مع 6 فئات', 'Package containing one game with 6 categories', 9.99, 1, true, 1),
('حزمة 3 ألعاب', '3 Games Package', 'حزمة تحتوي على 3 ألعاب مع خصم 10%', 'Package containing 3 games with 10% discount', 26.99, 3, false, 2),
('حزمة 5 ألعاب', '5 Games Package', 'حزمة تحتوي على 5 ألعاب مع خصم 15%', 'Package containing 5 games with 15% discount', 42.99, 5, false, 3),
('حزمة 10 ألعاب', '10 Games Package', 'حزمة تحتوي على 10 ألعاب مع خصم 25%', 'Package containing 10 games with 25% discount', 74.99, 10, false, 4);

-- Insert features for single game package
INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  'اختيار 6 فئات مختلفة',
  'Choose 6 different categories',
  'Star',
  1
FROM public.game_packages p WHERE p.name_en = 'Single Game Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  'أسئلة عشوائية وفريدة',
  'Random and unique questions',
  'Shuffle',
  2
FROM public.game_packages p WHERE p.name_en = 'Single Game Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  'لا تتكرر الأسئلة بين الألعاب',
  'Questions do not repeat between games',
  'RefreshCw',
  3
FROM public.game_packages p WHERE p.name_en = 'Single Game Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  'تجربة لعب مميزة',
  'Unique game experience',
  'Gamepad2',
  4
FROM public.game_packages p WHERE p.name_en = 'Single Game Package';

-- Insert features for 3 games package
INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  '3 ألعاب كاملة',
  '3 complete games',
  'Gamepad2',
  1
FROM public.game_packages p WHERE p.name_en = '3 Games Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  'خصم 10% على السعر الإجمالي',
  '10% discount on total price',
  'Percent',
  2
FROM public.game_packages p WHERE p.name_en = '3 Games Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  '18 فئة مختلفة (6 لكل لعبة)',
  '18 different categories (6 per game)',
  'FolderOpen',
  3
FROM public.game_packages p WHERE p.name_en = '3 Games Package';

-- Insert features for 5 games package
INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  '5 ألعاب كاملة',
  '5 complete games',
  'Gamepad2',
  1
FROM public.game_packages p WHERE p.name_en = '5 Games Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  'خصم 15% على السعر الإجمالي',
  '15% discount on total price',
  'Percent',
  2
FROM public.game_packages p WHERE p.name_en = '5 Games Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  '30 فئة مختلفة (6 لكل لعبة)',
  '30 different categories (6 per game)',
  'FolderOpen',
  3
FROM public.game_packages p WHERE p.name_en = '5 Games Package';

-- Insert features for 10 games package
INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  '10 ألعاب كاملة',
  '10 complete games',
  'Gamepad2',
  1
FROM public.game_packages p WHERE p.name_en = '10 Games Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  'خصم 25% على السعر الإجمالي',
  '25% discount on total price',
  'Percent',
  2
FROM public.game_packages p WHERE p.name_en = '10 Games Package';

INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) 
SELECT 
  p.id,
  '60 فئة مختلفة (6 لكل لعبة)',
  '60 different categories (6 per game)',
  'FolderOpen',
  3
FROM public.game_packages p WHERE p.name_en = '10 Games Package';

-- Add package_id to game_purchases table
ALTER TABLE public.game_purchases 
ADD COLUMN package_id UUID REFERENCES public.game_packages(id);

-- Update existing game purchases to use the default single game package
UPDATE public.game_purchases 
SET package_id = (SELECT id FROM public.game_packages WHERE name_en = 'Single Game Package' LIMIT 1)
WHERE package_id IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for game_packages table
CREATE TRIGGER update_game_packages_updated_at 
    BEFORE UPDATE ON public.game_packages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
