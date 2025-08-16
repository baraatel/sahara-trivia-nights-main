
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DollarSign } from "lucide-react";

interface RefundRequest {
  id: string;
  reason: string;
  refund_amount: number;
  status: string;
  requested_at: string;
  processed_at?: string;
  admin_notes?: string;
  purchase_id: string;
}

interface RefundRequestsProps {
  userId: string;
}

const RefundRequests = ({ userId }: RefundRequestsProps) => {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRefundRequests();
  }, [userId]);

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRefundRequests(data || []);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch refund requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'processed':
        return <Badge className="bg-blue-100 text-blue-800">Processed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
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
        <CardTitle>Refund Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {refundRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No refund requests</h3>
            <p>You haven't requested any refunds yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium">${request.refund_amount}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={request.reason}>
                      {request.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(request.requested_at), 'MMM dd, yyyy')}
                      <div className="text-gray-500">
                        {format(new Date(request.requested_at), 'HH:mm')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.admin_notes && (
                      <div className="text-sm text-gray-600 max-w-xs truncate" title={request.admin_notes}>
                        {request.admin_notes}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RefundRequests;
