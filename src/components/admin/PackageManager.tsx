import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Package, Star, DollarSign, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type GamePackage = Tables<"game_packages"> & {
  features?: Tables<"game_package_features">[];
};

type PackageFeature = Tables<"game_package_features">;

const PackageManager = () => {
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<GamePackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    price: 0,
    games_count: 1,
    is_active: true,
    is_popular: false,
    sort_order: 0,
    features: [] as { feature_ar: string; feature_en: string; icon: string; sort_order: number }[]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      
      // Load packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('game_packages')
        .select('*')
        .order('sort_order');

      if (packagesError) throw packagesError;

      // Load features for each package
      const packagesWithFeatures = await Promise.all(
        (packagesData || []).map(async (pkg) => {
          const { data: featuresData, error: featuresError } = await supabase
            .from('game_package_features')
            .select('*')
            .eq('package_id', pkg.id)
            .order('sort_order');

          if (featuresError) throw featuresError;

          return {
            ...pkg,
            features: featuresData || []
          };
        })
      );

      setPackages(packagesWithFeatures);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الحزم",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name_ar: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      price: 0,
      games_count: 1,
      is_active: true,
      is_popular: false,
      sort_order: 0,
      features: []
    });
    setEditingPackage(null);
  };

  const handleEdit = (pkg: GamePackage) => {
    setEditingPackage(pkg);
    setFormData({
      name_ar: pkg.name_ar,
      name_en: pkg.name_en,
      description_ar: pkg.description_ar || "",
      description_en: pkg.description_en || "",
      price: pkg.price,
      games_count: pkg.games_count,
      is_active: pkg.is_active,
      is_popular: pkg.is_popular,
      sort_order: pkg.sort_order,
      features: pkg.features?.map(f => ({
        feature_ar: f.feature_ar,
        feature_en: f.feature_en,
        icon: f.icon || "",
        sort_order: f.sort_order
      })) || []
    });
    setIsDialogOpen(true);
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, {
        feature_ar: "",
        feature_en: "",
        icon: "",
        sort_order: prev.features.length + 1
      }]
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => 
        i === index ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name_ar || !formData.name_en || formData.price <= 0) {
        toast({
          title: "بيانات غير مكتملة",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }

      if (editingPackage) {
        // Update existing package
        const { error: packageError } = await supabase
          .from('game_packages')
          .update({
            name_ar: formData.name_ar,
            name_en: formData.name_en,
            description_ar: formData.description_ar,
            description_en: formData.description_en,
            price: formData.price,
            games_count: formData.games_count,
            is_active: formData.is_active,
            is_popular: formData.is_popular,
            sort_order: formData.sort_order
          })
          .eq('id', editingPackage.id);

        if (packageError) throw packageError;

        // Delete existing features
        const { error: deleteFeaturesError } = await supabase
          .from('game_package_features')
          .delete()
          .eq('package_id', editingPackage.id);

        if (deleteFeaturesError) throw deleteFeaturesError;

        // Insert new features
        if (formData.features.length > 0) {
          const featuresToInsert = formData.features.map(feature => ({
            package_id: editingPackage.id,
            feature_ar: feature.feature_ar,
            feature_en: feature.feature_en,
            icon: feature.icon,
            sort_order: feature.sort_order
          }));

          const { error: featuresError } = await supabase
            .from('game_package_features')
            .insert(featuresToInsert);

          if (featuresError) throw featuresError;
        }

        toast({
          title: "تم تحديث الحزمة بنجاح",
          description: "تم تحديث الحزمة والميزات بنجاح",
        });
      } else {
        // Create new package
        const { data: newPackage, error: packageError } = await supabase
          .from('game_packages')
          .insert({
            name_ar: formData.name_ar,
            name_en: formData.name_en,
            description_ar: formData.description_ar,
            description_en: formData.description_en,
            price: formData.price,
            games_count: formData.games_count,
            is_active: formData.is_active,
            is_popular: formData.is_popular,
            sort_order: formData.sort_order
          })
          .select()
          .single();

        if (packageError) throw packageError;

        // Insert features
        if (formData.features.length > 0) {
          const featuresToInsert = formData.features.map(feature => ({
            package_id: newPackage.id,
            feature_ar: feature.feature_ar,
            feature_en: feature.feature_en,
            icon: feature.icon,
            sort_order: feature.sort_order
          }));

          const { error: featuresError } = await supabase
            .from('game_package_features')
            .insert(featuresToInsert);

          if (featuresError) throw featuresError;
        }

        toast({
          title: "تم إنشاء الحزمة بنجاح",
          description: "تم إنشاء الحزمة والميزات بنجاح",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadPackages();
    } catch (error: any) {
      toast({
        title: "خطأ في حفظ الحزمة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحزمة؟")) return;

    try {
      const { error } = await supabase
        .from('game_packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;

      toast({
        title: "تم حذف الحزمة بنجاح",
        description: "تم حذف الحزمة وجميع ميزاتها",
      });

      loadPackages();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الحزمة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (packageId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('game_packages')
        .update({ is_active: isActive })
        .eq('id', packageId);

      if (error) throw error;

      toast({
        title: isActive ? "تم تفعيل الحزمة" : "تم إلغاء تفعيل الحزمة",
        description: `تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} الحزمة بنجاح`,
      });

      loadPackages();
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث حالة الحزمة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الحزم</h2>
          <p className="text-gray-600 dark:text-gray-400">إدارة حزم الألعاب والتسعير</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              إضافة حزمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? "تعديل الحزمة" : "إضافة حزمة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_ar">اسم الحزمة (عربي)</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="اسم الحزمة بالعربية"
                  />
                </div>
                <div>
                  <Label htmlFor="name_en">اسم الحزمة (إنجليزي)</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="Package name in English"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description_ar">وصف الحزمة (عربي)</Label>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                    placeholder="وصف الحزمة بالعربية"
                  />
                </div>
                <div>
                  <Label htmlFor="description_en">وصف الحزمة (إنجليزي)</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    placeholder="Package description in English"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">السعر ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="games_count">عدد الألعاب</Label>
                  <Input
                    id="games_count"
                    type="number"
                    min="1"
                    value={formData.games_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, games_count: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">ترتيب العرض</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">نشط</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="is_popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                  />
                  <Label htmlFor="is_popular">الأكثر شعبية</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>ميزات الحزمة</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddFeature}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة ميزة
                  </Button>
                </div>

                {formData.features.map((feature, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>ميزة {index + 1}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>الميزة (عربي)</Label>
                        <Input
                          value={feature.feature_ar}
                          onChange={(e) => handleFeatureChange(index, 'feature_ar', e.target.value)}
                          placeholder="وصف الميزة بالعربية"
                        />
                      </div>
                      <div>
                        <Label>الميزة (إنجليزي)</Label>
                        <Input
                          value={feature.feature_en}
                          onChange={(e) => handleFeatureChange(index, 'feature_en', e.target.value)}
                          placeholder="Feature description in English"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>أيقونة</Label>
                        <Input
                          value={feature.icon}
                          onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                          placeholder="Star, Gamepad2, etc."
                        />
                      </div>
                      <div>
                        <Label>ترتيب العرض</Label>
                        <Input
                          type="number"
                          min="1"
                          value={feature.sort_order}
                          onChange={(e) => handleFeatureChange(index, 'sort_order', parseInt(e.target.value) || 1)}
                          placeholder="1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSubmit}>
                  {editingPackage ? "تحديث" : "إنشاء"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            الحزم المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="[&_tr]:border-b [&_tr]:border-gray-100 [&_td]:py-4 [&_th]:py-4">
            <TableHeader>
              <TableRow>
                <TableHead className="py-4 font-medium text-center">اسم الحزمة</TableHead>
                <TableHead className="py-4 font-medium text-center">السعر</TableHead>
                <TableHead className="py-4 font-medium text-center">عدد الألعاب</TableHead>
                <TableHead className="py-4 font-medium text-center">الحالة</TableHead>
                <TableHead className="py-4 font-medium text-center">الميزات</TableHead>
                <TableHead className="py-4 font-medium text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="font-medium">{pkg.name_ar}</div>
                      <div className="text-sm text-gray-500">{pkg.name_en}</div>
                      {pkg.is_popular && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          الأكثر شعبية
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">${pkg.price}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Gamepad2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{pkg.games_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Switch
                        checked={pkg.is_active}
                        onCheckedChange={(checked) => handleToggleActive(pkg.id, checked)}
                      />
                      <Badge variant={pkg.is_active ? "default" : "secondary"} className="text-xs">
                        {pkg.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      {pkg.features?.slice(0, 2).map((feature, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center justify-center gap-1">
                          <Star className="h-3 w-3" />
                          <span className="text-right">{feature.feature_ar}</span>
                        </div>
                      ))}
                      {pkg.features && pkg.features.length > 2 && (
                        <div className="text-sm text-gray-500 text-center">
                          +{pkg.features.length - 2} ميزات أخرى
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(pkg)}
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pkg.id)}
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageManager;
