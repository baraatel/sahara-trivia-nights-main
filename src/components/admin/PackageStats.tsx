import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, DollarSign, Gamepad2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PackageStats {
  total_packages: number;
  active_packages: number;
  popular_packages: number;
  avg_price: number;
  total_savings: number;
}

interface PackageSalesSummary {
  id: string;
  name_ar: string;
  name_en: string;
  price: number;
  games_count: number;
  is_active: boolean;
  is_popular: boolean;
  purchase_count: number;
  total_revenue: number;
  avg_purchase_price: number;
  savings_per_package: number;
}

const PackageStats = () => {
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [salesSummary, setSalesSummary] = useState<PackageSalesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Load package statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_package_stats');

      if (statsError) throw statsError;

      setStats(statsData[0]);

      // Load package sales summary
      const { data: salesData, error: salesError } = await supabase
        .from('package_sales_summary')
        .select('*')
        .order('total_revenue', { ascending: false });

      if (salesError) throw salesError;

      setSalesSummary(salesData || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الإحصائيات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        لا توجد إحصائيات متاحة
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          إحصائيات الحزم
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحزم</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_packages}</div>
            <p className="text-xs text-muted-foreground">
              جميع الحزم المتاحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحزم النشطة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_packages}</div>
            <p className="text-xs text-muted-foreground">
              متاحة للمستخدمين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأكثر شعبية</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.popular_packages}</div>
            <p className="text-xs text-muted-foreground">
              حزم مميزة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط السعر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avg_price?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              متوسط سعر الحزمة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التوفير</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_savings?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              توفير إجمالي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ملخص مبيعات الحزم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2">اسم الحزمة</th>
                  <th className="text-right py-2">السعر</th>
                  <th className="text-right py-2">عدد الألعاب</th>
                  <th className="text-right py-2">عدد المبيعات</th>
                  <th className="text-right py-2">إجمالي الإيرادات</th>
                  <th className="text-right py-2">التوفير لكل حزمة</th>
                  <th className="text-right py-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {salesSummary.map((pkg) => (
                  <tr key={pkg.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2">
                      <div>
                        <div className="font-medium">{pkg.name_ar}</div>
                        <div className="text-xs text-gray-500">{pkg.name_en}</div>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="font-medium">{pkg.price}</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-blue-600" />
                        <span>{pkg.games_count}</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <span className="font-medium">{pkg.purchase_count}</span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="font-medium">{pkg.total_revenue?.toFixed(2) || '0.00'}</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="font-medium">{pkg.savings_per_package?.toFixed(2) || '0.00'}</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        {pkg.is_active && (
                          <Badge variant="default" className="text-xs">
                            نشط
                          </Badge>
                        )}
                        {pkg.is_popular && (
                          <Badge variant="secondary" className="text-xs">
                            شائع
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {salesSummary.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              لا توجد بيانات مبيعات متاحة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>أفضل الحزم أداءً</CardTitle>
          </CardHeader>
          <CardContent>
            {salesSummary
              .filter(p => p.purchase_count > 0)
              .slice(0, 3)
              .map((pkg, index) => (
                <div key={pkg.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{pkg.name_ar}</div>
                      <div className="text-xs text-gray-500">{pkg.purchase_count} مبيعات</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${pkg.total_revenue?.toFixed(2) || '0.00'}</div>
                    <div className="text-xs text-gray-500">إجمالي الإيرادات</div>
                  </div>
                </div>
              ))}
            {salesSummary.filter(p => p.purchase_count > 0).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                لا توجد مبيعات بعد
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أعلى التوفير</CardTitle>
          </CardHeader>
          <CardContent>
            {salesSummary
              .filter(p => p.savings_per_package > 0)
              .sort((a, b) => b.savings_per_package - a.savings_per_package)
              .slice(0, 3)
              .map((pkg, index) => (
                <div key={pkg.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{pkg.name_ar}</div>
                      <div className="text-xs text-gray-500">{pkg.games_count} ألعاب</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      ${pkg.savings_per_package?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-gray-500">توفير</div>
                  </div>
                </div>
              ))}
            {salesSummary.filter(p => p.savings_per_package > 0).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                لا توجد حزم بتوفير
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PackageStats;
