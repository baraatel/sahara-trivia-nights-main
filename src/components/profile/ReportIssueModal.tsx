
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

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

interface ReportIssueModalProps {
  purchase: Purchase | null;
  open: boolean;
  onClose: () => void;
  onIssueReported: () => void;
}

const ReportIssueModal = ({ purchase, open, onClose, onIssueReported }: ReportIssueModalProps) => {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!purchase || !issueType.trim() || !description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('issue_reports')
        .insert({
          user_id: user.id,
          purchase_id: purchase.id,
          category_id: purchase.category_id,
          issue_type: issueType,
          description: description.trim(),
          priority: 'medium',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your issue has been reported and will be reviewed by our team.",
      });

      onIssueReported();
      onClose();
      setIssueType("");
      setDescription("");
    } catch (error) {
      console.error('Error submitting issue report:', error);
      toast({
        title: "Error",
        description: "Failed to submit issue report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Report Issue
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

            <div className="space-y-2">
              <Label htmlFor="issue-type">Issue Type *</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_problem">Payment Problem</SelectItem>
                  <SelectItem value="access_issue">Access Issue</SelectItem>
                  <SelectItem value="technical_problem">Technical Problem</SelectItem>
                  <SelectItem value="content_quality">Content Quality</SelectItem>
                  <SelectItem value="billing_inquiry">Billing Inquiry</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue you're experiencing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Your issue report will be reviewed by our support team. You will be contacted via email with updates.
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
            disabled={loading || !issueType.trim() || !description.trim()}
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueModal;
