
import { CreditCard, Wallet, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import StripeSettings from "./payment/StripeSettings";
import PayPalSettings from "./payment/PayPalSettings";
import GooglePaySettings from "./payment/GooglePaySettings";

const PaymentSettings = () => {
  const { settings, loading, saving, saveSettings, handleInputChange } = usePaymentSettings();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading payment settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Payment Gateway Settings</h2>
      </div>

      <Tabs defaultValue="stripe" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="paypal" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            PayPal
          </TabsTrigger>
          <TabsTrigger value="googlepay" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Google Pay
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stripe">
          <StripeSettings
            settings={{
              stripe_publishable_key: settings.stripe_publishable_key,
              stripe_secret_key: settings.stripe_secret_key
            }}
            onSettingChange={handleInputChange}
            onSave={saveSettings}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="paypal">
          <PayPalSettings
            settings={{
              paypal_client_id: settings.paypal_client_id,
              paypal_client_secret: settings.paypal_client_secret,
              paypal_environment: settings.paypal_environment
            }}
            onSettingChange={handleInputChange}
            onSave={saveSettings}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="googlepay">
          <GooglePaySettings
            settings={{
              google_pay_merchant_id: settings.google_pay_merchant_id,
              google_pay_gateway_merchant_id: settings.google_pay_gateway_merchant_id,
              google_pay_environment: settings.google_pay_environment
            }}
            onSettingChange={handleInputChange}
            onSave={saveSettings}
            saving={saving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSettings;
