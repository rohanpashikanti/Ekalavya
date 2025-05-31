import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { getUserData } from '@/lib/userData';
import { Brain, Target, Trophy, Star, User, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  // For activity chart (dummy data for now)
  const activityData = [45, 60, 80, 90, 70, 85, 95];
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
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="right-panel hidden lg:block ml-4" style={{ minWidth: 320 }}>
          <div className="user-profile mb-6">
            <div className="user-avatar flex items-center justify-center">
              <User className="w-8 h-8 text-[#978BF4]" />
            </div>
            <div className="user-info">
              <h3>{username}</h3>
              <div className="user-stats">
                <span>Streak: {currentStreak}</span>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="activity-section mb-6">
            <div className="activity-header">
              <div>
                <div className="activity-time">{(avgTime/60).toFixed(1)}h</div>
                <div className="activity-badge">Great result!</div>
              </div>
              <select style={{ border: 'none', background: 'transparent', fontWeight: 600 }}>
                <option>Year</option>
                <option>Month</option>
                <option>Week</option>
              </select>
            </div>
            <div className="activity-chart">
              {activityData.map((val, i) => (
                <div key={i} className={`chart-bar ${activityColors[i]}`} style={{ height: `${val}%` }}></div>
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
