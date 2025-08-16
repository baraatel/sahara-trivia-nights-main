
import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Gift } from "lucide-react";

interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  is_free: boolean;
}

interface GrantAccessModalProps {
  selectedUserIds: string[];
  open: boolean;
  onClose: () => void;
  onAccessGranted: () => void;
}

const GrantAccessModal = ({ selectedUserIds, open, onClose, onAccessGranted }: GrantAccessModalProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      setFetchingCategories(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_en');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setFetchingCategories(false);
    }
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    }
  };

  const handleGrantAccess = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one category",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create purchases for each user-category combination
      const purchases = [];
      for (const userId of selectedUserIds) {
        for (const categoryId of selectedCategories) {
          const category = categories.find(c => c.id === categoryId);
          purchases.push({
            user_id: userId,
            category_id: categoryId,
            amount: category?.price || 0,
            currency: 'USD',
            payment_provider: 'admin_grant',
            order_status: 'completed',
            status: 'completed',
            order_id: `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          });
        }
      }

      const { error: insertError } = await supabase
        .from('user_game_purchases')
        .insert(purchases);

      if (insertError) throw insertError;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_admin_id: user.id,
        p_action_type: 'grant_access',
        p_target_type: 'bulk_users',
        p_target_id: selectedUserIds[0], // Use first user ID as reference
        p_details: {
          user_count: selectedUserIds.length,
          categories: selectedCategories,
          granted_categories: categories.filter(c => selectedCategories.includes(c.id)).map(c => c.name_en)
        }
      });

      toast({
        title: "Success",
        description: `Access granted to ${selectedUserIds.length} user(s) for ${selectedCategories.length} category(ies)`,
      });

      onAccessGranted();
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: "Error",
        description: "Failed to grant access. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Grant Category Access
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Selected Users:</strong> {selectedUserIds.length} user(s) will receive access to the selected categories.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Select Categories to Grant</Label>
            
            {fetchingCategories ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border rounded">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50"
                  >
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryToggle(category.id, !!checked)}
                    />
                    <div className="flex-1">
                      <label htmlFor={category.id} className="cursor-pointer">
                        <div className="font-medium">{category.name_en}</div>
                        {category.name_ar && (
                          <div className="text-sm text-gray-500">{category.name_ar}</div>
                        )}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      {category.is_free ? (
                        <Badge className="bg-green-100 text-green-800">Free</Badge>
                      ) : (
                        <Badge variant="outline">${category.price}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedCategories.length > 0 && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
              <strong>Summary:</strong> {selectedCategories.length} category(ies) will be granted to {selectedUserIds.length} user(s).
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleGrantAccess} 
            disabled={loading || selectedCategories.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Granting Access..." : "Grant Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GrantAccessModal;
