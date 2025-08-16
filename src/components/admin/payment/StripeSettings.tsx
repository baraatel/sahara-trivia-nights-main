
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

interface StripeSettingsProps {
  settings: {
    stripe_publishable_key: string;
    stripe_secret_key: string;
  };
  onSettingChange: (key: string, value: string) => void;
  onSave: (settingsToSave: Record<string, string>) => void;
  saving: boolean;
}

const StripeSettings = ({ settings, onSettingChange, onSave, saving }: StripeSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
          <Input
            id="stripe_publishable_key"
            type="text"
            placeholder="pk_test_..."
            value={settings.stripe_publishable_key}
            onChange={(e) => onSettingChange('stripe_publishable_key', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stripe_secret_key">Secret Key</Label>
          <Input
            id="stripe_secret_key"
            type="password"
            placeholder="sk_test_..."
            value={settings.stripe_secret_key}
            onChange={(e) => onSettingChange('stripe_secret_key', e.target.value)}
          />
        </div>
        <Button 
          onClick={() => onSave({
            stripe_publishable_key: settings.stripe_publishable_key,
            stripe_secret_key: settings.stripe_secret_key
          })}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Stripe Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StripeSettings;
