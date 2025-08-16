
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
      <h2 className="text-2xl font-bold">Question Management</h2>
      <div className="flex gap-4">
        <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Template
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
            Import CSV
          </Button>
        </div>
        <Button 
          onClick={onAddQuestion}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </div>
    </div>
  );
};

export default QuestionActions;
