import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import QuizTaking from './QuizTaking';
import QuizResults from './QuizResults';

const DailyQuiz: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizState, setQuizState] = useState<'selection' | 'taking' | 'completed'>('selection');
  const [quizResults, setQuizResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(50 * 60); // 50 minutes in seconds

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizState === 'taking' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  const startDailyQuiz = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { 
          topic: 'daily-challenge',
          difficulty: 'mixed',
          quizType: 'exam',
          userId: user.id
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error from generate-quiz function:', error);
        throw new Error(`Failed to generate quiz: ${error.message}`);
      }

      if (!data || !data.quiz_id) {
        console.error('No quiz_id in response:', data);
        throw new Error('Invalid response from quiz generation');
      }

      // Fetch the complete quiz with questions
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (*)
        `)
        .eq('id', data.quiz_id)
        .single();

      if (quizError) {
        console.error('Error fetching quiz:', quizError);
        throw new Error(`Failed to fetch quiz: ${quizError.message}`);
      }

      if (!quiz || !quiz.questions) {
        console.error('Invalid quiz data:', quiz);
        throw new Error('Quiz data is incomplete');
      }

      // Update quiz with daily challenge metadata
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          topic: 'Daily Challenge',
          time_limit: 50 * 60, // 50 minutes in seconds
          question_count: 25
        })
        .eq('id', quiz.id);

      if (updateError) {
        console.error('Error updating quiz metadata:', updateError);
        throw new Error(`Failed to update quiz metadata: ${updateError.message}`);
      }

      setCurrentQuiz(quiz);
      setQuizState('taking');
      setTimeLeft(50 * 60);
    } catch (error) {
      console.error('Error starting daily quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to start daily quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (score: number, timeTaken: number) => {
    setQuizResults({
      score,
      totalQuestions: 25,
      timeTaken,
      topic: 'Daily Challenge',
    });
    setQuizState('completed');
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuizResults(null);
    setQuizState('selection');
    setTimeLeft(50 * 60);
  };

  if (quizState === 'taking' && currentQuiz) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-white">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            Daily Challenge
          </Badge>
        </div>
        <QuizTaking
          quizId={currentQuiz.id}
          questions={currentQuiz.questions}
          topic="Daily Challenge"
          onComplete={handleQuizComplete}
          timeLimit={50 * 60}
        />
      </div>
    );
  }

  if (quizState === 'completed' && quizResults) {
    return (
      <div className="space-y-6">
        <QuizResults {...quizResults} />
        <div className="text-center">
          <Button onClick={resetQuiz} className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
            Take Another Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-white">Daily Challenge</CardTitle>
        <CardDescription className="text-gray-400">
          Test your skills with 25 questions across all topics in 50 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>25 questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>50 minutes</span>
            </div>
          </div>
          <Button 
            onClick={startDailyQuiz}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Start Daily Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyQuiz; 