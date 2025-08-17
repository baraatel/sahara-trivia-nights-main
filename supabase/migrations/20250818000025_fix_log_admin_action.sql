-- Migration: Fix log_admin_action function signature and temporarily disable problematic trigger
-- This migration fixes the function signature mismatch and disables the trigger that's causing errors

-- First, let's disable the problematic trigger temporarily
DROP TRIGGER IF EXISTS log_package_changes ON public.game_packages;

-- Create a new version of log_admin_action that matches the expected signature
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action_type TEXT,
  p_admin_id UUID,
  p_details JSONB,
  p_target_id UUID,
  p_target_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, details)
  VALUES (p_admin_id, p_action_type, p_target_type, p_target_id, p_details)
  RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$;

-- Recreate the trigger with the correct function signature
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

-- Recreate the trigger
CREATE TRIGGER log_package_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.game_packages
  FOR EACH ROW
  EXECUTE FUNCTION log_package_change();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed log_admin_action function signature and recreated package change trigger';
END $$;
