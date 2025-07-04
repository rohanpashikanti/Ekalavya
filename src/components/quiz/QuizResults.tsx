import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Target, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuizResultPage from '@/components/quiz/QuizResultPage';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  topic: string;
}

const QuizResults: React.FC<QuizResultsProps> = ({ score, totalQuestions, timeTaken, topic }) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  const getPerformanceColor = () => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceMessage = () => {
    if (topic === 'daily-challenge') {
      if (percentage >= 80) return 'Outstanding performance! 🌟';
      if (percentage >= 60) return 'Great job on the daily challenge! 🎯';
      return 'Keep practicing daily to improve! 💪';
    }
    if (percentage >= 80) return 'Excellent work! 🎉';
    if (percentage >= 60) return 'Good job! Keep practicing! 👍';
    return 'Keep studying and try again! 💪';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main Results Card */}
      <Card className="bg-gradient-to-r from-gray-800/80 to-gray-800/60 border-gray-700 text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">
            {topic === 'daily-challenge' ? 'Daily Challenge Completed!' : 'Quiz Completed!'}
          </CardTitle>
          <CardDescription className="text-gray-300 capitalize">
            {topic === 'daily-challenge' ? 'Daily Challenge Results' : `${topic} Quiz Results`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getPerformanceColor()}`}>
              {score}/{totalQuestions}
            </div>
            <div className={`text-xl ${getPerformanceColor()}`}>
              {percentage}% Score
            </div>
            <p className="text-gray-300 mt-2">{getPerformanceMessage()}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <div className="text-lg font-semibold text-white">{score}</div>
              <div className="text-sm text-gray-400">Correct</div>
            </div>
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <XCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
              <div className="text-lg font-semibold text-white">{totalQuestions - score}</div>
              <div className="text-sm text-gray-400">Incorrect</div>
            </div>
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <div className="text-lg font-semibold text-white">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400">Time Taken</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button asChild variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700">
          <Link to="/history">View History</Link>
        </Button>
        <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
          <Link to="/quiz">Take Another Quiz</Link>
        </Button>
      </div>
    </div>
  );
};

export default QuizResults;
