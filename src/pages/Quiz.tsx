import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import QuizTaking from '../components/quiz/QuizTaking';
import QuizResults from '../components/quiz/QuizResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, Target, BookOpen, Globe, Loader2, Calculator, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData, getRecentQuizzes } from '@/lib/userData';

const Quiz: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizState, setQuizState] = useState<'selection' | 'taking' | 'completed'>('selection');
  const [quizResults, setQuizResults] = useState<any>(null);

  const quizCategories = [
    {
      id: 'quantitative',
      name: 'Quantitative Aptitude',
      icon: Calculator,
      color: 'from-purple-500 to-pink-500',
      description: 'Mathematics, Data Interpretation, and Problem Solving',
      difficulty: 'Intermediate'
    },
    {
      id: 'logical',
      name: 'Logical Reasoning',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      description: 'Pattern Recognition, Analytical Thinking',
      difficulty: 'Advanced'
    },
    {
      id: 'verbal',
      name: 'Verbal Ability',
      icon: BookOpen,
      color: 'from-green-500 to-teal-500',
      description: 'Reading Comprehension, Grammar, Vocabulary',
      difficulty: 'Beginner'
    },
    {
      id: 'general',
      name: 'General Knowledge',
      icon: Globe,
      color: 'from-orange-500 to-red-500',
      description: 'Current Affairs, History, Science, Geography',
      difficulty: 'Intermediate'
    }
  ];

  const specificTopics = {
    quantitative: [
      { id: 'arithmetic-1', name: 'Arithmetic Ability-1', description: 'Percentage, Profit & Loss, SI & CI' },
      { id: 'arithmetic-2', name: 'Arithmetic Ability-2', description: 'Ratio, Time & Work, Speed & Distance' },
      { id: 'number-system', name: 'Number System', description: 'HCF/LCM, Divisibility, Prime Numbers' }
    ],
    logical: [
      { id: 'verbal-reasoning', name: 'Verbal Reasoning', description: 'Blood Relations, Seating, Directions' },
      { id: 'analogical-reasoning', name: 'Analogical Reasoning', description: 'Analogy, Series, Syllogisms' }
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
      'analogical-reasoning'
    ].includes(topicId)) {
      window.location.href = `/exam/${topicId}`;
      return;
    }
    
    setLoading(true);
    try {
      // Get user's performance data
      const userData = getUserData(user.id);
      const recentQuizzes = getRecentQuizzes(user.id, 10); // Get last 10 quizzes for analysis

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { 
          topic: topicId, 
          difficulty, 
          quizType,
          userId: user.id
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

  // Show specific topics if a category is selected
  if (selectedCategory && specificTopics[selectedCategory as keyof typeof specificTopics]) {
    const topics = specificTopics[selectedCategory as keyof typeof specificTopics];
    
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory(null)}
                className="mb-4 border-gray-600 text-gray-200 hover:bg-gray-700"
              >
                ← Back to Categories
              </Button>
              <h1 className="text-3xl font-bold text-white mb-2">
                {quizCategories.find(c => c.id === selectedCategory)?.name} Topics
              </h1>
              <p className="text-gray-400">Choose a specific topic for targeted practice</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map((topic) => (
              <Card key={topic.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">{topic.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {topic.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        <span>20 questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>40 minutes</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => startQuiz(topic.id, 'intermediate', 'practice')}
                        disabled={loading}
                        variant="outline"
                        className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                        Practice
                      </Button>
                      <Button 
                        onClick={() => startQuiz(topic.id, 'intermediate', 'exam')}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Exam
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Choose Your Quiz</h1>
            <p className="text-gray-400">Select a category to test your aptitude</p>
          </div>
        </div>

        {/* Daily Challenge */}
        <Card className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-cyan-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl">Daily Challenge</CardTitle>
                <CardDescription className="text-cyan-200">
                  Mixed questions from all categories
                </CardDescription>
              </div>
              <Badge className="bg-yellow-500 text-black">Today's Special</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-white">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>25 Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>50 Minutes</span>
                </div>
              </div>
              <Button 
                onClick={() => startQuiz('daily-challenge', 'mixed', 'exam')}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Start Daily Challenge
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizCategories.map((category) => {
            const IconComponent = category.icon;
            const hasSpecificTopics = specificTopics[category.id as keyof typeof specificTopics];
            
            return (
              <Card key={category.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 group">
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        <span>20 questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>40 minutes</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {hasSpecificTopics ? (
                        <Button 
                          onClick={() => setSelectedCategory(category.id)}
                          className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white"
                        >
                          View Topics
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => startQuiz(category.id, category.difficulty.toLowerCase())}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Start Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Practice */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Practice</CardTitle>
            <CardDescription className="text-gray-400">
              Short 10-question practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quizCategories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  onClick={() => startQuiz(category.id, 'easy', 'practice')}
                  disabled={loading}
                  className="border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-400"
                >
                  {category.name.split(' ')[0]} - Quick
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Quiz;