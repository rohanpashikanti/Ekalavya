import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Timer } from 'lucide-react';
import GeneratingQuestions from '@/components/ui/generating-questions';
import QuizResultPage from '@/components/quiz/QuizResultPage';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const ExamTest: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const generateExamQuestions = (): Question[] => {
    // This is a placeholder. Replace with actual question generation logic
    return Array(30).fill(null).map((_, index) => ({
      id: index + 1,
      question: `Exam question ${index + 1}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: Math.floor(Math.random() * 4)
    }));
  };

  const startQuiz = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call to generate questions
      await new Promise(resolve => setTimeout(resolve, 2000));
      setQuestions(generateExamQuestions());
      setCurrentQuestion(0);
      setShowResults(false);
      setUserAnswers([]);
      setStartTime(Date.now());
    } finally {
      setIsGenerating(false);
    }
  };

  // Map questions to QuizResultPage format
  const mappedQuestions = questions.map((q, idx) => {
    const userAnswer = userAnswers[idx] !== undefined ? q.options[userAnswers[idx]] : undefined;
    const correctAnswer = q.options[q.correctAnswer];
    let status: 'Correct' | 'Incorrect' | 'Not Answered';
    if (userAnswer) {
      status = userAnswer === correctAnswer ? 'Correct' : 'Incorrect';
    } else {
      status = 'Not Answered';
    }
    return {
      id: q.id,
      section: 'Aptitude', // or 'Verbal', etc. as appropriate
      topic: '-', // or actual topic if available
      question: q.question,
      options: q.options,
      correctAnswer,
      userAnswer,
      status,
      explanation: '', // Add explanation if available
      timeSpent: 0, // Add time spent if tracked
      difficulty: 'Easy', // or actual difficulty if available
      type: 'MCQ',
    };
  });

  return (
    <div className="min-h-screen bg-[#F6F1EC] p-4">
      {isGenerating && <GeneratingQuestions />}
      <div className="max-w-4xl mx-auto">
        {/* ... rest of the component ... */}
        {showResults && (
          <QuizResultPage
            questions={mappedQuestions}
            totalScore={mappedQuestions.filter(q => q.status === 'Correct').length}
            totalQuestions={mappedQuestions.length}
            examTitle="Aptitude Exam"
          />
        )}
      </div>
    </div>
  );
};

export default ExamTest; 