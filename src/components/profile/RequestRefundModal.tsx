
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface Purchase {
  id: string;
  category_id: string;
  amount: number;
  purchased_at: string;
  status: string;
  categories: {
    name_en: string;
    name_ar: string;
  };
}

interface RequestRefundModalProps {
  purchase: Purchase | null;
  open: boolean;
  onClose: () => void;
  onRefundRequested: () => void;
}

const RequestRefundModal = ({ purchase, open, onClose, onRefundRequested }: RequestRefundModalProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!purchase || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the refund request",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('refund_requests')
        .insert({
          user_id: user.id,
          purchase_id: purchase.id,
          reason: reason.trim(),
          refund_amount: purchase.amount,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your refund request has been submitted and will be reviewed by our team.",
      });

      onRefundRequested();
      onClose();
      setReason("");
    } catch (error) {
      console.error('Error submitting refund request:', error);
      toast({
        title: "Error",
        description: "Failed to submit refund request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isWithin24Hours = purchase ? 
    new Date().getTime() - new Date(purchase.purchased_at).getTime() < 24 * 60 * 60 * 1000 : 
    false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Request Refund
          </DialogTitle>
        </DialogHeader>

        {purchase && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">{purchase.categories.name_en}</h4>
              <p className="text-sm text-gray-600">
                Purchased: {new Date(purchase.purchased_at).toLocaleDateString()}
              </p>
              <p className="text-sm font-medium">${purchase.amount}</p>
            </div>

            {!isWithin24Hours && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This purchase is older than 24 hours. Refund approval may take longer or may not be granted based on our refund policy.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Refund Request *</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you are requesting a refund..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Your refund request will be reviewed by our team. You will be notified via email once a decision is made.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !reason.trim()}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestRefundModal;
