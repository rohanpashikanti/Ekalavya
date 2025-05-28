import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import QuizTaking from './QuizTaking';
import QuizResults from './QuizResults';

const DailyQuiz: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizState, setQuizState] = useState<'selection' | 'taking' | 'completed'>('selection');
  const [quizResults, setQuizResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(50 * 60); // 50 minutes in seconds

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizState === 'taking' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  const generateQuiz = async () => {
    if (!user) return;

    // Create a new quiz document
    const quizRef = await addDoc(collection(db, 'quizzes'), {
      topic: 'Daily Challenge',
      time_limit: 50 * 60,
      question_count: 25,
      user_id: user.uid,
      created_at: new Date().toISOString(),
      is_completed: false,
      type: 'daily-challenge'
    });

    // Generate questions (you'll need to implement your question generation logic here)
    const questions = []; // Add your question generation logic
    for (const question of questions) {
      await addDoc(collection(db, 'questions'), {
        ...question,
        quiz_id: quizRef.id
      });
    }

    return quizRef.id;
  };

  const startDailyQuiz = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check if user already has a daily quiz for today
      const today = new Date().toISOString().split('T')[0];
      const quizzesRef = collection(db, 'quizzes');
      const q = query(
        quizzesRef,
        where('user_id', '==', user.uid),
        where('type', '==', 'daily-challenge'),
        where('created_at', '>=', today)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const existingQuiz = querySnapshot.docs[0];
        const quizData = existingQuiz.data();
        
        // Fetch questions for the existing quiz
        const questionsRef = collection(db, 'questions');
        const questionsQuery = query(questionsRef, where('quiz_id', '==', existingQuiz.id));
        const questionsSnapshot = await getDocs(questionsQuery);
        const questions = questionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setCurrentQuiz({
          id: existingQuiz.id,
          ...quizData,
          questions
        });
        setQuizState('taking');
        setTimeLeft(50 * 60);
        return;
      }

      // Generate new quiz
      const quizId = await generateQuiz();
      
      // Fetch the complete quiz with questions
      const quizRef = doc(db, 'quizzes', quizId);
      const quizDoc = await getDoc(quizRef);
      
      if (!quizDoc.exists()) {
        throw new Error('Failed to create quiz');
      }

      const quizData = quizDoc.data();
      
      // Fetch questions
      const questionsRef = collection(db, 'questions');
      const questionsQuery = query(questionsRef, where('quiz_id', '==', quizId));
      const questionsSnapshot = await getDocs(questionsQuery);
      const questions = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCurrentQuiz({
        id: quizId,
        ...quizData,
        questions
      });
      setQuizState('taking');
      setTimeLeft(50 * 60);
    } catch (error) {
      console.error('Error starting daily quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to start daily quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (score: number, timeTaken: number) => {
    setQuizResults({
      score,
      totalQuestions: 25,
      timeTaken,
      topic: 'Daily Challenge',
    });
    setQuizState('completed');
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuizResults(null);
    setQuizState('selection');
    setTimeLeft(50 * 60);
  };

  if (quizState === 'taking' && currentQuiz) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-white">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            Daily Challenge
          </Badge>
        </div>
        <QuizTaking
          quizId={currentQuiz.id}
          questions={currentQuiz.questions}
          topic="Daily Challenge"
          onComplete={handleQuizComplete}
          timeLimit={50 * 60}
        />
      </div>
    );
  }

  if (quizState === 'completed' && quizResults) {
    return (
      <div className="space-y-6">
        <QuizResults {...quizResults} />
        <div className="text-center">
          <Button onClick={resetQuiz} className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
            Take Another Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-white">Daily Challenge</CardTitle>
        <CardDescription className="text-gray-400">
          Test your skills with 25 questions across all topics in 50 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>25 questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>50 minutes</span>
            </div>
          </div>
          <Button 
            onClick={startDailyQuiz}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Start Daily Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyQuiz; 