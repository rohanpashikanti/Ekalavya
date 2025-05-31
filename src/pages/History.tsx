import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getUserData, getRecentQuizzes } from '@/lib/userData';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Brain, Target, Trophy, Calendar } from 'lucide-react';
import './History.css';

const History: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userData = user ? getUserData(user.uid) : null;
  const recentQuizzes = user ? getRecentQuizzes(user.uid) : [];

  // Separate daily quizzes from regular quizzes
  const dailyQuizzes = recentQuizzes.filter(quiz => quiz.topic === 'Daily Challenge');
  const regularQuizzes = recentQuizzes.filter(quiz => quiz.topic !== 'Daily Challenge');

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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-[#F6F1EC] border-[#E1DDFC]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#5C5C5C]">Total Quizzes</CardTitle>
                <Brain className="h-4 w-4 text-[#5C5C5C]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">{userData.totalQuizzes}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#F6F1EC] border-[#E1DDFC]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#5C5C5C]">Avg. Score</CardTitle>
                <Target className="h-4 w-4 text-[#5C5C5C]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">{userData.avgScore.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="bg-[#F6F1EC] border-[#E1DDFC]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#5C5C5C]">Avg. Time</CardTitle>
                <Clock className="h-4 w-4 text-[#5C5C5C]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">{Math.round(userData.avgTime / 60)}m</div>
              </CardContent>
            </Card>

            <Card className="bg-[#F6F1EC] border-[#E1DDFC]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#5C5C5C]">Best Score</CardTitle>
                <Trophy className="h-4 w-4 text-[#5C5C5C]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">{userData.bestScore}/20</div>
              </CardContent>
            </Card>

            <Card className="bg-[#F6F1EC] border-[#E1DDFC]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#5C5C5C]">Daily Challenges</CardTitle>
                <Calendar className="h-4 w-4 text-[#5C5C5C]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#000000]">{dailyQuizzes.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Challenge History */}
          {dailyQuizzes.length > 0 && (
            <Card className="bg-[#F6F1EC] border-[#E1DDFC]">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#000000]">Daily Challenge History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-4">
                    {dailyQuizzes.map((quiz, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-[#E1DDFC] rounded-lg">
                        <div>
                          <h3 className="font-medium text-[#000000]">Daily Challenge</h3>
                          <p className="text-sm text-[#5C5C5C]">
                            {new Date(quiz.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-[#000000]">{quiz.score}/25</div>
                          <div className="text-sm text-[#5C5C5C]">{Math.round(quiz.timeTaken / 60)}m</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regular Quiz History */}
          <Card className="bg-[#F6F1EC] border-[#E1DDFC]">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#000000]">Regular Quiz History</CardTitle>
            </CardHeader>
            <CardContent>
              {regularQuizzes.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-4">
                    {regularQuizzes.map((quiz, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-[#E1DDFC] rounded-lg">
                        <div>
                          <h3 className="font-medium text-[#000000]">{quiz.topic}</h3>
                          <p className="text-sm text-[#5C5C5C]">
                            {new Date(quiz.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-[#000000]">{quiz.score}/20</div>
                          <div className="text-sm text-[#5C5C5C]">{Math.round(quiz.timeTaken / 60)}m</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#5C5C5C] mb-4">No quiz history found</p>
                  <Button onClick={() => navigate('/quiz')} className="bg-[#49DBA1] hover:bg-[#3BCA8F]">
                    Take Your First Quiz
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card className="bg-[#F6F1EC] border-[#E1DDFC]">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#000000]">Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-[#000000]">
                    {Object.values(userData.weeklyProgress).filter(Boolean).length}/7
                  </div>
                  <div className="text-sm text-[#5C5C5C]">This Week's Goal</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#000000]">{userData.currentStreak}</div>
                  <div className="text-sm text-[#5C5C5C]">Current Streak</div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(userData.weeklyProgress).map(([day, completed]) => (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${
                      completed
                        ? 'bg-[#49DBA1] text-white'
                        : 'bg-[#E1DDFC] text-[#5C5C5C]'
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
