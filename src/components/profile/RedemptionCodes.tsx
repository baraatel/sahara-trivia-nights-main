
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const RedemptionCodes = () => {
  const [redemptionCode, setRedemptionCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRedemptionHistory();
  }, []);

  const fetchRedemptionHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('code_redemptions')
        .select(`
          *,
          redemption_codes (
            code,
            code_type,
            value_type,
            value_data
          )
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      setRedemptionHistory(data || []);
    } catch (error) {
      console.error('Error fetching redemption history:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemCode = async () => {
    if (!redemptionCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a redemption code",
        variant: "destructive",
      });
      return;
    }

    setRedeeming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, check if the code exists and is valid
      const { data: codeData, error: codeError } = await supabase
        .from('redemption_codes')
        .select('*')
        .eq('code', redemptionCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeError || !codeData) {
        toast({
          title: "Invalid Code",
          description: "The redemption code is invalid or has expired",
          variant: "destructive",
        });
        return;
      }

      // Check if code has reached usage limit
      if (codeData.usage_count >= codeData.usage_limit) {
        toast({
          title: "Code Expired",
          description: "This redemption code has reached its usage limit",
          variant: "destructive",
        });
        return;
      }

      // Check if code has expired
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast({
          title: "Code Expired",
          description: "This redemption code has expired",
          variant: "destructive",
        });
        return;
      }

      // Check if user has already redeemed this code
      const { data: existingRedemption, error: checkError } = await supabase
        .from('code_redemptions')
        .select('*')
        .eq('code_id', codeData.id)
        .eq('user_id', user.id)
        .single();

      if (existingRedemption) {
        toast({
          title: "Already Redeemed",
          description: "You have already redeemed this code",
          variant: "destructive",
        });
        return;
      }

      // Process the redemption based on code type
      let successMessage = "Code redeemed successfully!";
      
      if (codeData.code_type === 'category') {
        // Grant single category access
        const { error: accessError } = await supabase
          .from('user_category_access')
          .insert({
            user_id: user.id,
            category_id: codeData.value_data.category_id,
            source_type: 'redemption_code',
            source_id: codeData.id
          });

        if (accessError) throw accessError;
        successMessage = "Category access granted successfully!";

      } else if (codeData.code_type === 'categories') {
        // Grant multiple category access
        const categoryAccesses = codeData.value_data.category_ids.map((categoryId: string) => ({
          user_id: user.id,
          category_id: categoryId,
          source_type: 'redemption_code',
          source_id: codeData.id
        }));

        const { error: accessError } = await supabase
          .from('user_category_access')
          .insert(categoryAccesses);

        if (accessError) throw accessError;
        successMessage = `${codeData.value_data.category_ids.length} categories access granted successfully!`;

      } else if (codeData.code_type === 'games') {
        // Grant game access
        const { error: accessError } = await supabase
          .from('user_game_access')
          .insert({
            user_id: user.id,
            games_granted: codeData.value_data.game_count,
            source_type: 'redemption_code',
            source_id: codeData.id
          });

        if (accessError) throw accessError;
        successMessage = `${codeData.value_data.game_count} games access granted successfully!`;

      } else if (codeData.code_type === 'credits') {
        // Add credits to user account
        const { error: creditError } = await supabase
          .rpc('add_user_credits', {
            user_id_param: user.id,
            credits_to_add: codeData.value_data.amount
          });

        if (creditError) throw creditError;
        successMessage = `${codeData.value_data.amount} credits added successfully!`;

      } else if (codeData.code_type === 'premium') {
        // Add premium days
        const { error: premiumError } = await supabase
          .rpc('add_premium_days', {
            user_id_param: user.id,
            days_to_add: codeData.value_data.days
          });

        if (premiumError) throw premiumError;
        successMessage = `${codeData.value_data.days} premium days added successfully!`;
      }

      // Record the redemption
      const { error: redemptionError } = await supabase
        .from('code_redemptions')
        .insert({
          code_id: codeData.id,
          user_id: user.id
        });

      if (redemptionError) throw redemptionError;

      // Update usage count
      const { error: updateError } = await supabase
        .from('redemption_codes')
        .update({ usage_count: codeData.usage_count + 1 })
        .eq('id', codeData.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: successMessage,
      });

      setRedemptionCode("");
      fetchRedemptionHistory();

    } catch (error: any) {
      console.error('Error redeeming code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to redeem code",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const getCodeTypeLabel = (codeType: string) => {
    switch (codeType) {
      case 'category': return 'Single Category';
      case 'categories': return 'Multiple Categories';
      case 'games': return 'Game Access';
      case 'credits': return 'Credits';
      case 'premium': return 'Premium Days';
      default: return codeType;
    }
  };

  const getCodeValueLabel = (code: any) => {
    switch (code.code_type) {
      case 'category': return `Category Access`;
      case 'categories': return `${code.value_data?.category_ids?.length || 0} Categories`;
      case 'games': return `${code.value_data?.game_count || 0} Games`;
      case 'credits': return `${code.value_data?.amount} Credits`;
      case 'premium': return `${code.value_data?.days} Days`;
      default: return 'Unknown';
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Redemption Codes</h2>
      </div>

      {/* Redeem Code Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Redeem Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="redemptionCode">Redemption Code</Label>
              <Input
                id="redemptionCode"
                value={redemptionCode}
                onChange={(e) => setRedemptionCode(e.target.value)}
                placeholder="Enter your redemption code"
                className="font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={redeemCode} 
                disabled={redeeming || !redemptionCode.trim()}
                className="min-w-[100px]"
              >
                {redeeming ? 'Redeeming...' : 'Redeem'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redemption History */}
      <Card>
        <CardHeader>
          <CardTitle>Redemption History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Redeemed At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redemptionHistory.map((redemption: any) => (
                <TableRow key={redemption.id}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      {redemption.redemption_codes?.code}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(redemption.redemption_codes?.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{getCodeTypeLabel(redemption.redemption_codes?.code_type)}</Badge>
                  </TableCell>
                  <TableCell>
                    {getCodeValueLabel(redemption.redemption_codes)}
                  </TableCell>
                  <TableCell>
                    {new Date(redemption.redeemed_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Redeemed</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {redemptionHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No redemption history yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RedemptionCodes;
