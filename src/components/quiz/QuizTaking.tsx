import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { doc, updateDoc, collection, getDoc, increment } from 'firebase/firestore';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

interface QuizTakingProps {
  quizId: string;
  questions: Question[];
  topic: string;
  onComplete: (score: number, timeTaken: number) => void;
  timeLimit?: number;
}

const QuizTaking: React.FC<QuizTakingProps> = ({ quizId, questions, topic, onComplete, timeLimit }) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit || (topic === 'daily-challenge' ? 50 * 60 : 40 * 60));
  const [startTime] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleSubmit = async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Calculate score
    let score = 0;
    const updatedQuestions = questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correct_answer;
      if (isCorrect) score++;
      
      return {
        ...question,
        user_answer: userAnswer,
        is_correct: isCorrect,
      };
    });

    try {
      if (!user) throw new Error('User not authenticated');

      // Update quiz with results
      const quizRef = doc(db, 'quizzes', quizId);
      await updateDoc(quizRef, {
        score,
        time_taken: timeTaken,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      // Update questions with user answers
      for (const question of updatedQuestions) {
        const questionRef = doc(db, 'questions', question.id);
        await updateDoc(questionRef, {
          user_answer: question.user_answer,
          is_correct: question.is_correct,
        });
      }

      // Update user stats
      const userStatsRef = doc(db, 'user_stats', user.uid);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        await updateDoc(userStatsRef, {
          total_quizzes: increment(1),
          total_score: increment(score),
          total_questions: increment(questions.length),
          average_score: (userStatsDoc.data().total_score + score) / (userStatsDoc.data().total_quizzes + 1),
        });
      } else {
        await updateDoc(userStatsRef, {
          total_quizzes: 1,
          total_score: score,
          total_questions: questions.length,
          average_score: score,
        });
      }

      onComplete(score, timeTaken);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white capitalize">{topic} Quiz</CardTitle>
              <CardDescription className="text-gray-400">
                Question {currentQuestion + 1} of {questions.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-500/20 text-blue-400">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-200">
                Score: {Object.values(answers).filter(Boolean).length}/{questions.length}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Current Question */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            {currentQ.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'A', text: currentQ.option_a },
            { key: 'B', text: currentQ.option_b },
            { key: 'C', text: currentQ.option_c },
            { key: 'D', text: currentQ.option_d },
          ].map((option) => (
            <Button
              key={option.key}
              variant={answers[currentQuestion] === option.key ? "default" : "outline"}
              className={`w-full justify-start h-auto p-4 text-left ${
                answers[currentQuestion] === option.key
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'border-gray-600 text-gray-200 hover:bg-gray-700'
              }`}
              onClick={() => handleAnswerSelect(option.key)}
            >
              <span className="font-semibold mr-3">{option.key}.</span>
              <span>{option.text}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="border-gray-600 text-gray-200 hover:bg-gray-700"
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={Object.keys(answers).length < questions.length}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === questions.length - 1}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Question Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                size="sm"
                variant={currentQuestion === index ? "default" : "outline"}
                className={`w-8 h-8 p-0 ${
                  answers[index]
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : currentQuestion === index
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'border-gray-600 text-gray-400 hover:bg-gray-700'
                }`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizTaking;
