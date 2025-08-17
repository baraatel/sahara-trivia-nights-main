
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";

interface QuestionListProps {
  questions: any[];
  onEdit: (question: any) => void;
  onDelete: (id: string) => void;
}

const QuestionList = ({ questions, onEdit, onDelete }: QuestionListProps) => {
  return (
    <div className="grid gap-4">
      {questions.map((question) => (
        <Card key={question.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-semibold text-lg" dir="rtl">{question.question_ar}</p>
                </div>
                
                <div className="space-y-2 text-sm" dir="rtl">
                  <p className={`p-2 rounded ${question.correct_answer === 'A' ? 'bg-green-100 text-green-800' : 'bg-gray-50'}`}>
                    أ. {question.option_a_ar}
                  </p>
                  <p className={`p-2 rounded ${question.correct_answer === 'B' ? 'bg-green-100 text-green-800' : 'bg-gray-50'}`}>
                    ب. {question.option_b_ar}
                  </p>
                  <p className={`p-2 rounded ${question.correct_answer === 'C' ? 'bg-green-100 text-green-800' : 'bg-gray-50'}`}>
                    ج. {question.option_c_ar}
                  </p>
                  <p className={`p-2 rounded ${question.correct_answer === 'D' ? 'bg-green-100 text-green-800' : 'bg-gray-50'}`}>
                    د. {question.option_d_ar}
                  </p>
                </div>

                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    الإجابة الصحيحة: {question.correct_answer}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    المستوى {question.difficulty_level}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {question.categories?.name_ar}
                  </span>
                </div>

                {question.explanation_ar && (
                  <div className="bg-yellow-50 p-3 rounded-lg" dir="rtl">
                    <p className="text-sm font-medium text-yellow-800 mb-1">شرح الإجابة:</p>
                    <p className="text-sm text-yellow-700">{question.explanation_ar}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mr-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onEdit(question)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  تعديل
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => onDelete(question.id)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  حذف
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuestionList;
