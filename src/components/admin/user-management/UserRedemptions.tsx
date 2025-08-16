
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
import { Gift } from "lucide-react";

interface Redemption {
  id: string;
  redeemed_at: string;
  redemption_codes: {
    code: string;
    code_type: string;
    value_type: string;
    value_data: any;
  };
}

interface UserRedemptionsProps {
  userId: string;
  onRedemptionUpdated: () => void;
}

const UserRedemptions = ({ userId, onRedemptionUpdated }: UserRedemptionsProps) => {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRedemptions();
  }, [userId]);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('code_redemptions')
        .select(`
          *,
          redemption_codes (code, code_type, value_type, value_data)
        `)
        .eq('user_id', userId)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      setRedemptions(data || []);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch redemptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Code Redemptions</CardTitle>
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
        <CardTitle>Code Redemptions</CardTitle>
      </CardHeader>
      <CardContent>
        {redemptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Gift className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No redemptions found</h3>
            <p>This user hasn't redeemed any codes yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Redeemed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redemptions.map((redemption) => (
                <TableRow key={redemption.id}>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {redemption.redemption_codes.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {redemption.redemption_codes.code_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{redemption.redemption_codes.value_type}</div>
                      <div className="text-gray-500">
                        {JSON.stringify(redemption.redemption_codes.value_data)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(redemption.redeemed_at), 'MMM dd, yyyy HH:mm')}
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

export default UserRedemptions;
