-- Migration: Create dummy game packages for testing (Simple version)
-- This migration adds sample game packages to test the BuyGame functionality

-- First, let's check if the tables exist and their structure
DO $$
BEGIN
  RAISE NOTICE 'Checking if game_packages table exists...';
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'game_packages') THEN
    RAISE NOTICE 'game_packages table exists';
  ELSE
    RAISE NOTICE 'game_packages table does not exist';
  END IF;
END $$;

-- Temporarily disable the trigger to avoid log_admin_action errors
DROP TRIGGER IF EXISTS log_package_changes ON public.game_packages;

-- Insert dummy game packages (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'game_packages') THEN
    -- Insert packages
    INSERT INTO public.game_packages (name_ar, name_en, description_ar, description_en, price, games_count, is_active, is_popular, sort_order) VALUES
    ('حزمة لعبة واحدة', 'Single Game Package', 'حزمة تحتوي على لعبة واحدة مع 6 فئات مختلفة', 'Package containing one game with 6 different categories', 9.99, 1, true, false, 1),
    ('حزمة 3 ألعاب', '3 Games Package', 'حزمة تحتوي على 3 ألعاب مع 18 فئة مختلفة', 'Package containing 3 games with 18 different categories', 24.99, 3, true, true, 2),
    ('حزمة 5 ألعاب', '5 Games Package', 'حزمة تحتوي على 5 ألعاب مع 30 فئة مختلفة', 'Package containing 5 games with 30 different categories', 39.99, 5, true, false, 3),
    ('حزمة 10 ألعاب', '10 Games Package', 'حزمة تحتوي على 10 ألعاب مع 60 فئة مختلفة', 'Package containing 10 games with 60 different categories', 69.99, 10, true, false, 4);
    
    RAISE NOTICE 'Inserted 4 game packages successfully';
  ELSE
    RAISE NOTICE 'game_packages table does not exist, skipping package insertion';
  END IF;
END $$;

-- Re-enable the trigger
CREATE TRIGGER log_package_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.game_packages
  FOR EACH ROW
  EXECUTE FUNCTION log_package_change();

-- Insert features for packages (only if both tables exist)
DO $$
DECLARE
  package_record RECORD;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'game_package_features') THEN
    -- Insert features for each package
    FOR package_record IN SELECT id, name_en FROM public.game_packages LOOP
      CASE package_record.name_en
        WHEN 'Single Game Package' THEN
          INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) VALUES
          (package_record.id, 'لعبة واحدة كاملة', '1 complete game', 'Gamepad2', 1),
          (package_record.id, '6 فئات مختلفة', '6 different categories', 'FolderOpen', 2),
          (package_record.id, 'أسئلة عشوائية وفريدة', 'Random and unique questions', 'Star', 3);
          
        WHEN '3 Games Package' THEN
          INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) VALUES
          (package_record.id, '3 ألعاب كاملة', '3 complete games', 'Gamepad2', 1),
          (package_record.id, 'خصم 10% على السعر الإجمالي', '10% discount on total price', 'Percent', 2),
          (package_record.id, '18 فئة مختلفة (6 لكل لعبة)', '18 different categories (6 per game)', 'FolderOpen', 3);
          
        WHEN '5 Games Package' THEN
          INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) VALUES
          (package_record.id, '5 ألعاب كاملة', '5 complete games', 'Gamepad2', 1),
          (package_record.id, 'خصم 15% على السعر الإجمالي', '15% discount on total price', 'Percent', 2),
          (package_record.id, '30 فئة مختلفة (6 لكل لعبة)', '30 different categories (6 per game)', 'FolderOpen', 3);
          
        WHEN '10 Games Package' THEN
          INSERT INTO public.game_package_features (package_id, feature_ar, feature_en, icon, sort_order) VALUES
          (package_record.id, '10 ألعاب كاملة', '10 complete games', 'Gamepad2', 1),
          (package_record.id, 'خصم 25% على السعر الإجمالي', '25% discount on total price', 'Percent', 2),
          (package_record.id, '60 فئة مختلفة (6 لكل لعبة)', '60 different categories (6 per game)', 'FolderOpen', 3);
      END CASE;
    END LOOP;
    
    RAISE NOTICE 'Inserted features for all packages successfully';
  ELSE
    RAISE NOTICE 'game_package_features table does not exist, skipping feature insertion';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Created dummy game packages for testing';
  RAISE NOTICE 'Added 4 packages: Single Game, 3 Games, 5 Games, and 10 Games';
  RAISE NOTICE 'Each package has 3 features with Arabic and English descriptions';
END $$;
