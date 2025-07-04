import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { getUserData } from '@/lib/userData';
import { Brain, Target, Trophy, Star, User, Zap, BookOpen, Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const [tooltipData, setTooltipData] = useState<{ show: boolean; x: number; y: number; day: string; date: string; time: string }>({
    show: false,
    x: 0,
    y: 0,
    day: '',
    date: '',
    time: ''
  });
  const [avatar, setAvatar] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      if (user?.uid) {
        let data = getUserData(user.uid);
        if (!data.quizHistory || data.quizHistory.length === 0) {
          const oldData = getUserData('undefined');
          if (oldData.quizHistory && oldData.quizHistory.length > 0) {
            data = oldData;
          }
        }
        setUserData(data);
      }
      setLoading(false);
    };
    loadUserData();
    const interval = setInterval(loadUserData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Load user's avatar from storage
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  const calculateTimeForPeriod = (period: string) => {
    if (!userData?.quizHistory) return 0;
    
    const now = new Date();
    const periodStart = new Date();
    
    switch (period) {
      case 'Week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'Month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'Year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        periodStart.setDate(now.getDate() - 7);
    }

    const periodQuizzes = userData.quizHistory.filter((quiz: any) => {
      const quizDate = new Date(quiz.date);
      return quizDate >= periodStart && quizDate <= now;
    });

    // Calculate total time instead of average
    return periodQuizzes.reduce((sum: number, quiz: any) => sum + (quiz.timeTaken || 0), 0);
  };

  const getDailyStats = (): { percentages: number[]; times: number[] } => {
    if (!userData?.quizHistory) return { percentages: Array(7).fill(0), times: Array(7).fill(0) };
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6); // Last 7 days including today
    
    const dailyStats = Array(7).fill(0);
    const dailyTimes = Array(7).fill(0);
    
    userData.quizHistory.forEach((quiz: any) => {
      const quizDate = new Date(quiz.date);
      if (quizDate >= weekStart && quizDate <= now) {
        const dayIndex = 6 - Math.floor((now.getTime() - quizDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          dailyStats[dayIndex] += quiz.timeTaken || 0;
          dailyTimes[dayIndex] += quiz.timeTaken || 0;
        }
      }
    });

    // Convert to percentages for the chart
    const maxTime = Math.max(...dailyStats);
    return {
      percentages: dailyStats.map(time => maxTime > 0 ? (time / maxTime) * 100 : 0),
      times: dailyTimes
    };
  };

  const getDayName = (index: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dayIndex = (today.getDay() - (6 - index) + 7) % 7;
    return days[dayIndex];
  };

  const getFormattedDate = (index: number) => {
    const today = new Date();
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleBarHover = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipData({
      show: true,
      x: rect.left + (rect.width / 2),
      y: rect.top - 40,
      day: getDayName(index),
      date: getFormattedDate(index),
      time: formatTime(dailyTimes[index])
    });
  };

  const handleBarLeave = () => {
    setTooltipData(prev => ({ ...prev, show: false }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="text-black">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="text-black">Please log in to view your dashboard</div>
        </div>
      </Layout>
    );
  }

  const username = userData?.username || user?.displayName || 'User';
  const totalQuizzes = userData?.quizHistory?.length || 0;
  const totalScore = userData?.quizHistory?.reduce((sum: number, quiz: any) => sum + quiz.score, 0) || 0;
  const totalQuestions = userData?.quizHistory?.reduce((sum: number, quiz: any) => sum + quiz.total, 0) || 0;
  const bestScore = userData?.quizHistory?.length > 0 
    ? Math.max(...userData.quizHistory.map((quiz: any) => quiz.score))
    : 0;
  const accuracy = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
  const currentStreak = userData?.currentStreak || 0;
  const bestStreak = userData?.bestStreak || 0;
  const avgTime = userData?.avgTime || 0;

  // Get real daily stats
  const { percentages: activityData, times: dailyTimes } = getDailyStats();
  const activityColors = [
    'chart-bar1',
    'chart-bar2',
    'chart-bar3',
    'chart-bar4',
    'chart-bar5',
    'chart-bar6',
    'chart-bar1',
  ];

  // Quiz categories
  const categories = [
    {
      id: 'quantitative',
      name: 'Quantitative Aptitude',
      icon: <Brain className="w-6 h-6" />,
      colorClass: 'card-it',
      badge: <span className="badge-star">Intermediate</span>,
      description: 'Mathematics, Data Interpretation, and Problem Solving',
      questions: 25,
      timeLimit: '30 mins',
      link: '/quiz',
    },
    {
      id: 'logical',
      name: 'Logical Reasoning',
      icon: <Target className="w-6 h-6" />,
      colorClass: 'card-business',
      badge: <span className="badge-business">Advanced</span>,
      description: 'Pattern Recognition, Analytical Thinking',
      questions: 20,
      timeLimit: '25 mins',
      link: '/quiz',
    },
    {
      id: 'verbal',
      name: 'Verbal Ability',
      icon: <Trophy className="w-6 h-6" />,
      colorClass: 'card-media',
      badge: <span className="badge-media">Beginner</span>,
      description: 'Reading Comprehension, Grammar, Vocabulary',
      questions: 20,
      timeLimit: '25 mins',
      link: '/quiz',
    },
    {
      id: 'ai-aptitude',
      name: 'AI-Powered Aptitude',
      icon: <Zap className="w-6 h-6" />,
      colorClass: 'card-interior',
      badge: <span className="badge-interior">Adaptive</span>,
      description: 'Dynamic aptitude questions powered by AI',
      questions: 'Dynamic',
      timeLimit: 'Flexible',
      link: '/quiz',
    },
  ];

  return (
    <Layout>
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl mx-auto py-8">
          <h1 className="heading-hero mb-2">Welcome back, {username}</h1>
          <div className="text-2xl font-medium mb-8" style={{ color: '#5C5C5C' }}>Ready to challenge your mind today?</div>

          {/* Today's Challenge */}
          <div className="rounded-card soft-shadow p-6 flex flex-col gap-2 mb-8" style={{ background: '#FEE8B7' }}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-6 h-6 text-[#FFB648]" />
              <span className="font-semibold text-lg">Today's Challenge</span>
            </div>
            <div className="font-bold text-xl mb-1">Mixed Aptitude Quiz</div>
            <div className="text-[#5C5C5C] mb-2">25 questions • 50 minutes • All categories</div>
            <Link to="/quiz">
              <button className="category-btn active">Start Quiz</button>
            </Link>
          </div>

          {/* Quiz Categories */}
          <div className="mb-4 heading-section">Quiz Categories</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <div key={cat.id} className={`rounded-card soft-shadow p-6 flex flex-col gap-2 ${cat.colorClass}`}>
                <div className="flex items-center gap-2 mb-2">
                  {cat.icon}
                  <span className="font-semibold">{cat.name}</span>
                  {cat.badge}
                </div>
                <div className="text-[#5C5C5C] mb-1">{cat.description}</div>
                <div className="flex gap-4 text-sm mb-2">
                  <span>{cat.questions} questions</span>
                  <span>{cat.timeLimit}</span>
                </div>
                <Link to={cat.link} className="mt-auto">
                  <button className="category-btn">Practice Now</button>
                </Link>
              </div>
            ))}
            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Code className="w-6 h-6 text-[#F6C6EA]" />
                  <CardTitle className="text-2xl">Technical Quiz</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Test your technical knowledge with theory questions and coding challenges.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div>• Theory Exam: 20 MCQs</div>
                    <div>• Coding Exam: 5 Problems</div>
                    <div>• Real-time Code Execution</div>
                  </div>
                  <Button 
                    className="w-full bg-[#F6C6EA] hover:bg-[#E5B5D9] text-black"
                    onClick={() => navigate('/technical')}
                  >
                    Start Technical Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="right-panel hidden lg:block ml-4" style={{ minWidth: 320 }}>
          {/* Branding Container */}
          <div className="branding-container mb-6 rounded-card soft-shadow overflow-hidden" style={{ height: '200px' }}>
            <img 
              src="https://res.cloudinary.com/dcoijn5mh/image/upload/v1748709585/ChatGPT_Image_May_31__2025__09_42_42_PM-removebg-preview_nluaw8.png"
              alt="Branding"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="user-profile mb-6">
            <div className="user-avatar flex items-center justify-center">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="User Avatar" 
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-[#978BF4]" />
              )}
            </div>
            <div className="user-info">
              <h3 className="text-lg font-semibold text-[#000000]">rohanpashikanti</h3>
              <div className="user-stats text-[#5C5C5C]">
                <span>Streak: {currentStreak}</span>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="activity-section mb-6">
            <div className="activity-header">
              <div>
                <div className="activity-time">
                  {formatTime(calculateTimeForPeriod(selectedPeriod))}
                </div>
                <div className="activity-badge">Great result!</div>
              </div>
              <select 
                style={{ border: 'none', background: 'transparent', fontWeight: 600 }}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="Year">Year</option>
                <option value="Month">Month</option>
                <option value="Week">Week</option>
              </select>
            </div>
            <div className="activity-chart relative">
              {tooltipData.show && (
                <div 
                  className="absolute bg-white rounded-lg shadow-lg px-3 py-2 text-sm z-50"
                  style={{
                    left: `${tooltipData.x}px`,
                    top: `${tooltipData.y}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-semibold text-[#000000]">{tooltipData.day}, {tooltipData.date}</div>
                  <div className="text-[#5C5C5C]">{tooltipData.time}</div>
                </div>
              )}
              {activityData.map((val, i) => (
                <div 
                  key={i} 
                  className={`chart-bar ${activityColors[i]}`} 
                  style={{ height: `${val}%` }}
                  onMouseEnter={(e) => handleBarHover(e, i)}
                  onMouseLeave={handleBarLeave}
                ></div>
              ))}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="my-courses">
            <h4>Stats</h4>
            <div className="course-item">
              <div className="course-item-icon" style={{ background: '#FAD7D7' }}><Trophy className="w-5 h-5" /></div>
              <div className="course-item-info">
                <h5>Total Quizzes</h5>
                <div className="course-item-rating">{totalQuizzes}</div>
              </div>
            </div>
            <div className="course-item">
              <div className="course-item-icon" style={{ background: '#FEE8B7' }}><Star className="w-5 h-5" /></div>
              <div className="course-item-info">
                <h5>Best Streak</h5>
                <div className="course-item-rating">{bestStreak}</div>
              </div>
            </div>
            <div className="course-item">
              <div className="course-item-icon" style={{ background: '#E1DDFC' }}><Brain className="w-5 h-5" /></div>
              <div className="course-item-info">
                <h5>Accuracy</h5>
                <div className="course-item-rating">{accuracy.toFixed(1)}%</div>
              </div>
            </div>
            <div className="course-item">
              <div className="course-item-icon" style={{ background: '#D8F5E4' }}><Target className="w-5 h-5" /></div>
              <div className="course-item-info">
                <h5>High Score</h5>
                <div className="course-item-rating">{bestScore}/20</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
};

export default Dashboard;
