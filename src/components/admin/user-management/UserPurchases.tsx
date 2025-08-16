
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Trash2, Edit3, Plus } from "lucide-react";
import EditPurchaseModal from "./EditPurchaseModal";
import AddPurchaseModal from "./AddPurchaseModal";

interface Purchase {
  id: string;
  amount: number;
  currency: string;
  purchased_at: string;
  status: string;
  order_status: string;
  payment_provider: string;
  order_id: string;
  categories: {
    name_en: string;
    name_ar: string;
  };
}

interface UserPurchasesProps {
  userId: string;
  onPurchaseUpdated: () => void;
}

const UserPurchases = ({ userId, onPurchaseUpdated }: UserPurchasesProps) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchases();
  }, [userId]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_game_purchases')
        .select(`
          *,
          categories (name_en, name_ar)
        `)
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: "Error",
        description: "Failed to fetch purchases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('user_game_purchases')
        .delete()
        .eq('id', purchaseId);

      if (error) throw error;

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('log_admin_action', {
          p_admin_id: user.id,
          p_action_type: 'delete_purchase',
          p_target_type: 'purchase',
          p_target_id: purchaseId,
        });
      }

      toast({
        title: "Success",
        description: "Purchase deleted successfully",
      });

      fetchPurchases();
      onPurchaseUpdated();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, orderStatus?: string) => {
    if (orderStatus === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (orderStatus === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    } else if (orderStatus === 'failed') {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    } else {
      return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Purchase History</CardTitle>
          <Button
            onClick={() => setShowAddPurchase(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Purchase
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No purchases found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{purchase.categories.name_en}</div>
                      <div className="text-sm text-gray-500">Order: {purchase.order_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${purchase.amount} {purchase.currency}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(purchase.status, purchase.order_status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{purchase.payment_provider}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(purchase.purchased_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPurchase(purchase)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this purchase? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePurchase(purchase.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {editingPurchase && (
          <EditPurchaseModal
            purchase={editingPurchase}
            open={!!editingPurchase}
            onClose={() => setEditingPurchase(null)}
            onPurchaseUpdated={() => {
              fetchPurchases();
              onPurchaseUpdated();
            }}
          />
        )}

        {showAddPurchase && (
          <AddPurchaseModal
            userId={userId}
            open={showAddPurchase}
            onClose={() => setShowAddPurchase(false)}
            onPurchaseAdded={() => {
              fetchPurchases();
              onPurchaseUpdated();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default UserPurchases;
