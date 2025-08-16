
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "lucide-react";

interface PayPalSettingsProps {
  settings: {
    paypal_client_id: string;
    paypal_client_secret: string;
    paypal_environment: string;
  };
  onSettingChange: (key: string, value: string) => void;
  onSave: (settingsToSave: Record<string, string>) => void;
  saving: boolean;
}

const PayPalSettings = ({ settings, onSettingChange, onSave, saving }: PayPalSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          PayPal Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="paypal_client_id">Client ID</Label>
          <Input
            id="paypal_client_id"
            type="text"
            placeholder="PayPal Client ID"
            value={settings.paypal_client_id}
            onChange={(e) => onSettingChange('paypal_client_id', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paypal_client_secret">Client Secret</Label>
          <Input
            id="paypal_client_secret"
            type="password"
            placeholder="PayPal Client Secret"
            value={settings.paypal_client_secret}
            onChange={(e) => onSettingChange('paypal_client_secret', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paypal_environment">Environment</Label>
          <Select value={settings.paypal_environment} onValueChange={(value) => onSettingChange('paypal_environment', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="live">Live</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => onSave({
            paypal_client_id: settings.paypal_client_id,
            paypal_client_secret: settings.paypal_client_secret,
            paypal_environment: settings.paypal_environment
          })}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save PayPal Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PayPalSettings;
