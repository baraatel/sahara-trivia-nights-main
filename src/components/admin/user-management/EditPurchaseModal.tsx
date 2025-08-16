
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Purchase {
  id: string;
  amount: number;
  currency: string;
  order_status: string;
  payment_provider: string;
  categories: {
    name_en: string;
    name_ar: string;
  };
}

interface EditPurchaseModalProps {
  purchase: Purchase;
  open: boolean;
  onClose: () => void;
  onPurchaseUpdated: () => void;
}

const EditPurchaseModal = ({ purchase, open, onClose, onPurchaseUpdated }: EditPurchaseModalProps) => {
  const [amount, setAmount] = useState(purchase.amount.toString());
  const [orderStatus, setOrderStatus] = useState(purchase.order_status);
  const [paymentProvider, setPaymentProvider] = useState(purchase.payment_provider);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_game_purchases')
        .update({
          amount: parseFloat(amount),
          order_status: orderStatus,
          payment_provider: paymentProvider,
        })
        .eq('id', purchase.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase updated successfully",
      });

      onPurchaseUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating purchase:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Purchase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-status">Order Status</Label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-provider">Payment Provider</Label>
            <Select value={paymentProvider} onValueChange={setPaymentProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="google_pay">Google Pay</SelectItem>
                <SelectItem value="admin_grant">Admin Grant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Purchase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPurchaseModal;
