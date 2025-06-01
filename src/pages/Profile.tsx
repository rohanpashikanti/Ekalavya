import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import AvatarUpload from '@/components/profile/AvatarUpload';
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
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { getUserData, getRecentQuizzes } from '@/lib/userData';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import Loading from '@/components/ui/loading';

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const userData = user ? getUserData(user.uid) : null;
  const username = userData?.username || user?.displayName || 'User';
  const initials = username.split(' ').map(n => n[0]).join('').toUpperCase();

  useEffect(() => {
    // Load user's avatar from storage
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  const handleAvatarChange = (newAvatarUrl: string) => {
    setAvatar(newAvatarUrl);
    localStorage.setItem('userAvatar', newAvatarUrl);
  };

  const loadUserData = () => {
    if (user) {
      const data = getUserData(user.uid);
      const recentQuizzes = getRecentQuizzes(user.uid, 100); // Get more quizzes for better stats

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
        joinDate: user.metadata.creationTime || new Date().toISOString()
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUserData();
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
    return userStats?.username || user.displayName || user.email?.split('@')[0] || '';
  };

  const handleProfileUpdate = () => {
    loadUserData();
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
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
      {isLoggingOut && <Loading />}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#000000] mb-2">Profile</h1>
            <p className="text-[#5C5C5C]">Manage your account and track your progress</p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-gradient-to-r from-[#B6EADA] to-[#F6C6EA] hover:from-[#A0E9CE] hover:to-[#F9D3F3] text-[#000000] font-semibold rounded-xl shadow-none border-none"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="outline"
              className="border-[#E1DDFC] text-[#000000] hover:bg-[#E1DDFC] font-semibold rounded-xl"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-[#F6F1EC] border-[#E1DDFC] rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <AvatarUpload 
                      currentAvatar={avatar}
                      onAvatarChange={handleAvatarChange}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute bottom-0 right-0 bg-white rounded-full shadow-md hover:bg-gray-100"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-[#000000]">
                      {username}
                    </h2>
                    <p className="text-[#5C5C5C]">{user?.email}</p>
                  </div>

                  <Badge className="bg-[#E1DDFC] text-[#7C6FF6] border-none rounded-xl font-semibold">
                    {getLevel()}
                  </Badge>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#5C5C5C]">Level Progress</span>
                      <span className="text-[#000000]">{Math.round(getLevelProgress())}%</span>
                    </div>
                    <Progress value={getLevelProgress()} className="h-2 bg-[#E1DDFC] rounded-xl" />
                    <p className="text-xs text-[#5C5C5C]">
                      {getPointsToNextLevel()} points to next level
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-[#F6F1EC] border-[#E1DDFC] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[#000000] text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-[#FFD966]" />
                  <div>
                    <div className="text-[#000000] font-semibold">Total Score</div>
                    <div className="text-[#5C5C5C]">{userStats?.totalScore || 0}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-[#49DBA1]" />
                  <div>
                    <div className="text-[#000000] font-semibold">Accuracy</div>
                    <div className="text-[#5C5C5C]">{(userStats?.accuracy || 0).toFixed(1)}%</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#B6EADA]" />
                  <div>
                    <div className="text-[#000000] font-semibold">Member Since</div>
                    <div className="text-[#5C5C5C]">
                      {userStats?.joinDate ? new Date(userStats.joinDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Overview */}
            <Card className="bg-[#F6F1EC] border-[#E1DDFC] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[#000000] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#49DBA1]" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-2xl font-bold text-[#000000]">{userStats.totalQuizzes}</div>
                    <div className="text-sm text-[#5C5C5C]">Total Quizzes</div>
                  </div>
                  <div className="text-center p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-2xl font-bold text-[#000000]">{userStats.currentStreak}</div>
                    <div className="text-sm text-[#5C5C5C]">Current Streak</div>
                  </div>
                  <div className="text-center p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-2xl font-bold text-[#000000]">{userStats.bestStreak}</div>
                    <div className="text-sm text-[#5C5C5C]">Best Streak</div>
                  </div>
                  <div className="text-center p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-2xl font-bold text-[#000000]">{userStats.accuracy.toFixed(1)}%</div>
                    <div className="text-sm text-[#5C5C5C]">Avg Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card className="bg-[#F6F1EC] border-[#E1DDFC] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[#000000] flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#B6EADA]" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userStats.categoryStats.map((category) => (
                    <div key={category.name} className="p-4 bg-[#E1DDFC] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-[#000000]">{category.name}</h3>
                          <p className="text-sm text-[#5C5C5C]">{category.description}</p>
                        </div>
                        <span className="text-sm text-[#5C5C5C]">{category.completed} completed</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[#5C5C5C]">Accuracy: </span>
                          <span className="text-[#49DBA1] font-semibold">{category.accuracy}%</span>
                        </div>
                        <div>
                          <span className="text-[#5C5C5C]">Best Score: </span>
                          <span className="text-[#B6EADA] font-semibold">{category.bestScore}</span>
                        </div>
                      </div>
                      <Progress value={category.accuracy} className="h-2 mt-2 bg-[#F6F1EC] rounded-xl" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-[#F6F1EC] border-[#E1DDFC] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[#000000] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FFD966]" />
                  Achievements
                </CardTitle>
                <CardDescription className="text-[#5C5C5C]">
                  Your earned badges and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userStats.achievements.map((achievement) => (
                    <div
                      key={achievement.name}
                      className={`p-4 rounded-xl border transition-colors duration-200 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-[#FFD966]/20 to-[#F6C6EA]/20 border-[#FFD966]/30'
                          : 'bg-[#E1DDFC] border-[#E1DDFC] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          achievement.unlocked ? 'bg-[#FFD966]/40' : 'bg-[#E1DDFC]'
                        }`}>
                          {achievement.unlocked ? (
                            <CheckCircle2 className="w-5 h-5 text-[#FFD966]" />
                          ) : (
                            <Award className="w-5 h-5 text-[#B6EADA]" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-semibold ${
                            achievement.unlocked ? 'text-[#000000]' : 'text-[#5C5C5C]'
                          }`}>
                            {achievement.name}
                          </h3>
                          <p className={`text-sm ${
                            achievement.unlocked ? 'text-[#5C5C5C]' : 'text-[#B6EADA]'
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

            {/* Weekly Progress */}
            <Card className="bg-[#F6F1EC] border-[#E1DDFC] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[#000000] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#B6EADA]" />
                  Weekly Progress
                </CardTitle>
                <CardDescription className="text-[#5C5C5C]">
                  This Week's Goal: {Object.values(userStats.weeklyProgress).filter(Boolean).length}/7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(userStats.weeklyProgress).map(([day, completed]) => (
                    <div key={day} className="text-center">
                      <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${
                        completed ? 'bg-[#49DBA1] text-white' : 'bg-[#E1DDFC] text-[#5C5C5C]'
                      }`}>
                        {day.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs text-[#5C5C5C] mt-1">{day.slice(0, 3)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Overview */}
            <Card className="bg-[#F6F1EC] border-[#E1DDFC] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[#000000] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#FFD966]" />
                  Statistics Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-sm text-[#5C5C5C]">Current Streak</div>
                    <div className="text-2xl font-bold text-[#000000]">{userStats.currentStreak}</div>
                  </div>
                  <div className="p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-sm text-[#5C5C5C]">Best Streak</div>
                    <div className="text-2xl font-bold text-[#000000]">{userStats.bestStreak}</div>
                  </div>
                  <div className="p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-sm text-[#5C5C5C]">Total Quizzes</div>
                    <div className="text-2xl font-bold text-[#000000]">{userStats.totalQuizzes}</div>
                  </div>
                  <div className="p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-sm text-[#5C5C5C]">Accuracy</div>
                    <div className="text-2xl font-bold text-[#000000]">{userStats.accuracy.toFixed(1)}%</div>
                  </div>
                  <div className="p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-sm text-[#5C5C5C]">High Score</div>
                    <div className="text-2xl font-bold text-[#000000]">{userStats.bestScore}/20</div>
                  </div>
                  <div className="p-4 bg-[#E1DDFC] rounded-xl">
                    <div className="text-sm text-[#5C5C5C]">Avg. Time</div>
                    <div className="text-2xl font-bold text-[#000000]">{Math.round(userStats.avgTime / 60)}m</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        currentUsername={username}
        onUpdate={handleProfileUpdate}
      />
    </Layout>
  );
};

export default Profile;
