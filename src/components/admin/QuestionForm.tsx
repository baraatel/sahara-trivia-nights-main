
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, X } from "lucide-react";

interface QuestionFormProps {
  categories: any[];
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const QuestionForm = ({ 
  categories, 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isEditing 
}: QuestionFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Question' : 'Add New Question'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_id">Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({...formData, category_id: value})}
              >
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
            <div>
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select 
                value={formData.difficulty_level.toString()} 
                onValueChange={(value) => setFormData({...formData, difficulty_level: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="question_ar">Arabic Question</Label>
              <Textarea
                id="question_ar"
                value={formData.question_ar}
                onChange={(e) => setFormData({...formData, question_ar: e.target.value})}
                required
                className="text-right"
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="question_en">English Question</Label>
              <Textarea
                id="question_en"
                value={formData.question_en}
                onChange={(e) => setFormData({...formData, question_en: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Answer Options</h4>
            {['a', 'b', 'c', 'd'].map((option) => (
              <div key={option} className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{`Option ${option.toUpperCase()} (Arabic)`}</Label>
                  <Input
                    value={formData[`option_${option}_ar`]}
                    onChange={(e) => setFormData({...formData, [`option_${option}_ar`]: e.target.value})}
                    required
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label>{`Option ${option.toUpperCase()} (English)`}</Label>
                  <Input
                    value={formData[`option_${option}_en`]}
                    onChange={(e) => setFormData({...formData, [`option_${option}_en`]: e.target.value})}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label>Correct Answer</Label>
            <RadioGroup 
              value={formData.correct_answer} 
              onValueChange={(value) => setFormData({...formData, correct_answer: value})}
              className="flex gap-4 mt-2"
            >
              {['A', 'B', 'C', 'D'].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option}>Option {option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="explanation_ar">Arabic Explanation (Optional)</Label>
              <Textarea
                id="explanation_ar"
                value={formData.explanation_ar}
                onChange={(e) => setFormData({...formData, explanation_ar: e.target.value})}
                className="text-right"
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="explanation_en">English Explanation (Optional)</Label>
              <Textarea
                id="explanation_en"
                value={formData.explanation_en}
                onChange={(e) => setFormData({...formData, explanation_en: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEditing ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
