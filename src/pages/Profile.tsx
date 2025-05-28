import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  Target, 
  Brain, 
  TrendingUp,
  Award,
  Edit,
  CheckCircle2
} from 'lucide-react';
import { getUserData, getRecentQuizzes } from '@/lib/userData';
import EditProfileDialog from '@/components/profile/EditProfileDialog';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const data = getUserData(user.id);
      const recentQuizzes = getRecentQuizzes(user.id, 100); // Get more quizzes for better stats

      // Calculate category stats
      const categoryStats = {
        'Quantitative Aptitude': { 
          completed: 0, 
          totalScore: 0, 
          bestScore: 0, 
          totalQuestions: 0,
          description: 'Mathematics, Data Interpretation, and Problem Solving'
        },
        'Logical Reasoning': { 
          completed: 0, 
          totalScore: 0, 
          bestScore: 0, 
          totalQuestions: 0,
          description: 'Daily Challenge'
        },
        'Verbal Reasoning': { 
          completed: 0, 
          totalScore: 0, 
          bestScore: 0, 
          totalQuestions: 0,
          description: 'Blood Relations, Seating, Directions'
        },
        'AI-Powered Aptitude': { 
          completed: 0, 
          totalScore: 0, 
          bestScore: 0, 
          totalQuestions: 0,
          description: 'Dynamic aptitude questions powered by AI'
        }
      };

      // Map quiz topics to category names
      const topicMapping: { [key: string]: string } = {
        'arithmetic-1': 'Quantitative Aptitude',
        'arithmetic-2': 'Quantitative Aptitude',
        'number-system': 'Quantitative Aptitude',
        'logical-reasoning': 'Logical Reasoning',
        'verbal-reasoning': 'Verbal Reasoning',
        'analogical-reasoning': 'Analogical Reasoning',
        'Daily Challenge': 'Logical Reasoning',
        'ai-aptitude': 'AI-Powered Aptitude'
      };

      recentQuizzes.forEach(quiz => {
        const category = topicMapping[quiz.topic] || quiz.topic;
        if (categoryStats[category]) {
          categoryStats[category].completed++;
          categoryStats[category].totalScore += quiz.score;
          categoryStats[category].totalQuestions += quiz.total;
          categoryStats[category].bestScore = Math.max(categoryStats[category].bestScore, quiz.score);
        }
      });

      // Calculate achievements
      const achievements = [
        { 
          name: 'First Quiz', 
          description: 'Complete your first quiz', 
          unlocked: recentQuizzes.length > 0 
        },
        { 
          name: 'Week Warrior', 
          description: 'Maintain 7-day streak', 
          unlocked: data.currentStreak >= 7 
        },
        { 
          name: 'Perfect Score', 
          description: 'Score 100% in any quiz', 
          unlocked: recentQuizzes.some(quiz => quiz.score === quiz.total) 
        },
        { 
          name: 'Century Club', 
          description: 'Complete 100 quizzes', 
          unlocked: data.totalQuizzes >= 100 
        },
        { 
          name: 'Accuracy Expert', 
          description: 'Maintain 90% accuracy', 
          unlocked: data.accuracy >= 90 
        },
        { 
          name: 'Speed Demon', 
          description: 'Complete quiz under 15 minutes', 
          unlocked: recentQuizzes.some(quiz => quiz.timeTaken < 900) // 15 minutes in seconds
        }
      ];

      // Format category stats
      const formattedCategoryStats = Object.entries(categoryStats).map(([name, stats]) => ({
        name,
        description: stats.description,
        completed: stats.completed,
        accuracy: stats.completed > 0 ? Math.round((stats.totalScore / stats.totalQuestions) * 100) : 0,
        bestScore: stats.bestScore
      }));

      setUserStats({
        ...data,
        categoryStats: formattedCategoryStats,
        achievements,
        joinDate: user.created_at || new Date().toISOString()
      });
    }
    setLoading(false);
  }, [user]);

  const getLevelProgress = () => {
    if (!userStats) return 0;
    const currentLevelPoints = userStats.totalScore % 500;
    return (currentLevelPoints / 500) * 100;
  };

  const getPointsToNextLevel = () => {
    if (!userStats) return 500;
    return 500 - (userStats.totalScore % 500);
  };

  const getLevel = () => {
    if (!userStats) return 'Beginner';
    const level = Math.floor(userStats.totalScore / 500);
    if (level < 2) return 'Beginner';
    if (level < 5) return 'Intermediate';
    if (level < 10) return 'Advanced';
    return 'Expert';
  };

  const getDisplayName = () => {
    if (!user) return '';
    return userStats?.username || user.email?.split('@')[0] || '';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-white">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!userStats) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-white">No data available. Start taking quizzes to see your progress!</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400">Manage your account and track your progress</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-2xl">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {getDisplayName()}
                    </h2>
                    <p className="text-gray-400">{user?.email}</p>
                  </div>

                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {getLevel()}
                  </Badge>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Level Progress</span>
                      <span className="text-white">{Math.round(getLevelProgress())}%</span>
                    </div>
                    <Progress value={getLevelProgress()} className="h-2" />
                    <p className="text-xs text-gray-400">
                      {getPointsToNextLevel()} points to next level
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-white font-semibold">Total Score</div>
                    <div className="text-gray-400">{userStats.totalScore}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-semibold">Accuracy</div>
                    <div className="text-gray-400">{userStats.accuracy.toFixed(1)}%</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-semibold">Member Since</div>
                    <div className="text-gray-400">
                      {new Date(userStats.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Overview */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-400">{userStats.totalQuizzes}</div>
                    <div className="text-sm text-gray-400">Total Quizzes</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{userStats.currentStreak}</div>
                    <div className="text-sm text-gray-400">Current Streak</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{userStats.bestStreak}</div>
                    <div className="text-sm text-gray-400">Best Streak</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{userStats.accuracy.toFixed(1)}%</div>
                    <div className="text-sm text-gray-400">Avg Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userStats.categoryStats.map((category) => (
                    <div key={category.name} className="p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{category.name}</h3>
                          <p className="text-sm text-gray-400">{category.description}</p>
                        </div>
                        <span className="text-sm text-gray-400">{category.completed} completed</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Accuracy: </span>
                          <span className="text-green-400 font-semibold">{category.accuracy}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Best Score: </span>
                          <span className="text-cyan-400 font-semibold">{category.bestScore}</span>
                        </div>
                      </div>
                      <Progress value={category.accuracy} className="h-2 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Achievements
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your earned badges and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userStats.achievements.map((achievement) => (
                    <div
                      key={achievement.name}
                      className={`p-4 rounded-lg border ${
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                          : 'bg-gray-700/30 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          achievement.unlocked ? 'bg-yellow-500/20' : 'bg-gray-600/20'
                        }`}>
                          {achievement.unlocked ? (
                            <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Award className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-semibold ${
                            achievement.unlocked ? 'text-white' : 'text-gray-500'
                          }`}>
                            {achievement.name}
                          </h3>
                          <p className={`text-sm ${
                            achievement.unlocked ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        currentUsername={getDisplayName()}
      />
    </Layout>
  );
};

export default Profile;
