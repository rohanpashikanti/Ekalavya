import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import QuizTaking from '../components/quiz/QuizTaking';
import QuizResults from '../components/quiz/QuizResults';
import DailyQuiz from '../components/quiz/DailyQuiz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, Target, BookOpen, Globe, Loader2, Calculator, Lightbulb, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData, getRecentQuizzes } from '@/lib/userData';
import AptitudeTest from '../components/AptitudeTest';

const Quiz: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizState, setQuizState] = useState<'selection' | 'taking' | 'completed'>('selection');
  const [quizResults, setQuizResults] = useState<any>(null);
  const [showAptitudeTest, setShowAptitudeTest] = useState(false);

  const quizCategories = [
    {
      id: 'quantitative',
      name: 'Quantitative Aptitude',
      icon: Calculator,
      colorClass: 'card-it',
      badge: <span className="badge-star">Intermediate</span>,
      description: 'Mathematics, Data Interpretation, and Problem Solving',
      difficulty: 'Intermediate',
      questions: 20,
      time: '40 minutes',
    },
    {
      id: 'logical',
      name: 'Logical Reasoning',
      icon: Target,
      colorClass: 'card-business',
      badge: <span className="badge-business">Advanced</span>,
      description: 'Pattern Recognition, Analytical Thinking',
      difficulty: 'Advanced',
      questions: 20,
      time: '40 minutes',
    },
    {
      id: 'verbal-ability',
      name: 'Verbal Ability',
      icon: BookOpen,
      colorClass: 'card-media',
      badge: <span className="badge-media">Beginner</span>,
      description: 'Reading Comprehension, Grammar, Vocabulary',
      difficulty: 'Beginner',
      questions: 20,
      time: '40 minutes',
    },
    {
      id: 'ai-aptitude',
      name: 'AI-Powered Aptitude',
      icon: Brain,
      colorClass: 'card-interior',
      badge: <span className="badge-interior">Adaptive</span>,
      description: 'Dynamic aptitude questions powered by AI',
      difficulty: 'Adaptive',
      questions: 20,
      time: '',
    },
  ];

  const specificTopics = {
    quantitative: [
      { id: 'arithmetic-1', name: 'Arithmetic Ability-1', description: 'Percentages, Profit & Loss, Simple & Compound Interest' },
      { id: 'arithmetic-2', name: 'Arithmetic Ability-2', description: 'Ratio, Time & Work, Speed & Distance, Partnership' },
      { id: 'number-system', name: 'Number System', description: 'Number System, HCF and LCM, Simplification, Averages, Permutation and Combination, Mixture and Alligation' }
    ],
    logical: [
      { id: 'verbal-reasoning', name: 'Verbal Reasoning', description: 'Blood Relations, Seating Arrangement, Directions' },
      { id: 'analogical-reasoning', name: 'Analogical Reasoning', description: 'Analogy, Alphabet Series, Missing Terms,Syllogisms' }
    ]
  };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const startQuiz = async (topicId: string, difficulty: string = 'intermediate', quizType: string = 'exam') => {
    if (!user) return;
    
    if (quizType === 'exam' && [
      'arithmetic-1', 
      'arithmetic-2', 
      'number-system',
      'verbal-reasoning',
      'analogical-reasoning',
      'verbal-ability'
    ].includes(topicId)) {
      window.location.href = `/exam/${topicId}`;
      return;
    }
    
    setLoading(true);
    try {
      // Get user's performance data
      const userData = getUserData(user.uid);
      const recentQuizzes = getRecentQuizzes(user.uid, 10); // Get last 10 quizzes for analysis

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { 
          topic: topicId, 
          difficulty, 
          quizType,
          userId: user.uid
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // Fetch the complete quiz with questions
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (*)
        `)
        .eq('id', data.quiz_id)
        .single();

      if (quizError) throw quizError;

      setCurrentQuiz(quiz);
      setQuizState('taking');
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (score: number, timeTaken: number) => {
    setQuizResults({
      score,
      totalQuestions: 20,
      timeTaken,
      topic: currentQuiz.topic,
    });
    setQuizState('completed');
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuizResults(null);
    setQuizState('selection');
    setSelectedCategory(null);
  };

  if (quizState === 'taking' && currentQuiz) {
    return (
      <Layout>
        <QuizTaking
          quizId={currentQuiz.id}
          questions={currentQuiz.questions}
          topic={currentQuiz.topic}
          onComplete={handleQuizComplete}
        />
      </Layout>
    );
  }

  if (quizState === 'completed' && quizResults) {
    return (
      <Layout>
        <div className="space-y-6">
          <QuizResults {...quizResults} />
          <div className="text-center">
            <Button onClick={resetQuiz} className="bg-cyan-600 hover:bg-cyan-700">
              Take Another Quiz
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (showAptitudeTest) {
    return <Layout><AptitudeTest /></Layout>;
  }

  // Show specific topics if a category is selected
  if (selectedCategory && specificTopics[selectedCategory as keyof typeof specificTopics]) {
    const topics = specificTopics[selectedCategory as keyof typeof specificTopics];
    
    return (
      <Layout>
        <div className="space-y-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedCategory(null)}
            className="mb-4 category-btn"
          >
            ← Back to Categories
          </Button>
          <h1 className="heading-hero mb-2">{quizCategories.find(c => c.id === selectedCategory)?.name} Topics</h1>
          <div className="text-2xl font-medium mb-8" style={{ color: '#5C5C5C' }}>Choose a specific topic for targeted practice</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map((topic) => (
              <div key={topic.id} className="rounded-card soft-shadow p-6 flex flex-col gap-2 card-it">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-6 h-6" />
                  <span className="font-semibold">{topic.name}</span>
                  <span className="badge-star">Practice</span>
                </div>
                <div className="text-[#5C5C5C] mb-1">{topic.description}</div>
                <div className="flex gap-4 text-sm mb-2">
                  <span>20 questions</span>
                  <span>40 minutes</span>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => startQuiz(topic.id, 'intermediate', 'practice')}
                    disabled={loading}
                    className="category-btn flex-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                    Practice
                  </button>
                  <button 
                    onClick={() => startQuiz(topic.id, 'intermediate', 'exam')}
                    disabled={loading}
                    className="category-btn flex-1 active"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/dashboard'}
          className="mb-4 category-btn hover:bg-[rgb(204,220,251)] hover:border-[rgb(204,220,251)] hover:text-gray-800"
        >
          ← Back to Dashboard
        </Button>
        <h1 className="heading-hero mb-2">Choose Your Quiz</h1>
        <div className="text-2xl font-medium mb-8" style={{ color: '#5C5C5C' }}>Select a category to test your aptitude</div>
        {/* Daily Challenge */}
        <div className="rounded-card soft-shadow p-6 flex flex-col gap-2 mb-8 card-business">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-6 h-6 text-[#FFB648]" />
            <span className="font-semibold text-lg">Daily Challenge</span>
          </div>
          <div className="font-bold text-xl mb-1">Test your skills with a comprehensive quiz covering various aptitude topics</div>
          <div className="flex gap-4 text-sm mb-2">
            <span>25 questions</span>
            <span>50 minutes</span>
          </div>
          <button
            onClick={() => window.location.href = '/exam/daily-challenge'}
            className="category-btn active w-full md:w-auto"
          >
            Start Daily Challenge
          </button>
        </div>
        {/* Regular Quiz Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizCategories.map((category) => (
            <div
              key={category.id}
              className={`rounded-card soft-shadow p-6 flex flex-col gap-2 cursor-pointer ${category.colorClass}`}
              onClick={() => {
                if (category.id === 'verbal-ability') {
                  window.location.href = '/exam/verbal-ability';
                } else if (category.id === 'ai-aptitude') {
                  setShowAptitudeTest(true);
                } else {
                  setSelectedCategory(category.id);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <category.icon className="w-6 h-6" />
                <span className="font-semibold">{category.name}</span>
                {category.badge}
              </div>
              <div className="text-[#5C5C5C] mb-1">{category.description}</div>
              <div className="flex gap-4 text-sm mb-2">
                <span>{category.questions} questions</span>
                <span>{category.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Quiz;