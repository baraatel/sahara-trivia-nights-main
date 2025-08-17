
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Download } from "lucide-react";

interface QuestionActionsProps {
  categories: any[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  onAddQuestion: () => void;
  handleCSVImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  downloadTemplate: () => void;
}

const QuestionActions = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  onAddQuestion,
  handleCSVImport,
  downloadTemplate
}: QuestionActionsProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">إدارة الأسئلة</h2>
      <div className="flex gap-4">
        <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="تصفية حسب الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          تحميل القالب
        </Button>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
            id="csv-upload"
          />
          <Button onClick={() => document.getElementById('csv-upload')?.click()} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            استيراد CSV
          </Button>
        </div>
        <Button 
          onClick={onAddQuestion}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة سؤال
        </Button>
      </div>
    </div>
  );
};

export default QuestionActions;
