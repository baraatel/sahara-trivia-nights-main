
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { 
  DollarSign, ShoppingCart, Users, TrendingUp, 
  RefreshCw, Calendar, Eye, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface FinancialStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalUsers: number;
  conversionRate: number;
  refundRate: number;
  visitorsCount: number;
}

interface CategorySales {
  id: string;
  name_en: string;
  name_ar: string;
  purchase_count: number;
  total_revenue: number;
  avg_price: number;
}

interface MonthlyData {
  month: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  completed_orders: number;
  refunded_orders: number;
  total_refunds: number;
}

interface OrderStatusData {
  status: string;
  count: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const FinancialDashboard = () => {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalUsers: 0,
    conversionRate: 0,
    refundRate: 0,
    visitorsCount: 0
  });
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch basic financial stats
      const { data: purchaseStats } = await supabase
        .from('user_game_purchases')
        .select('amount, order_status, refund_status, refund_amount');

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch visitors count
      const { count: visitorsCount } = await supabase
        .from('visitor_analytics')
        .select('*', { count: 'exact', head: true });

      // Calculate stats
      const completedOrders = purchaseStats?.filter(p => p.order_status === 'completed') || [];
      const refundedOrders = purchaseStats?.filter(p => p.refund_status === 'completed') || [];
      
      const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.amount), 0);
      const totalOrders = purchaseStats?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / completedOrders.length : 0;
      const conversionRate = totalUsers && totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;
      const refundRate = totalOrders > 0 ? (refundedOrders.length / totalOrders) * 100 : 0;

      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalUsers: totalUsers || 0,
        conversionRate,
        refundRate,
        visitorsCount: visitorsCount || 0
      });

      // Fetch category sales data
      const { data: categoryData } = await supabase
        .from('category_sales_summary')
        .select('*')
        .limit(10);

      setCategorySales(categoryData || []);

      // Fetch monthly financial data
      const { data: monthlyFinancialData } = await supabase
        .from('financial_summary')
        .select('*')
        .limit(12);

      const formattedMonthlyData = monthlyFinancialData?.map(item => ({
        ...item,
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })) || [];

      setMonthlyData(formattedMonthlyData);

      // Prepare order status data for pie chart
      const statusCounts = {
        completed: completedOrders.length,
        pending: purchaseStats?.filter(p => p.order_status === 'pending').length || 0,
        refunded: refundedOrders.length,
        cancelled: purchaseStats?.filter(p => p.order_status === 'cancelled').length || 0
      };

      const statusData: OrderStatusData[] = [
        { status: 'Completed', count: statusCounts.completed, color: '#00C49F' },
        { status: 'Pending', count: statusCounts.pending, color: '#FFBB28' },
        { status: 'Refunded', count: statusCounts.refunded, color: '#FF8042' },
        { status: 'Cancelled', count: statusCounts.cancelled, color: '#8884d8' }
      ].filter(item => item.count > 0);

      setOrderStatusData(statusData);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading financial dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Dashboard</h2>
        <Button onClick={fetchFinancialData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Total Orders</p>
                <p className="text-2xl font-bold text-blue-800">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-700">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-800">
                  ${stats.avgOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Total Users</p>
                <p className="text-2xl font-bold text-orange-800">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-teal-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-teal-700">Visitors</p>
                <p className="text-2xl font-bold text-teal-800">{stats.visitorsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-indigo-700">Conversion Rate</p>
                <p className="text-2xl font-bold text-indigo-800">
                  {stats.conversionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-700">Refund Rate</p>
                <p className="text-2xl font-bold text-red-800">
                  {stats.refundRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Purchased Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Most Purchased Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySales} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name_en" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="total_revenue" fill="#8884d8" name="Revenue ($)" />
                  <Bar dataKey="purchase_count" fill="#82ca9d" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count, percent }) => 
                      `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Orders Trends (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="total_revenue" fill="#8884d8" name="Revenue ($)" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="total_orders" 
                  stroke="#82ca9d" 
                  strokeWidth={3}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
