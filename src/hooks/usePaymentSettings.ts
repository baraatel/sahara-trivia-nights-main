
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentSettings {
  stripe_publishable_key: string;
  stripe_secret_key: string;
  paypal_client_id: string;
  paypal_client_secret: string;
  paypal_environment: string;
  google_pay_merchant_id: string;
  google_pay_gateway_merchant_id: string;
  google_pay_environment: string;
}

export const usePaymentSettings = () => {
  const [settings, setSettings] = useState<PaymentSettings>({
    stripe_publishable_key: '',
    stripe_secret_key: '',
    paypal_client_id: '',
    paypal_client_secret: '',
    paypal_environment: 'sandbox',
    google_pay_merchant_id: '',
    google_pay_gateway_merchant_id: '',
    google_pay_environment: 'TEST'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value || '';
      });

      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch payment settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsToSave: Record<string, string>) => {
    setSaving(true);
    try {
      const updates = Object.entries(settingsToSave).map(([key, value]) => ({
        setting_key: key,
        setting_value: value as string
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
    handleInputChange
  };
};
