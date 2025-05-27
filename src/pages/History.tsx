import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getUserData, getRecentQuizzes } from '@/lib/userData';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Brain, Target, Trophy } from 'lucide-react';
import './History.css';

const History: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userData = user ? getUserData(user.id) : null;
  const recentQuizzes = user ? getRecentQuizzes(user.id) : [];

  if (!user || !userData) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Welcome to Aptitude Exam Portal</h2>
          <p className="text-gray-400 mb-6">Take your first quiz to start tracking your progress!</p>
          <Button onClick={() => navigate('/quiz')} className="bg-cyan-600 hover:bg-cyan-700">
            Take Your First Quiz
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your History</h1>
        
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
                <CardTitle className="text-sm font-medium text-gray-400">Avg. Score</CardTitle>
                <Target className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{userData.avgScore.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg. Time</CardTitle>
                <Clock className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{Math.round(userData.avgTime / 60)}m</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Best Score</CardTitle>
                <Trophy className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{userData.bestScore}/20</div>
              </CardContent>
            </Card>
          </div>

          {/* Quiz History */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Quiz History</CardTitle>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length > 0 ? (
                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
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
                          <div className="font-medium text-white">{quiz.score}/20</div>
                          <div className="text-sm text-gray-400">{Math.round(quiz.timeTaken / 60)}m</div>
                        </div>
                      </div>
                    ))}
                  </div>
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
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {Object.values(userData.weeklyProgress).filter(Boolean).length}/7
                  </div>
                  <div className="text-sm text-gray-400">This Week's Goal</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{userData.currentStreak}</div>
                  <div className="text-sm text-gray-400">Current Streak</div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(userData.weeklyProgress).map(([day, completed]) => (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${
                      completed
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {day.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default History;
