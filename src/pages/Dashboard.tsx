import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, Trophy, Calendar, TrendingUp, Star, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserData } from '@/lib/userData';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = () => {
    if (user) {
      const data = getUserData(user.uid);
      setUserData(data);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const categories = [
    {
      id: 'quantitative',
      name: 'Quantitative Aptitude',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      description: 'Mathematics, Data Interpretation, and Problem Solving',
      difficulty: 'Intermediate',
      questions: 25,
      timeLimit: '30 mins'
    },
    {
      id: 'logical',
      name: 'Logical Reasoning',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      description: 'Pattern Recognition, Analytical Thinking',
      difficulty: 'Advanced',
      questions: 20,
      timeLimit: '25 mins'
    },
    {
      id: 'verbal',
      name: 'Verbal Ability',
      icon: Trophy,
      color: 'from-green-500 to-teal-500',
      description: 'Reading Comprehension, Grammar, Vocabulary',
      difficulty: 'Beginner',
      questions: 30,
      timeLimit: '35 mins'
    },
    {
      id: 'ai-aptitude',
      name: 'AI-Powered Aptitude',
      icon: Brain,
      color: 'from-indigo-500 to-purple-500',
      description: 'Dynamic aptitude questions powered by AI',
      difficulty: 'Adaptive',
      questions: 'Dynamic',
      timeLimit: 'Flexible'
    }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {userData?.username || user.email?.split('@')[0]}!
              </h1>
              <p className="text-blue-100 text-lg">
                Ready to challenge your mind today?
              </p>
            </div>
            <Button
              onClick={() => setIsEditDialogOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{userData?.currentStreak || 0}</div>
              <div className="text-sm text-gray-400">Current Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{userData?.bestStreak || 0}</div>
              <div className="text-sm text-gray-400">Best Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{userData?.totalQuizzes || 0}</div>
              <div className="text-sm text-gray-400">Total Quizzes</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{userData?.accuracy ? userData.accuracy.toFixed(1) : 0}%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{userData?.bestScore || 0}/20</div>
              <div className="text-sm text-gray-400">High Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Challenge */}
        <Card className="bg-gradient-to-r from-gray-800/80 to-gray-800/60 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Star className="w-5 h-5 text-yellow-400" />
              Today's Challenge
            </CardTitle>
            <CardDescription className="text-gray-300">
              Complete your daily quiz to maintain your streak!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Mixed Aptitude Quiz</h3>
                <p className="text-gray-400">25 questions • 50 minutes • All categories</p>
              </div>
              <Button 
                asChild
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                <Link to="/quiz">Start Quiz</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Quiz Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.id} className="group bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          category.difficulty === 'Beginner' ? 'border-green-500 text-green-400' :
                          category.difficulty === 'Intermediate' ? 'border-yellow-500 text-yellow-400' :
                          'border-red-500 text-red-400'
                        }`}
                      >
                        {category.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-gray-400 mb-4">
                      <span>{category.questions} questions</span>
                      <span>{category.timeLimit}</span>
                    </div>
                    <Button 
                      asChild
                      variant="outline" 
                      className="w-full border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-400"
                    >
                      <Link to={category.id === 'ai-aptitude' ? '/aptitude-test' : `/quiz?category=${category.id}`}>
                        Practice Now
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Performance Overview */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">This Week's Goal</span>
                  <span className="text-white">
                    {userData ? Object.values(userData.weeklyProgress).filter(Boolean).length : 0}/7 days
                  </span>
                </div>
                <Progress 
                  value={userData ? (Object.values(userData.weeklyProgress).filter(Boolean).length / 7) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      userData?.weeklyProgress[Object.keys(userData.weeklyProgress)[index]]
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        currentUsername={userData?.username || user.email?.split('@')[0] || ''}
        onUsernameUpdate={fetchUserData}
      />
    </Layout>
  );
};

export default Dashboard;
