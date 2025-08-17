
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Plus, Trash2, Gift, Search, Filter, Edit, Calendar, Users, Zap } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RedemptionCode {
  id: string;
  code: string;
  code_type: string;
  value_type: string;
  value_data: any;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  created_by: string;
}

const RedemptionCodeManager = () => {
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<RedemptionCode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
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

  const [editCode, setEditCode] = useState({
    codeType: 'category',
    valueType: '',
    categoryId: '',
    selectedCategories: [] as string[],
    gameCount: '1',
    creditAmount: '',
    premiumDays: '',
    usageLimit: '1',
    expiresAt: '',
    isActive: true
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

  // Filter and sort codes
  const filteredAndSortedCodes = codes
    .filter(code => {
      const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           code.code_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "active" && code.is_active) ||
                           (statusFilter === "inactive" && !code.is_active);
      const matchesType = typeFilter === "all" || code.code_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "code":
          aValue = a.code;
          bValue = b.code;
          break;
        case "type":
          aValue = a.code_type;
          bValue = b.code_type;
          break;
        case "usage":
          aValue = a.usage_count;
          bValue = b.usage_count;
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[sortBy as keyof RedemptionCode];
          bValue = b[sortBy as keyof RedemptionCode];
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const updateCode = async () => {
    if (!editingCode) return;

    setEditing(true);
    try {
      let valueData = {};
      let valueType = editCode.codeType;

      if (editCode.codeType === 'category') {
        if (!editCode.categoryId) {
          toast({
            title: "Error",
            description: "Please select a category",
            variant: "destructive",
          });
          return;
        }
        valueData = { category_id: editCode.categoryId };
        valueType = 'category_access';
      } else if (editCode.codeType === 'categories') {
        if (editCode.selectedCategories.length === 0) {
          toast({
            title: "Error",
            description: "Please select at least one category",
            variant: "destructive",
          });
          return;
        }
        valueData = { category_ids: editCode.selectedCategories };
        valueType = 'categories_access';
      } else if (editCode.codeType === 'games') {
        if (!editCode.gameCount || parseInt(editCode.gameCount) < 1) {
          toast({
            title: "Error",
            description: "Please enter a valid number of games",
            variant: "destructive",
          });
          return;
        }
        valueData = { game_count: parseInt(editCode.gameCount) };
        valueType = 'games_access';
      } else if (editCode.codeType === 'credits') {
        if (!editCode.creditAmount) {
          toast({
            title: "Error",
            description: "Please enter credit amount",
            variant: "destructive",
          });
          return;
        }
        valueData = { amount: parseInt(editCode.creditAmount) };
        valueType = 'credits';
      } else if (editCode.codeType === 'premium') {
        if (!editCode.premiumDays) {
          toast({
            title: "Error",
            description: "Please enter premium days",
            variant: "destructive",
          });
          return;
        }
        valueData = { days: parseInt(editCode.premiumDays) };
        valueType = 'premium_days';
      }

      // Update the redemption code
      const { error: updateError } = await supabase
        .from('redemption_codes')
        .update({
          code_type: editCode.codeType,
          value_type: valueType,
          value_data: valueData,
          usage_limit: parseInt(editCode.usageLimit),
          expires_at: editCode.expiresAt || null,
          is_active: editCode.isActive
        })
        .eq('id', editingCode.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Redemption code ${editingCode.code} updated successfully`,
      });

      setShowEditDialog(false);
      setEditingCode(null);
      fetchData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const openEditDialog = (code: RedemptionCode) => {
    setEditingCode(code);
    
    // Populate edit form with current values
    setEditCode({
      codeType: code.code_type,
      valueType: code.value_type,
      categoryId: code.value_data?.category_id || '',
      selectedCategories: code.value_data?.category_ids || [],
      gameCount: code.value_data?.game_count?.toString() || '1',
      creditAmount: code.value_data?.amount?.toString() || '',
      premiumDays: code.value_data?.days?.toString() || '',
      usageLimit: code.usage_limit.toString(),
      expiresAt: code.expires_at ? new Date(code.expires_at).toISOString().slice(0, 16) : '',
      isActive: code.is_active
    });
    
    setShowEditDialog(true);
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('redemption_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Code ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redemption code?')) return;

    try {
      const { error } = await supabase
        .from('redemption_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Redemption code deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
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

  const getCodeTypeIcon = (codeType: string) => {
    switch (codeType) {
      case 'category':
      case 'categories':
        return <Gift className="h-4 w-4" />;
      case 'games':
        return <Zap className="h-4 w-4" />;
      case 'credits':
        return <Users className="h-4 w-4" />;
      case 'premium':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
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

  const getValueDisplay = (code: RedemptionCode) => {
    switch (code.code_type) {
      case 'category':
        return categories.find(c => c.id === code.value_data?.category_id)?.name_en || 'Unknown Category';
      case 'categories':
        return `${code.value_data?.category_ids?.length || 0} categories`;
      case 'games':
        return `${code.value_data?.game_count || 0} games`;
      case 'credits':
        return `${code.value_data?.amount} credits`;
      case 'premium':
        return `${code.value_data?.days} days`;
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Redemption Code Management</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Code
          </Button>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Redemption Code Management</h1>
          <p className="text-gray-600 mt-1">Create and manage redemption codes for your users</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Code +
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
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
                  <Label htmlFor="categoryId">Category</Label>
                  <Select value={newCode.categoryId} onValueChange={(value) => setNewCode({ ...newCode, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
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
                  <Label>Categories</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={newCode.selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewCode({
                                ...newCode,
                                selectedCategories: [...newCode.selectedCategories, category.id]
                              });
                            } else {
                              setNewCode({
                                ...newCode,
                                selectedCategories: newCode.selectedCategories.filter(id => id !== category.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={category.id} className="text-sm">{category.name_en}</Label>
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
                    min="1"
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
                    min="1"
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

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Gift className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="categories">Categories</SelectItem>
                <SelectItem value="games">Games</SelectItem>
                <SelectItem value="credits">Credits</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sort: {sortBy === 'created_at' ? 'Created' : sortBy === 'code' ? 'Code' : sortBy === 'type' ? 'Type' : 'Usage'}
                  {sortOrder === 'desc' ? ' ↓' : ' ↑'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setSortBy('created_at'); setSortOrder('desc'); }}>
                  Created (Newest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('created_at'); setSortOrder('asc'); }}>
                  Created (Oldest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('code'); setSortOrder('asc'); }}>
                  Code (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('code'); setSortOrder('desc'); }}>
                  Code (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('type'); setSortOrder('asc'); }}>
                  Type (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('usage'); setSortOrder('desc'); }}>
                  Usage (High-Low)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('usage'); setSortOrder('asc'); }}>
                  Usage (Low-High)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-2xl font-bold">{codes.length}</p>
              </div>
              <Gift className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Codes</p>
                <p className="text-2xl font-bold">{codes.filter(c => c.is_active).length}</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold">{codes.reduce((sum, c) => sum + c.usage_count, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired Soon</p>
                <p className="text-2xl font-bold">
                  {codes.filter(c => c.expires_at && new Date(c.expires_at) > new Date() && new Date(c.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Generated Codes ({filteredAndSortedCodes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="[&_tr]:border-b [&_tr]:border-gray-100 [&_td]:py-4 [&_th]:py-4">
            <TableHeader>
              <TableRow>
                <TableHead className="py-4 font-medium text-center">Code</TableHead>
                <TableHead className="py-4 font-medium text-center">Type</TableHead>
                <TableHead className="py-4 font-medium text-center">Value</TableHead>
                <TableHead className="py-4 font-medium text-center">Usage</TableHead>
                <TableHead className="py-4 font-medium text-center">Status</TableHead>
                <TableHead className="py-4 font-medium text-center">Expires</TableHead>
                <TableHead className="py-4 font-medium text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-sm">{code.code}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code.code)}
                        className="h-6 w-6 p-0 flex items-center justify-center"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-gray-500 flex items-center">{getCodeTypeIcon(code.code_type)}</span>
                      <Badge variant="outline" className="text-xs">{getCodeTypeLabel(code.code_type)}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <span className="font-medium text-sm">{getValueDisplay(code)}</span>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-medium text-sm min-w-[3rem]">{code.usage_count}/{code.usage_limit}</span>
                      {code.usage_count > 0 && (
                        <div className="w-20 bg-gray-200 rounded-full h-2 flex-shrink-0">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-200" 
                            style={{ width: `${Math.min((code.usage_count / code.usage_limit) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <Badge 
                      className={`text-xs ${code.is_active ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    {code.expires_at ? (
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{new Date(code.expires_at).toLocaleDateString()}</div>
                        <div className={`text-xs ${
                          new Date(code.expires_at) < new Date() ? 'text-red-500' : 
                          new Date(code.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-orange-500' : 'text-gray-500'
                        }`}>
                          {new Date(code.expires_at) < new Date() ? 'Expired' : 
                           new Date(code.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'Expires Soon' : 'Valid'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(code)}
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCodeStatus(code.id, code.is_active)}
                        className="h-8 px-3 text-xs flex items-center justify-center"
                      >
                        {code.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCode(code.id)}
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredAndSortedCodes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {codes.length === 0 ? 'No redemption codes created yet' : 'No codes match your filters'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Redemption Code: {editingCode?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCodeType">Code Type</Label>
              <Select value={editCode.codeType} onValueChange={(value) => setEditCode({ ...editCode, codeType: value })}>
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

            {editCode.codeType === 'category' && (
              <div>
                <Label htmlFor="editCategoryId">Category</Label>
                <Select value={editCode.categoryId} onValueChange={(value) => setEditCode({ ...editCode, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
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

            {editCode.codeType === 'categories' && (
              <div>
                <Label>Categories</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${category.id}`}
                        checked={editCode.selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditCode({
                              ...editCode,
                              selectedCategories: [...editCode.selectedCategories, category.id]
                            });
                          } else {
                            setEditCode({
                              ...editCode,
                              selectedCategories: editCode.selectedCategories.filter(id => id !== category.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`edit-${category.id}`} className="text-sm">{category.name_en}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editCode.codeType === 'games' && (
              <div>
                <Label htmlFor="editGameCount">Number of Games</Label>
                <Input
                  type="number"
                  value={editCode.gameCount}
                  onChange={(e) => setEditCode({ ...editCode, gameCount: e.target.value })}
                  min="1"
                />
              </div>
            )}

            {editCode.codeType === 'credits' && (
              <div>
                <Label htmlFor="editCreditAmount">Credit Amount</Label>
                <Input
                  type="number"
                  value={editCode.creditAmount}
                  onChange={(e) => setEditCode({ ...editCode, creditAmount: e.target.value })}
                  min="1"
                />
              </div>
            )}

            {editCode.codeType === 'premium' && (
              <div>
                <Label htmlFor="editPremiumDays">Premium Days</Label>
                <Input
                  type="number"
                  value={editCode.premiumDays}
                  onChange={(e) => setEditCode({ ...editCode, premiumDays: e.target.value })}
                  min="1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="editUsageLimit">Usage Limit</Label>
              <Input
                type="number"
                value={editCode.usageLimit}
                onChange={(e) => setEditCode({ ...editCode, usageLimit: e.target.value })}
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="editExpiresAt">Expires At (Optional)</Label>
              <Input
                type="datetime-local"
                value={editCode.expiresAt}
                onChange={(e) => setEditCode({ ...editCode, expiresAt: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsActive"
                checked={editCode.isActive}
                onCheckedChange={(checked) => setEditCode({ ...editCode, isActive: checked as boolean })}
              />
              <Label htmlFor="editIsActive">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowEditDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={updateCode} disabled={editing} className="flex-1">
                {editing ? 'Updating...' : 'Update Code'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RedemptionCodeManager;
