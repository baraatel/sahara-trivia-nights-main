-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_packages_active_sort ON public.game_packages(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_game_packages_popular ON public.game_packages(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_game_package_features_package_sort ON public.game_package_features(package_id, sort_order);

-- Add constraint to ensure positive prices
ALTER TABLE public.game_packages 
ADD CONSTRAINT check_positive_price CHECK (price > 0);

-- Add constraint to ensure positive games count
ALTER TABLE public.game_packages 
ADD CONSTRAINT check_positive_games_count CHECK (games_count > 0);

-- Add constraint to ensure valid sort order
ALTER TABLE public.game_packages 
ADD CONSTRAINT check_valid_sort_order CHECK (sort_order >= 0);

-- Add function to calculate package savings
CREATE OR REPLACE FUNCTION calculate_package_savings(package_price NUMERIC, games_count INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  -- Calculate savings based on single game price of $9.99
  RETURN (games_count * 9.99) - package_price;
END;
$$ LANGUAGE plpgsql;

-- Add function to get package statistics
CREATE OR REPLACE FUNCTION get_package_stats()
RETURNS TABLE (
  total_packages INTEGER,
  active_packages INTEGER,
  popular_packages INTEGER,
  avg_price NUMERIC,
  total_savings NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_packages,
    COUNT(*) FILTER (WHERE is_active)::INTEGER as active_packages,
    COUNT(*) FILTER (WHERE is_popular)::INTEGER as popular_packages,
    AVG(price) as avg_price,
    SUM(calculate_package_savings(price, games_count)) as total_savings
  FROM public.game_packages;
END;
$$ LANGUAGE plpgsql;

-- Add view for package sales summary
CREATE OR REPLACE VIEW package_sales_summary AS
SELECT 
  gp.id,
  gp.name_ar,
  gp.name_en,
  gp.price,
  gp.games_count,
  gp.is_active,
  gp.is_popular,
  COUNT(gpurch.id) as purchase_count,
  SUM(gpurch.price) as total_revenue,
  AVG(gpurch.price) as avg_purchase_price,
  calculate_package_savings(gp.price, gp.games_count) as savings_per_package
FROM public.game_packages gp
LEFT JOIN public.game_purchases gpurch ON gp.id = gpurch.package_id
GROUP BY gp.id, gp.name_ar, gp.name_en, gp.price, gp.games_count, gp.is_active, gp.is_popular;

-- Note: RLS policies cannot be created on views, so we skip this
-- Views are accessible to all authenticated users by default

-- Add function to log package changes
CREATE OR REPLACE FUNCTION log_package_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_admin_action(
      'package_created',
      auth.uid(),
      json_build_object(
        'package_id', NEW.id,
        'package_name', NEW.name_ar,
        'price', NEW.price,
        'games_count', NEW.games_count
      ),
      NEW.id,
      'game_package'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_admin_action(
      'package_updated',
      auth.uid(),
      json_build_object(
        'package_id', NEW.id,
        'package_name', NEW.name_ar,
        'old_price', OLD.price,
        'new_price', NEW.price,
        'old_games_count', OLD.games_count,
        'new_games_count', NEW.games_count
      ),
      NEW.id,
      'game_package'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_admin_action(
      'package_deleted',
      auth.uid(),
      json_build_object(
        'package_id', OLD.id,
        'package_name', OLD.name_ar,
        'price', OLD.price,
        'games_count', OLD.games_count
      ),
      OLD.id,
      'game_package'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for package changes logging
CREATE TRIGGER log_package_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.game_packages
  FOR EACH ROW
  EXECUTE FUNCTION log_package_change();

-- Add function to validate package features
CREATE OR REPLACE FUNCTION validate_package_features()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure feature has both Arabic and English text
  IF NEW.feature_ar IS NULL OR NEW.feature_ar = '' THEN
    RAISE EXCEPTION 'Feature Arabic text is required';
  END IF;
  
  IF NEW.feature_en IS NULL OR NEW.feature_en = '' THEN
    RAISE EXCEPTION 'Feature English text is required';
  END IF;
  
  -- Ensure sort order is positive
  IF NEW.sort_order < 0 THEN
    RAISE EXCEPTION 'Sort order must be non-negative';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feature validation
CREATE TRIGGER validate_features
  BEFORE INSERT OR UPDATE ON public.game_package_features
  FOR EACH ROW
  EXECUTE FUNCTION validate_package_features();

-- Add function to get package with features
CREATE OR REPLACE FUNCTION get_package_with_features(package_uuid UUID)
RETURNS TABLE (
  id UUID,
  name_ar TEXT,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  price NUMERIC,
  games_count INTEGER,
  is_active BOOLEAN,
  is_popular BOOLEAN,
  sort_order INTEGER,
  features JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.id,
    gp.name_ar,
    gp.name_en,
    gp.description_ar,
    gp.description_en,
    gp.price,
    gp.games_count,
    gp.is_active,
    gp.is_popular,
    gp.sort_order,
    COALESCE(
      json_agg(
        json_build_object(
          'id', gpf.id,
          'feature_ar', gpf.feature_ar,
          'feature_en', gpf.feature_en,
          'icon', gpf.icon,
          'sort_order', gpf.sort_order
        ) ORDER BY gpf.sort_order
      ) FILTER (WHERE gpf.id IS NOT NULL),
      '[]'::json
    ) as features
  FROM public.game_packages gp
  LEFT JOIN public.game_package_features gpf ON gp.id = gpf.package_id
  WHERE gp.id = package_uuid
  GROUP BY gp.id, gp.name_ar, gp.name_en, gp.description_ar, gp.description_en, 
           gp.price, gp.games_count, gp.is_active, gp.is_popular, gp.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_package_savings(NUMERIC, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_package_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_package_with_features(UUID) TO authenticated;
