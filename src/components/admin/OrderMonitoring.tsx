import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, RefreshCw, DollarSign, Calendar, User, Package } from "lucide-react";

interface Purchase {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  order_status: string;
  refund_status: string;
  refund_amount: number;
  purchased_at: string;
  refunded_at: string | null;
  refund_reason: string | null;
  payment_provider: string;
  transaction_id: string | null;
  categories: {
    name_en: string;
    name_ar: string;
  } | null;
  users: {
    username: string;
    email: string;
    full_name: string;
  } | null;
}

const OrderMonitoring = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    filterPurchases();
  }, [purchases, searchTerm, statusFilter]);

  const fetchPurchases = async () => {
    try {
      // First, get the purchases with categories
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('user_game_purchases')
        .select(`
          *,
          categories (name_en, name_ar)
        `)
        .order('purchased_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      // Then, get all users to match with purchases
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, email, full_name');

      if (usersError) throw usersError;

      // Create a map of users by ID for easy lookup
      const usersMap = new Map();
      usersData?.forEach(user => {
        usersMap.set(user.id, user);
      });

      // Transform the data to include user information
      const transformedData: Purchase[] = (purchasesData || []).map(item => ({
        ...item,
        categories: item.categories || null,
        users: usersMap.get(item.user_id) || null
      }));
      
      setPurchases(transformedData);
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

  const filterPurchases = () => {
    let filtered = purchases;

    if (searchTerm) {
      filtered = filtered.filter(purchase =>
        purchase.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.users?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.categories?.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(purchase => purchase.order_status === statusFilter);
    }

    setFilteredPurchases(filtered);
  };

  const processRefund = async () => {
    if (!selectedPurchase) return;

    setProcessing(true);
    try {
      const refundAmountNum = parseFloat(refundAmount) || selectedPurchase.amount;

      // Update purchase record
      const { error: updateError } = await supabase
        .from('user_game_purchases')
        .update({
          refund_status: 'completed',
          refund_amount: refundAmountNum,
          refunded_at: new Date().toISOString(),
          refund_reason: refundReason,
          order_status: 'refunded'
        })
        .eq('id', selectedPurchase.id);

      if (updateError) throw updateError;

      // Create refund history record
      const { data: { user } } = await supabase.auth.getUser();
      const { error: historyError } = await supabase
        .from('refund_history')
        .insert({
          purchase_id: selectedPurchase.id,
          admin_id: user?.id,
          refund_amount: refundAmountNum,
          refund_reason: refundReason,
          status: 'completed'
        });

      if (historyError) throw historyError;

      toast({
        title: "Success",
        description: `Refund of $${refundAmountNum} processed successfully`,
      });

      // Reset form and close dialog
      handleCloseRefundDialog();
      fetchPurchases();
    } catch (error) {
      console.error('Refund processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenRefundDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setRefundAmount(purchase.amount.toString());
    setRefundReason("");
    setIsRefundDialogOpen(true);
  };

  const handleCloseRefundDialog = () => {
    setSelectedPurchase(null);
    setRefundReason("");
    setRefundAmount("");
    setIsRefundDialogOpen(false);
  };

  const getStatusBadge = (status: string, refundStatus: string) => {
    if (refundStatus === 'completed') {
      return <Badge variant="destructive">Refunded</Badge>;
    }
    
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Order Monitoring</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Orders</Label>
              <Input
                id="search"
                placeholder="Search by order ID, username, email, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchPurchases} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid gap-4">
        {filteredPurchases.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredPurchases.map((purchase) => (
            <Card key={purchase.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {purchase.order_id}
                      </span>
                      {getStatusBadge(purchase.order_status, purchase.refund_status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{purchase.users?.full_name || purchase.users?.username || 'Unknown User'}</span>
                      <span>({purchase.users?.email || 'No email'})</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <strong>Category:</strong> {purchase.categories?.name_en || 'Unknown Category'}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>${purchase.amount} {purchase.currency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(purchase.purchased_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {purchase.refund_status === 'completed' && (
                      <div className="text-sm text-red-600">
                        <strong>Refunded:</strong> ${purchase.refund_amount} on{' '}
                        {purchase.refunded_at ? new Date(purchase.refunded_at).toLocaleDateString() : 'N/A'}
                        {purchase.refund_reason && (
                          <div className="mt-1">
                            <strong>Reason:</strong> {purchase.refund_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {purchase.refund_status === 'none' && purchase.order_status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenRefundDialog(purchase)}
                      >
                        Process Refund
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order ID</Label>
              <Input value={selectedPurchase?.order_id || ""} disabled />
            </div>
            <div>
              <Label>Original Amount</Label>
              <Input value={`$${selectedPurchase?.amount || 0}`} disabled />
            </div>
            <div>
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
              />
            </div>
            <div>
              <Label htmlFor="refund-reason">Refund Reason</Label>
              <Textarea
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter reason for refund..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={handleCloseRefundDialog}
              >
                Cancel
              </Button>
              <Button 
                onClick={processRefund}
                disabled={processing || !refundReason.trim()}
              >
                {processing ? "Processing..." : "Process Refund"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderMonitoring;
