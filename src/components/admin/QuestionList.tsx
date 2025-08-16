
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
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="font-semibold" dir="rtl">{question.question_ar}</p>
                    <p className="font-semibold">{question.question_en}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="space-y-1" dir="rtl">
                      <p>أ. {question.option_a_ar}</p>
                      <p>ب. {question.option_b_ar}</p>
                      <p>ج. {question.option_c_ar}</p>
                      <p>د. {question.option_d_ar}</p>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-1">
                      <p>A. {question.option_a_en}</p>
                      <p>B. {question.option_b_en}</p>
                      <p>C. {question.option_c_en}</p>
                      <p>D. {question.option_d_en}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    Correct: {question.correct_answer}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Level {question.difficulty_level}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {question.categories?.name_en}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onEdit(question)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => onDelete(question.id)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
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
