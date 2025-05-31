import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getUserData, getRecentQuizzes } from '@/lib/userData';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Brain, Target, Trophy, Calendar } from 'lucide-react';

const DashboardStats: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const data = getUserData(user.uid);
      const quizzes = getRecentQuizzes(user.uid, 5);
      setUserData(data);
      setRecentQuizzes(quizzes);
    }
    setLoading(false);
  }, [user]);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!user || !userData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Welcome to Aptitude Exam Portal</h2>
        <p className="text-gray-400 mb-6">Take your first quiz to start tracking your progress!</p>
        <Button onClick={() => navigate('/quiz')} className="bg-cyan-600 hover:bg-cyan-700">
          Take Your First Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Quizzes</CardTitle>
            <Brain className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userData.totalQuizzes}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Current Streak</CardTitle>
            <Target className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userData.currentStreak}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Best Streak</CardTitle>
            <Trophy className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userData.bestStreak}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Accuracy</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userData.accuracy.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quizzes */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Recent Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentQuizzes.length > 0 ? (
            <div className="space-y-4">
              {recentQuizzes.map((quiz, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">{quiz.topic}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(quiz.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">{quiz.score}/{quiz.total}</div>
                    <div className="text-sm text-gray-400">{Math.round(quiz.timeTaken / 60)}m</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No quiz history found</p>
              <Button onClick={() => navigate('/quiz')} className="bg-cyan-600 hover:bg-cyan-700">
                Take Your First Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Weekly Progress</CardTitle>
          <p className="text-sm text-gray-400">
            This Week's Goal: {Object.values(userData.weeklyProgress).filter(Boolean).length}/7 days
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(userData.weeklyProgress).map(([day, completed]) => (
              <div key={day} className="text-center">
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center ${
                  completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/30 text-gray-400'
                }`}>
                  {day.charAt(0).toUpperCase()}
                </div>
                <div className="text-xs text-gray-400 mt-1">{day.slice(0, 3)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats; 