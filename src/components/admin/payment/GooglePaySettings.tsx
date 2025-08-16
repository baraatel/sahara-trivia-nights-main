
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";

interface GooglePaySettingsProps {
  settings: {
    google_pay_merchant_id: string;
    google_pay_gateway_merchant_id: string;
    google_pay_environment: string;
  };
  onSettingChange: (key: string, value: string) => void;
  onSave: (settingsToSave: Record<string, string>) => void;
  saving: boolean;
}

const GooglePaySettings = ({ settings, onSettingChange, onSave, saving }: GooglePaySettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Google Pay Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="google_pay_merchant_id">Merchant ID</Label>
          <Input
            id="google_pay_merchant_id"
            type="text"
            placeholder="Google Pay Merchant ID"
            value={settings.google_pay_merchant_id}
            onChange={(e) => onSettingChange('google_pay_merchant_id', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_pay_gateway_merchant_id">Gateway Merchant ID</Label>
          <Input
            id="google_pay_gateway_merchant_id"
            type="text"
            placeholder="Gateway Merchant ID"
            value={settings.google_pay_gateway_merchant_id}
            onChange={(e) => onSettingChange('google_pay_gateway_merchant_id', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_pay_environment">Environment</Label>
          <Select value={settings.google_pay_environment} onValueChange={(value) => onSettingChange('google_pay_environment', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEST">Test</SelectItem>
              <SelectItem value="PRODUCTION">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => onSave({
            google_pay_merchant_id: settings.google_pay_merchant_id,
            google_pay_gateway_merchant_id: settings.google_pay_gateway_merchant_id,
            google_pay_environment: settings.google_pay_environment
          })}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Google Pay Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GooglePaySettings;
