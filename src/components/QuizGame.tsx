import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Users, 
  CheckCircle, 
  XCircle, 
  Star, 
  Target,
  Lightbulb,
  SkipForward,
  Trash2,
  Zap,
  Shield,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MediaPlayer from "@/components/ui/media-player";

interface QuizGameProps {
  game: any;
  category: any;
  language: 'ar' | 'en';
  onBack: () => void;
  isTeamGame?: boolean;
}

interface Lifeline {
  type: 'hint' | 'skip' | 'eliminate';
  used: boolean;
}

const QuizGame = ({ game, category, language, onBack, isTeamGame = false }: QuizGameProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameFinished, setGameFinished] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [lifelines, setLifelines] = useState<Lifeline[]>([
    { type: 'hint', used: false },
    { type: 'skip', used: false },
    { type: 'eliminate', used: false }
  ]);
  const [showHint, setShowHint] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'team1' | 'team2'>('team1');
  const [stealMode, setStealMode] = useState(false);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [team1Answers, setTeam1Answers] = useState<any[]>([]);
  const [team2Answers, setTeam2Answers] = useState<any[]>([]);
  const [teamQuestions, setTeamQuestions] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch questions for this game purchase (36 questions from 6 categories)
  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', game?.id, isTeamGame],
    queryFn: async () => {
             // Get questions from the selected categories for this game purchase
       const { data: purchaseCategories, error: catError } = await supabase
         .from('game_purchase_categories')
         .select('category_id')
         .eq('game_purchase_id', game.game_purchase_id);

       if (catError) throw catError;

       if (isTeamGame) {
         // For team games, split categories evenly between teams
         const categoryIds = purchaseCategories.map(cat => cat.category_id);
         const team1Categories = categoryIds.slice(0, Math.ceil(categoryIds.length / 2));
         const team2Categories = categoryIds.slice(Math.ceil(categoryIds.length / 2));
        
                 // Get questions for each team
         const team1QuestionsPromises = team1Categories.map(async (catId) => {
           const { data, error } = await supabase
             .from('questions')
             .select('*')
             .eq('category_id', catId)
             .order('difficulty_level', { ascending: true })
             .limit(6);
           
           if (error) throw error;
           return data.map(q => ({ ...q, team_assignment: 'team1' }));
         });

         const team2QuestionsPromises = team2Categories.map(async (catId) => {
           const { data, error } = await supabase
             .from('questions')
             .select('*')
             .eq('category_id', catId)
             .order('difficulty_level', { ascending: true })
             .limit(6);
           
           if (error) throw error;
           return data.map(q => ({ ...q, team_assignment: 'team2' }));
         });

         const [team1Questions, team2Questions] = await Promise.all([
           Promise.all(team1QuestionsPromises),
           Promise.all(team2QuestionsPromises)
         ]);

         // Flatten and shuffle questions
         const allQuestions = [
           ...team1Questions.flat(),
           ...team2Questions.flat()
         ].sort(() => Math.random() - 0.5);

         return allQuestions;
       } else {
         // For individual games, get questions from all categories
         const categoryIds = purchaseCategories.map(cat => cat.category_id);
         
         const questionsPromises = categoryIds.map(async (catId) => {
           const { data, error } = await supabase
             .from('questions')
             .select('*')
             .eq('category_id', catId)
             .order('difficulty_level', { ascending: true })
             .limit(6);
           
           if (error) throw error;
           return data;
         });

         const questionsArrays = await Promise.all(questionsPromises);
         const allQuestions = questionsArrays.flat().sort(() => Math.random() - 0.5);
         
         return allQuestions;
       }
    },
    enabled: !!game?.game_purchase_id
  });

  // Calculate points based on difficulty level
  const getQuestionPoints = (difficultyLevel: number) => {
    switch (difficultyLevel) {
      case 1: return 10;  // سهل
      case 2: return 20;  // متوسط
      case 3: return 30;  // صعب
      case 4: return 40;  // صعب جداً
      case 5: return 50;  // خبير
      default: return 10;
    }
  };

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
    if (selectedAnswer) return; // Prevent multiple selections
    setSelectedAnswer(answer);
    setShowAnswerFeedback(true);
    
    // Show immediate feedback and update score
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;
    const questionPoints = getQuestionPoints(currentQuestion.difficulty_level);
    
    if (isTeamGame) {
      // Update team scores
      if (isCorrect) {
        if (currentTurn === 'team1') {
          const newScore = team1Score + questionPoints;
          setTeam1Score(newScore);
        } else {
          const newScore = team2Score + questionPoints;
          setTeam2Score(newScore);
        }
        
        toast({
          title: language === 'ar' ? "إجابة صحيحة!" : "Correct Answer!",
          description: language === 'ar' 
            ? `+${questionPoints} نقطة للفريق ${currentTurn === 'team1' ? 'الأول' : 'الثاني'}` 
            : `+${questionPoints} points for Team ${currentTurn === 'team1' ? '1' : '2'}`,
        });
      } else {
        toast({
          title: language === 'ar' ? "إجابة خاطئة" : "Wrong Answer",
          description: language === 'ar' 
            ? `0 نقطة للفريق ${currentTurn === 'team1' ? 'الأول' : 'الثاني'}` 
            : `0 points for Team ${currentTurn === 'team1' ? '1' : '2'}`,
          variant: "destructive",
        });
      }
    } else {
      // Update individual score
      if (isCorrect) {
        const newScore = score + questionPoints;
        setScore(newScore);
        toast({
          title: language === 'ar' ? "إجابة صحيحة!" : "Correct Answer!",
          description: language === 'ar' 
            ? `+${questionPoints} نقطة` 
            : `+${questionPoints} points`,
        });
      } else {
        toast({
          title: language === 'ar' ? "إجابة خاطئة" : "Wrong Answer",
          description: language === 'ar' 
            ? "0 نقطة" 
            : "0 points",
          variant: "destructive",
        });
      }
    }
    
    // Auto-proceed after showing feedback
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };

  const handleLifeline = (type: 'hint' | 'skip' | 'eliminate') => {
    const lifeline = lifelines.find(l => l.type === type);
    if (!lifeline || lifeline.used) return;

    const currentQuestion = questions[currentQuestionIndex];

    switch (type) {
      case 'hint':
        setShowHint(true);
        setLifelines(prev => prev.map(l => 
          l.type === 'hint' ? { ...l, used: true } : l
        ));
        toast({
          title: language === 'ar' ? "تم استخدام التلميح" : "Hint Used",
          description: language === 'ar' ? "ستظهر تلميح للسؤال الحالي" : "A hint will appear for the current question",
        });
        break;

      case 'skip':
        setLifelines(prev => prev.map(l => 
          l.type === 'skip' ? { ...l, used: true } : l
        ));
        toast({
          title: language === 'ar' ? "تم تخطي السؤال" : "Question Skipped",
          description: language === 'ar' ? "تم تخطي السؤال بدون خسارة النقاط" : "Question skipped without losing points",
        });
        handleNextQuestion();
        break;

      case 'eliminate':
        if (currentQuestion) {
          const correctAnswer = currentQuestion.correct_answer;
          const wrongOptions = ['A', 'B', 'C', 'D'].filter(opt => opt !== correctAnswer);
          const eliminated = wrongOptions.slice(0, 2); // Eliminate 2 wrong options
          setEliminatedOptions(eliminated);
          setLifelines(prev => prev.map(l => 
            l.type === 'eliminate' ? { ...l, used: true } : l
          ));
          toast({
            title: language === 'ar' ? "تم إزالة خيارين" : "Two Options Removed",
            description: language === 'ar' ? "تم إزالة خيارين خاطئين" : "Two wrong options have been removed",
          });
        }
        break;
    }
  };

  const handleNextQuestion = async () => {
    if (!questions) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const questionPoints = getQuestionPoints(currentQuestion.difficulty_level);
    
    if (isTeamGame) {
      // Store team answer
      const answerData = {
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_taken: 30 - timeLeft,
        points_earned: isCorrect ? questionPoints : 0,
        difficulty_level: currentQuestion.difficulty_level,
        team: currentTurn
      };

      if (currentTurn === 'team1') {
        setTeam1Answers([...team1Answers, answerData]);
      } else {
        setTeam2Answers([...team2Answers, answerData]);
      }

      // Switch turns for team games
      if (!isCorrect && stealMode) {
        // Enable steal mode for the other team
        setCurrentTurn(currentTurn === 'team1' ? 'team2' : 'team1');
        toast({
          title: language === 'ar' ? "فرصة للسرقة!" : "Steal Opportunity!",
          description: language === 'ar' 
            ? `دور الفريق ${currentTurn === 'team1' ? 'الثاني' : 'الأول'} للإجابة`
            : `Team ${currentTurn === 'team1' ? '2' : '1'}'s turn to answer`,
        });
        return; // Don't proceed to next question yet
      } else {
        // Normal turn switching
        setCurrentTurn(currentTurn === 'team1' ? 'team2' : 'team1');
      }
    } else {
      // Store individual answer
      const answerData = {
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_taken: 30 - timeLeft,
        points_earned: isCorrect ? questionPoints : 0,
        difficulty_level: currentQuestion.difficulty_level
      };
      setAnswers([...answers, answerData]);
    }

                  // For single-player games, we don't save answers to database
         // since there's no actual game record in the database
         if (game.id && game.id !== 'single-player') {
           console.log('Would save answer to database:', {
             gameId: game.id,
             questionId: currentQuestion.id,
             isCorrect,
             points: isCorrect ? questionPoints : 0
           });
         }

    if (currentQuestionIndex + 1 >= questions.length) {
      setGameFinished(true);
      // For single-player games, we don't need to update game_players table
      // since there's no actual game record in the database
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
      setShowAnswerFeedback(false);
      setShowHint(false);
      setEliminatedOptions([]);
      setStealMode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-5xl mx-auto">
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-5xl mx-auto">
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {language === 'ar' ? 'لا توجد أسئلة متاحة' : 'No Questions Available'}
                </h2>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'عذراً، لا توجد أسئلة متاحة لهذه اللعبة' : 'Sorry, no questions are available for this game'}
                </p>
                <Button 
                  onClick={onBack} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105"
                >
                  {language === 'ar' ? 'العودة' : 'Go Back'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    const totalPossiblePoints = questions.reduce((sum, q) => sum + getQuestionPoints(q.difficulty_level), 0);
    
    if (isTeamGame) {
      // Team game results
      const team1Percentage = Math.round((team1Score / totalPossiblePoints) * 100);
      const team2Percentage = Math.round((team2Score / totalPossiblePoints) * 100);
      const winningTeam = team1Score > team2Score ? 'team1' : team2Score > team1Score ? 'team2' : 'tie';
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Card className="bg-card border border-border shadow-lg max-w-4xl w-full">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-4xl mb-4 font-bold text-foreground">
                {language === 'ar' ? 'انتهت المباراة!' : 'Match Over!'}
              </CardTitle>
              <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>
                  {winningTeam === 'tie' 
                    ? (language === 'ar' ? 'تعادل!' : 'It\'s a Tie!')
                    : (language === 'ar' 
                        ? `الفريق ${winningTeam === 'team1' ? 'الأول' : 'الثاني'} فاز!`
                        : `Team ${winningTeam === 'team1' ? '1' : '2'} Wins!`
                      )
                  }
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Team Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team 1 Score */}
                <div className={`p-6 rounded-xl border-2 ${
                  winningTeam === 'team1' 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Users className="h-8 w-8 text-blue-600" />
                      <h3 className="text-2xl font-bold text-blue-700">
                        {language === 'ar' ? 'الفريق الأول' : 'Team 1'}
                      </h3>
                      {winningTeam === 'team1' && (
                        <Crown className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>
                    <div className="text-6xl font-bold mb-2 text-blue-600">
                      {team1Score}
                    </div>
                    <div className="text-lg text-blue-600">
                      {team1Percentage}% {language === 'ar' ? 'من النقاط الممكنة' : 'of Possible Points'}
                    </div>
                  </div>
                </div>

                {/* Team 2 Score */}
                <div className={`p-6 rounded-xl border-2 ${
                  winningTeam === 'team2' 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Users className="h-8 w-8 text-green-600" />
                      <h3 className="text-2xl font-bold text-green-700">
                        {language === 'ar' ? 'الفريق الثاني' : 'Team 2'}
                      </h3>
                      {winningTeam === 'team2' && (
                        <Crown className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>
                    <div className="text-6xl font-bold mb-2 text-green-600">
                      {team2Score}
                    </div>
                    <div className="text-lg text-green-600">
                      {team2Percentage}% {language === 'ar' ? 'من النقاط الممكنة' : 'of Possible Points'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Score */}
              <div className="text-center">
                <div className="text-2xl font-semibold text-muted-foreground mb-2">
                  {language === 'ar' ? 'إجمالي النقاط الممكنة:' : 'Total Possible Points:'}
                </div>
                <div className="text-4xl font-bold text-primary">
                  {totalPossiblePoints}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={() => window.location.href = '/'} 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </Button>
                <Button 
                  onClick={() => window.location.href = '/buy-game'} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'لعب لعبة جديدة' : 'Play New Game'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      // Individual game results
      const percentage = Math.round((score / totalPossiblePoints) * 100);
      const isExcellent = percentage >= 90;
      const isGood = percentage >= 70;
      const isAverage = percentage >= 50;
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Card className="bg-card border border-border shadow-lg max-w-4xl w-full">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-4xl mb-4 font-bold text-foreground">
                {language === 'ar' ? 'انتهت اللعبة!' : 'Game Over!'}
              </CardTitle>
              <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                <Star className="h-5 w-5" />
                <span>
                  {language === 'ar' ? 'أداء ممتاز!' : 'Excellent Performance!'}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <div className="text-center">
                <div className="text-8xl font-bold mb-4 text-primary">
                  {score}/{totalPossiblePoints}
                </div>
                <div className="text-2xl font-semibold mb-2 text-foreground">
                  {percentage}% {language === 'ar' ? 'من النقاط الممكنة' : 'of Possible Points'}
                </div>
                <div className="text-lg text-muted-foreground">
                  {isExcellent && (language === 'ar' ? 'أداء استثنائي!' : 'Exceptional performance!')}
                  {isGood && !isExcellent && (language === 'ar' ? 'أداء جيد جداً!' : 'Great performance!')}
                  {isAverage && !isGood && (language === 'ar' ? 'أداء جيد!' : 'Good performance!')}
                  {!isAverage && (language === 'ar' ? 'حاول مرة أخرى!' : 'Try again!')}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={() => window.location.href = '/'} 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </Button>
                <Button 
                  onClick={() => window.location.href = '/buy-game'} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'لعب لعبة جديدة' : 'Play New Game'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timePercentage = (timeLeft / 30) * 100;
  const questionPoints = getQuestionPoints(currentQuestion.difficulty_level);

  return (
    <div className="min-h-screen bg-background p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {language === 'ar' ? 'خروج' : 'Exit'}
          </Button>
          
          <div className="flex items-center gap-6">
            {isTeamGame ? (
              // Team scores display
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-700">
                    {language === 'ar' ? 'الفريق الأول:' : 'Team 1:'} {team1Score}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">
                    {language === 'ar' ? 'الفريق الثاني:' : 'Team 2:'} {team2Score}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">
                    {language === 'ar' ? `دور الفريق ${currentTurn === 'team1' ? 'الأول' : 'الثاني'}` : `Team ${currentTurn === 'team1' ? '1' : '2'}'s Turn`}
                  </span>
                </div>
              </div>
            ) : (
              // Individual score display
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-foreground">
                  {score} / {questions.reduce((sum, q) => sum + getQuestionPoints(q.difficulty_level), 0)} {language === 'ar' ? 'نقطة' : 'pts'}
                </span>
              </div>
            )}
            {stealMode && (
              <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-200">
                <Zap className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-700">
                  {language === 'ar' ? 'وضع السرقة!' : 'Steal Mode!'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress and Timer */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">
              {language === 'ar' 
                ? `السؤال ${currentQuestionIndex + 1} من ${questions.length}`
                : `Question ${currentQuestionIndex + 1} of ${questions.length}`
              }
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-foreground">{questionPoints} {language === 'ar' ? 'نقطة' : 'pts'}</span>
              </div>
              <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-full">
                <Clock className="h-5 w-5 text-red-600" />
                <span className="font-mono text-xl font-bold text-foreground">{timeLeft}s</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <Progress 
              value={timePercentage} 
              className="h-2" 
              style={{
                '--progress-background': timeLeft <= 10 ? 'hsl(0, 100%, 60%)' : 'hsl(150, 100%, 60%)'
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Lifelines */}
        <div className="mb-6 flex justify-center gap-4">
          {lifelines.map((lifeline) => (
            <Button
              key={lifeline.type}
              onClick={() => handleLifeline(lifeline.type)}
              disabled={lifeline.used || selectedAnswer !== null}
              variant={lifeline.used ? "secondary" : "default"}
              className={`flex items-center gap-2 px-4 py-2 ${
                lifeline.used 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105 transition-transform'
              }`}
            >
              {lifeline.type === 'hint' && <Lightbulb className="h-4 w-4" />}
              {lifeline.type === 'skip' && <SkipForward className="h-4 w-4" />}
              {lifeline.type === 'eliminate' && <Trash2 className="h-4 w-4" />}
              <span className="text-sm">
                {lifeline.type === 'hint' && (language === 'ar' ? 'تلميح' : 'Hint')}
                {lifeline.type === 'skip' && (language === 'ar' ? 'تخطي' : 'Skip')}
                {lifeline.type === 'eliminate' && (language === 'ar' ? 'إزالة' : 'Eliminate')}
              </span>
            </Button>
          ))}
        </div>

                 {/* Media Player - Will be enabled after applying database migrations */}
         {/* <MediaPlayer
           imageUrl={currentQuestion.image_url}
           videoUrl={currentQuestion.video_url}
           audioUrl={currentQuestion.audio_url}
           language={language}
         /> */}

        {/* Question Card */}
        <Card className="bg-card border border-border shadow-sm mb-8">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl leading-relaxed text-foreground">
              {language === 'ar' ? currentQuestion.question_ar : currentQuestion.question_en}
            </CardTitle>
            {showHint && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-700">
                    {language === 'ar' ? 'تلميح:' : 'Hint:'}
                  </span>
                </div>
                <p className="text-yellow-800">
                  {language === 'ar' 
                    ? currentQuestion.explanation_ar || 'فكر في الإجابة بعناية'
                    : currentQuestion.explanation_en || 'Think carefully about the answer'
                  }
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {['A', 'B', 'C', 'D'].map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = currentQuestion.correct_answer === option;
            const showCorrect = showAnswerFeedback && isCorrect;
            const showIncorrect = showAnswerFeedback && isSelected && !isCorrect;
            const isEliminated = eliminatedOptions.includes(option);
            
            return (
              <Button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                disabled={selectedAnswer !== null || isEliminated}
                className={`h-20 text-left justify-start p-6 text-wrap transition-all duration-300 transform hover:scale-105 ${
                  isEliminated
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : isSelected
                    ? showCorrect
                      ? 'bg-green-500 hover:bg-green-600 text-white ring-4 ring-green-300 shadow-lg'
                      : showIncorrect
                      ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-300 shadow-lg'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground ring-2 ring-primary/30 shadow-lg'
                    : showCorrect
                    ? 'bg-green-50 border-2 border-green-200 text-green-800'
                    : 'bg-card hover:bg-muted text-foreground border border-border'
                }`}
              >
                <span className="font-bold mr-4 text-2xl">{option}.</span>
                <span className="text-lg leading-relaxed">
                  {language === 'ar' 
                    ? currentQuestion[`option_${option.toLowerCase()}_ar`]
                    : currentQuestion[`option_${option.toLowerCase()}_en`]
                  }
                </span>
                {showCorrect && <CheckCircle className="h-6 w-6 ml-auto text-green-100" />}
                {showIncorrect && <XCircle className="h-6 w-6 ml-auto text-red-100" />}
                {isEliminated && <XCircle className="h-6 w-6 ml-auto text-muted-foreground" />}
              </Button>
            );
          })}
        </div>

        {/* Feedback Message */}
        {showAnswerFeedback && (
          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${
              selectedAnswer === currentQuestion.correct_answer
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {selectedAnswer === currentQuestion.correct_answer ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {language === 'ar' ? `إجابة صحيحة! +${questionPoints} نقطة` : `Correct Answer! +${questionPoints} points`}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  {language === 'ar' ? 'إجابة خاطئة!' : 'Incorrect Answer!'}
                </>
              )}
            </div>
          </div>
        )}

        {/* Next Button */}
        {!showAnswerFeedback && (
          <div className="text-center">
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-4 text-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {currentQuestionIndex + 1 === questions.length
                ? (language === 'ar' ? 'إنهاء اللعبة' : 'Finish Game')
                : (language === 'ar' ? 'السؤال التالي' : 'Next Question')
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizGame;
