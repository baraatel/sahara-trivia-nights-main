
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Trophy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizGameProps {
  game: any;
  category: any;
  language: 'ar' | 'en';
  onBack: () => void;
}

const QuizGame = ({ game, category, language, onBack }: QuizGameProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameFinished, setGameFinished] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch questions for this category
  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', category.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('category_id', category.id)
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Timer effect
  useEffect(() => {
    if (gameFinished || !questions) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, gameFinished, questions]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = async () => {
    if (!questions) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    // Store answer
    const answerData = {
      question_id: currentQuestion.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_taken: 30 - timeLeft
    };

    setAnswers([...answers, answerData]);

    // Save answer to database if multiplayer
    if (game.id !== 'single-player') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('game_answers').insert({
          game_id: game.id,
          user_id: user.id,
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_taken: 30 - timeLeft
        });
      }
    }

    if (currentQuestionIndex + 1 >= questions.length) {
      setGameFinished(true);
      if (game.id !== 'single-player') {
        // Update final score
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('game_players')
            .update({ score: score + (isCorrect ? 1 : 0) })
            .eq('game_id', game.id)
            .eq('user_id', user.id);
        }
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-xl">
          {language === 'ar' ? 'جاري تحميل الأسئلة...' : 'Loading questions...'}
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {language === 'ar' ? 'لا توجد أسئلة' : 'No Questions Available'}
            </h2>
            <p className="mb-4">
              {language === 'ar' ? 'لا توجد أسئلة في هذه الفئة حالياً' : 'No questions available in this category'}
            </p>
            <Button onClick={onBack} className="bg-blue-500 hover:bg-blue-600">
              {language === 'ar' ? 'العودة' : 'Go Back'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white max-w-2xl w-full">
          <CardHeader className="text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
            <CardTitle className="text-3xl mb-2">
              {language === 'ar' ? 'انتهت اللعبة!' : 'Game Over!'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-400 mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-xl">
                {percentage}% {language === 'ar' ? 'صحيح' : 'Correct'}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center">
                {language === 'ar' ? 'مراجعة الإجابات' : 'Answer Review'}
              </h3>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {answers.map((answer, index) => {
                  const question = questions[index];
                  return (
                    <div key={index} className="bg-white/10 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">
                          {language === 'ar' ? `السؤال ${index + 1}` : `Question ${index + 1}`}
                        </span>
                        <Badge className={answer.is_correct ? "bg-green-500" : "bg-red-500"}>
                          {answer.is_correct ? '✓' : '✗'}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/80">
                        {language === 'ar' ? question.question_ar : question.question_en}
                      </p>
                      {!answer.is_correct && (
                        <p className="text-xs text-green-400 mt-1">
                          {language === 'ar' ? 'الإجابة الصحيحة: ' : 'Correct answer: '}
                          {language === 'ar' 
                            ? question[`option_${question.correct_answer.toLowerCase()}_ar`]
                            : question[`option_${question.correct_answer.toLowerCase()}_en`]
                          }
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={onBack} className="flex-1 bg-blue-500 hover:bg-blue-600">
                {language === 'ar' ? 'العودة للفئات' : 'Back to Categories'}
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {language === 'ar' ? 'لعب مرة أخرى' : 'Play Again'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'خروج' : 'Exit'}
          </Button>
          
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <span>{score}/{questions.length}</span>
            </div>
            {game.id !== 'single-player' && (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{language === 'ar' ? 'متعدد اللاعبين' : 'Multiplayer'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress and Timer */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center text-white">
            <span>
              {language === 'ar' 
                ? `السؤال ${currentQuestionIndex + 1} من ${questions.length}`
                : `Question ${currentQuestionIndex + 1} of ${questions.length}`
              }
            </span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{timeLeft}s</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {language === 'ar' ? currentQuestion.question_ar : currentQuestion.question_en}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {['A', 'B', 'C', 'D'].map((option) => (
            <Button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              className={`h-16 text-left justify-start p-4 text-wrap ${
                selectedAnswer === option
                  ? 'bg-blue-500 hover:bg-blue-600 ring-2 ring-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <span className="font-bold mr-3 text-xl">{option}.</span>
              <span className="text-lg">
                {language === 'ar' 
                  ? currentQuestion[`option_${option.toLowerCase()}_ar`]
                  : currentQuestion[`option_${option.toLowerCase()}_en`]
                }
              </span>
            </Button>
          ))}
        </div>

        {/* Next Button */}
        <div className="text-center">
          <Button
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg"
          >
            {currentQuestionIndex + 1 === questions.length
              ? (language === 'ar' ? 'إنهاء اللعبة' : 'Finish Game')
              : (language === 'ar' ? 'السؤال التالي' : 'Next Question')
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizGame;
