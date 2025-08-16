
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
import { format } from "date-fns";
import { FileText, Eye, DollarSign, AlertCircle } from "lucide-react";
import RequestRefundModal from "./RequestRefundModal";
import ReportIssueModal from "./ReportIssueModal";

interface Purchase {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  purchased_at: string;
  status: string;
  order_status: string;
  payment_provider: string;
  order_id: string;
  transaction_id?: string;
  categories: {
    id: string;
    name_en: string;
    name_ar: string;
  };
}

interface OrderHistoryProps {
  userId: string;
}

const OrderHistory = ({ userId }: OrderHistoryProps) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
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
          categories (id, name_en, name_ar)
        `)
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);

      // Update purchase count in parent component
      const purchaseCountElement = document.getElementById('purchase-count');
      if (purchaseCountElement) {
        purchaseCountElement.textContent = (data || []).length.toString();
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const isRefundEligible = (purchaseDate: string) => {
    const purchaseTime = new Date(purchaseDate).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - purchaseTime) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const getTotalSpent = () => {
    return purchases
      .filter(p => p.order_status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
      .toFixed(2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalSpent()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchases.filter(p => p.order_status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders yet</h3>
              <p>Your order history will appear here once you make your first purchase.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">#{purchase.order_id}</div>
                        {purchase.transaction_id && (
                          <div className="text-sm text-gray-500">
                            Transaction: {purchase.transaction_id}
                          </div>
                        )}
                        <Badge variant="outline" className="mt-1">
                          {purchase.payment_provider}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{purchase.categories.name_en}</div>
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
                      <div className="text-sm">
                        {format(new Date(purchase.purchased_at), 'MMM dd, yyyy')}
                        <div className="text-gray-500">
                          {format(new Date(purchase.purchased_at), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {purchase.order_status === 'completed' && isRefundEligible(purchase.purchased_at) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setShowRefundModal(true);
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Refund
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setShowIssueModal(true);
                          }}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Report Issue
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedPurchase && showRefundModal && (
        <RequestRefundModal
          purchase={selectedPurchase}
          open={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedPurchase(null);
          }}
          onRefundRequested={() => {
            setShowRefundModal(false);
            setSelectedPurchase(null);
            // Refresh data if needed
          }}
        />
      )}

      {selectedPurchase && showIssueModal && (
        <ReportIssueModal
          purchase={selectedPurchase}
          open={showIssueModal}
          onClose={() => {
            setShowIssueModal(false);
            setSelectedPurchase(null);
          }}
          onIssueReported={() => {
            setShowIssueModal(false);
            setSelectedPurchase(null);
            // Refresh data if needed
          }}
        />
      )}
    </div>
  );
};

export default OrderHistory;
