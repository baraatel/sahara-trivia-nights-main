
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Plus, Trash2, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RedemptionCodeManager = () => {
  const [codes, setCodes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const [newCode, setNewCode] = useState({
    codeType: 'category',
    valueType: '',
    categoryId: '',
    selectedCategories: [] as string[],
    gameCount: '1',
    creditAmount: '',
    premiumDays: '',
    usageLimit: '1',
    expiresAt: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch redemption codes
      const { data: codesData, error: codesError } = await supabase
        .from('redemption_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;
      setCodes(codesData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name_en');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load redemption codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!newCode.codeType) return;

    setCreating(true);
    try {
      let valueData = {};
      let valueType = newCode.codeType;

      if (newCode.codeType === 'category') {
        if (!newCode.categoryId) {
          toast({
            title: "Error",
            description: "Please select a category",
            variant: "destructive",
          });
          return;
        }
        valueData = { category_id: newCode.categoryId };
        valueType = 'category_access';
      } else if (newCode.codeType === 'categories') {
        if (newCode.selectedCategories.length === 0) {
          toast({
            title: "Error",
            description: "Please select at least one category",
            variant: "destructive",
          });
          return;
        }
        valueData = { category_ids: newCode.selectedCategories };
        valueType = 'categories_access';
      } else if (newCode.codeType === 'games') {
        if (!newCode.gameCount || parseInt(newCode.gameCount) < 1) {
          toast({
            title: "Error",
            description: "Please enter a valid number of games",
            variant: "destructive",
          });
          return;
        }
        valueData = { game_count: parseInt(newCode.gameCount) };
        valueType = 'games_access';
      } else if (newCode.codeType === 'credits') {
        if (!newCode.creditAmount) {
          toast({
            title: "Error",
            description: "Please enter credit amount",
            variant: "destructive",
          });
          return;
        }
        valueData = { amount: parseInt(newCode.creditAmount) };
        valueType = 'credits';
      } else if (newCode.codeType === 'premium') {
        if (!newCode.premiumDays) {
          toast({
            title: "Error",
            description: "Please enter premium days",
            variant: "destructive",
          });
          return;
        }
        valueData = { days: parseInt(newCode.premiumDays) };
        valueType = 'premium_days';
      }

      // Generate unique code
      const { data: generatedCode, error: genError } = await supabase
        .rpc('generate_redemption_code');

      if (genError) throw genError;

      // Create the redemption code
      const { data: { session } } = await supabase.auth.getSession();
      const { error: insertError } = await supabase
        .from('redemption_codes')
        .insert({
          code: generatedCode,
          code_type: newCode.codeType,
          value_type: valueType,
          value_data: valueData,
          usage_limit: parseInt(newCode.usageLimit),
          expires_at: newCode.expiresAt || null,
          created_by: session?.user?.id
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `Redemption code ${generatedCode} created successfully`,
      });

      // Reset form
      setNewCode({
        codeType: 'category',
        valueType: '',
        categoryId: '',
        selectedCategories: [],
        gameCount: '1',
        creditAmount: '',
        premiumDays: '',
        usageLimit: '1',
        expiresAt: ''
      });

      setShowCreateDialog(false);
      fetchData();

    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: `Code ${code} copied to clipboard`,
    });
  };

  const deleteCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('redemption_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Redemption code deleted successfully",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('redemption_codes')
        .update({ is_active: !currentStatus })
        .eq('id', codeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Code status updated successfully",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setNewCode({
        ...newCode,
        selectedCategories: [...newCode.selectedCategories, categoryId]
      });
    } else {
      setNewCode({
        ...newCode,
        selectedCategories: newCode.selectedCategories.filter(id => id !== categoryId)
      });
    }
  };

  const resetForm = () => {
    setNewCode({
      codeType: 'category',
      valueType: '',
      categoryId: '',
      selectedCategories: [],
      gameCount: '1',
      creditAmount: '',
      premiumDays: '',
      usageLimit: '1',
      expiresAt: ''
    });
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Redemption Code Management</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Redemption Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="codeType">Code Type</Label>
                <Select value={newCode.codeType} onValueChange={(value) => setNewCode({ ...newCode, codeType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Single Category Access</SelectItem>
                    <SelectItem value="categories">Multiple Categories Access</SelectItem>
                    <SelectItem value="games">Game Access</SelectItem>
                    <SelectItem value="credits">Credits</SelectItem>
                    <SelectItem value="premium">Premium Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCode.codeType === 'category' && (
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newCode.categoryId} onValueChange={(value) => setNewCode({ ...newCode, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newCode.codeType === 'categories' && (
                <div>
                  <Label>Select Categories ({newCode.selectedCategories.length} selected)</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={newCode.selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => handleCategoryToggle(category.id, !!checked)}
                        />
                        <label htmlFor={category.id} className="text-sm cursor-pointer">
                          {category.name_en}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newCode.codeType === 'games' && (
                <div>
                  <Label htmlFor="gameCount">Number of Games</Label>
                  <Input
                    type="number"
                    value={newCode.gameCount}
                    onChange={(e) => setNewCode({ ...newCode, gameCount: e.target.value })}
                    placeholder="Enter number of games"
                    min="1"
                  />
                </div>
              )}

              {newCode.codeType === 'credits' && (
                <div>
                  <Label htmlFor="creditAmount">Credit Amount</Label>
                  <Input
                    type="number"
                    value={newCode.creditAmount}
                    onChange={(e) => setNewCode({ ...newCode, creditAmount: e.target.value })}
                    placeholder="Enter credit amount"
                  />
                </div>
              )}

              {newCode.codeType === 'premium' && (
                <div>
                  <Label htmlFor="premiumDays">Premium Days</Label>
                  <Input
                    type="number"
                    value={newCode.premiumDays}
                    onChange={(e) => setNewCode({ ...newCode, premiumDays: e.target.value })}
                    placeholder="Enter number of days"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  type="number"
                  value={newCode.usageLimit}
                  onChange={(e) => setNewCode({ ...newCode, usageLimit: e.target.value })}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={newCode.expiresAt}
                  onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Reset
                </Button>
                <Button onClick={generateCode} disabled={creating} className="flex-1">
                  {creating ? 'Creating...' : 'Generate Code'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Generated Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      {code.code}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{code.code_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {code.code_type === 'category' && categories.find(c => c.id === code.value_data?.category_id)?.name_en}
                    {code.code_type === 'categories' && `${code.value_data?.category_ids?.length || 0} categories`}
                    {code.code_type === 'games' && `${code.value_data?.game_count || 0} games`}
                    {code.code_type === 'credits' && `${code.value_data?.amount} credits`}
                    {code.code_type === 'premium' && `${code.value_data?.days} days`}
                  </TableCell>
                  <TableCell>
                    {code.usage_count}/{code.usage_limit}
                  </TableCell>
                  <TableCell>
                    <Badge className={code.is_active ? 'bg-green-500' : 'bg-red-500'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCodeStatus(code.id, code.is_active)}
                      >
                        {code.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCode(code.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {codes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No redemption codes created yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RedemptionCodeManager;
