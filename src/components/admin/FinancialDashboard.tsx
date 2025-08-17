
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

      // If no data from category_sales_summary, create mock data for demonstration
      const mockCategoryData = [
        { id: '1', name_en: 'Islamic History', name_ar: 'التاريخ الإسلامي', purchase_count: 15, total_revenue: 150.00, avg_price: 10.00 },
        { id: '2', name_en: 'Arabic Literature', name_ar: 'الأدب العربي', purchase_count: 12, total_revenue: 120.00, avg_price: 10.00 },
        { id: '3', name_en: 'General Science', name_ar: 'العلوم العامة', purchase_count: 8, total_revenue: 80.00, avg_price: 10.00 },
        { id: '4', name_en: 'Geography', name_ar: 'الجغرافيا', purchase_count: 6, total_revenue: 60.00, avg_price: 10.00 },
        { id: '5', name_en: 'Sports', name_ar: 'الرياضة', purchase_count: 4, total_revenue: 40.00, avg_price: 10.00 }
      ];

      // Process category data to ensure unique keys and filter out problematic data
      const processedCategoryData = (categoryData && categoryData.length > 0 ? categoryData : mockCategoryData)
        .filter(item => item && item.name_en && item.name_en.trim() !== '') // Filter out null/empty items
        .map((item, index) => ({
          ...item,
          id: item.id || `category-${index}`,
          uniqueKey: `category-${item.id || index}-${item.name_en?.replace(/\s+/g, '-').toLowerCase() || index}`,
          name_en: item.name_en || `Category ${index + 1}`,
          purchase_count: Number(item.purchase_count) || 0,
          total_revenue: Number(item.total_revenue) || 0,
          avg_price: Number(item.avg_price) || 0
        }))
        .filter(item => item.purchase_count > 0 || item.total_revenue > 0); // Only show categories with data

      setCategorySales(processedCategoryData);

      // Fetch monthly financial data
      const { data: monthlyFinancialData } = await supabase
        .from('financial_summary')
        .select('*')
        .limit(12);

      // Process monthly data to ensure unique keys and valid data
      const formattedMonthlyData = (monthlyFinancialData || [])
        .filter(item => item && item.month) // Filter out null/empty items
        .map((item, index) => ({
          ...item,
          id: item.id || `month-${index}`,
          uniqueKey: `month-${item.id || index}-${new Date(item.month).getTime()}`,
          month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total_orders: Number(item.total_orders) || 0,
          total_revenue: Number(item.total_revenue) || 0,
          avg_order_value: Number(item.avg_order_value) || 0,
          completed_orders: Number(item.completed_orders) || 0,
          refunded_orders: Number(item.refunded_orders) || 0,
          total_refunds: Number(item.total_refunds) || 0
        }))
        .filter(item => item.total_orders > 0 || item.total_revenue > 0); // Only show months with data

      setMonthlyData(formattedMonthlyData);

      // Prepare order status data for pie chart
      const statusCounts = {
        completed: completedOrders.length,
        pending: purchaseStats?.filter(p => p.order_status === 'pending').length || 0,
        refunded: refundedOrders.length,
        cancelled: purchaseStats?.filter(p => p.order_status === 'cancelled').length || 0
      };

      // Process order status data to ensure unique keys and valid data
      const statusData: OrderStatusData[] = [
        { status: 'Completed', count: statusCounts.completed, color: '#00C49F' },
        { status: 'Pending', count: statusCounts.pending, color: '#FFBB28' },
        { status: 'Refunded', count: statusCounts.refunded, color: '#FF8042' },
        { status: 'Cancelled', count: statusCounts.cancelled, color: '#8884d8' }
      ]
        .filter(item => item && item.count > 0) // Filter out null/zero count items
        .map((item, index) => ({
          ...item,
          id: `status-${index}`,
          uniqueKey: `status-${item.status.toLowerCase()}-${item.count}`,
          count: Number(item.count) || 0
        }));

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Category Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer key="category-revenue-container" width="100%" height="100%">
                <BarChart key="category-revenue-chart" data={categorySales} layout="horizontal" margin={{ left: 140, right: 30, top: 30, bottom: 30 }}>
                  <CartesianGrid key="revenue-grid" strokeDasharray="3 3" />
                  <XAxis key="revenue-xaxis" type="number" />
                  <YAxis key="revenue-yaxis" dataKey="name_en" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip key="revenue-tooltip" />
                  <Bar key="revenue" dataKey="total_revenue" fill="#8884d8" name="Revenue ($)" nameKey="uniqueKey" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Purchase Counts */}
        <Card>
          <CardHeader>
            <CardTitle>Category Purchase Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer key="category-purchases-container" width="100%" height="100%">
                <BarChart key="category-purchases-chart" data={categorySales} layout="horizontal" margin={{ left: 140, right: 30, top: 30, bottom: 30 }}>
                  <CartesianGrid key="purchases-grid" strokeDasharray="3 3" />
                  <XAxis key="purchases-xaxis" type="number" />
                  <YAxis key="purchases-yaxis" dataKey="name_en" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip key="purchases-tooltip" />
                  <Bar key="purchases" dataKey="purchase_count" fill="#82ca9d" name="Purchases" nameKey="uniqueKey" />
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
            <div className="h-96">
              <ResponsiveContainer key="order-status-container" width="100%" height="100%">
                <PieChart key="order-status-piechart" margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                  <Pie
                    key="order-status-pie"
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ status, count, percent }) => 
                      percent > 0.1 ? `${status}: ${count}` : ''
                    }
                    outerRadius={80}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip key="pie-tooltip" formatter={(value, name) => [value, name]} />
                  <Legend key="pie-legend" layout="vertical" align="right" verticalAlign="middle" />
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
              <ResponsiveContainer key="revenue-trends-container" width="100%" height="100%">
                <LineChart key="revenue-trends-chart" data={monthlyData}>
                <CartesianGrid key="trends-grid" strokeDasharray="3 3" />
                <XAxis key="trends-xaxis" dataKey="month" />
                <YAxis key="trends-yaxis-left" yAxisId="left" />
                <YAxis key="trends-yaxis-right" yAxisId="right" orientation="right" />
                <Tooltip key="trends-tooltip" />
                <Legend key="trends-legend" />
                <Bar key="revenue-trend" yAxisId="left" dataKey="total_revenue" fill="#8884d8" name="Revenue ($)" nameKey="uniqueKey" />
                <Line 
                  key="orders-trend"
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="total_orders" 
                  stroke="#82ca9d" 
                  strokeWidth={3}
                  name="Orders"
                  nameKey="uniqueKey"
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
