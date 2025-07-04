import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import EndTestDialog from './EndTestDialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import TabSwitchDialog from './TabSwitchDialog';
import useTabSwitchDetection from '@/hooks/useTabSwitchDetection';
import QuizResultPage from '../quiz/QuizResultPage';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface Question {
  id: number;
  section: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  status: 'Correct' | 'Incorrect' | 'Not Answered';
  explanation?: string;
  timeSpent?: number;
  difficulty?: string;
  type?: string;
  markedForReview?: boolean;
}

interface ExamPageProps {
  topic: string;
  description: string;
  onComplete: (score: number, timeTaken: number, questions: Question[]) => void;
}

const TOTAL_TIME = 40 * 60; // 40 minutes in seconds

const ExamPage: React.FC<ExamPageProps> = ({ topic, description, onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [examStarted, setExamStarted] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [score, setScore] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  const genAI = new GoogleGenerativeAI('AIzaSyDSNKVFGhfCCX6Onx5b8NEyk38qTH-YRXg');

  const generateQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      let prompt = '';
      if (topic === 'Arithmetic Ability-1') {
        prompt = `Generate 20 medium to hard level multiple choice questions about Arithmetic Ability-1 covering:
        - Percentages
        - Profit and Loss
        - Simple Interest
        - Compound Interest
        
        Each question should have 4 options and one correct answer.
        Format each question as a JSON object with:
        {
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct option text",
          "type": "mcq",
          "topic": "specific topic from the list above"
        }
        Return ONLY a valid JSON array of these objects, no other text.`;
      } else if (topic === 'Arithmetic Ability-2') {
        prompt = `Generate 20 medium to hard level multiple choice questions about Arithmetic Ability-2 covering:
        - Ratio and Proportion
        - Time and Work
        - Time and Distance
        - Partnership
        
        Each question should have 4 options and one correct answer.
        Format each question as a JSON object with:
        {
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct option text",
          "type": "mcq",
          "topic": "specific topic from the list above"
        }
        Return ONLY a valid JSON array of these objects, no other text.`;
      } else if (topic === 'Number System') {
        prompt = `Generate 20 medium to hard level multiple choice questions about Number System covering:
        - Number System fundamentals
        - HCF and LCM
        - Simplification
        - Averages
        - Permutation and Combination
        - Mixture and Alligation
        
        Each question should have 4 options and one correct answer.
        Format each question as a JSON object with:
        {
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct option text",
          "type": "mcq",
          "topic": "specific topic from the list above"
        }
        Return ONLY a valid JSON array of these objects, no other text.`;
      } else if (topic === 'Verbal Reasoning') {
        prompt = `Generate 20 medium to hard level multiple choice questions about Verbal Reasoning covering:
        - Blood Relations
        - Seating Arrangement
        - Directions
        
        Each question should have 4 options and one correct answer.
        Format each question as a JSON object with:
        {
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct option text",
          "type": "mcq",
          "topic": "specific topic from the list above"
        }
        Return ONLY a valid JSON array of these objects, no other text.`;
      } else if (topic === 'Analogical Reasoning') {
        prompt = `Generate 20 medium to hard level multiple choice questions about Analogical Reasoning covering:
        - Analogy
        - Alphabet Series
        - Missing Terms
        
        Each question should have 4 options and one correct answer.
        Format each question as a JSON object with:
        {
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct option text",
          "type": "mcq",
          "topic": "specific topic from the list above"
        }
        Return ONLY a valid JSON array of these objects, no other text.`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response text to ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      let parsedQuestions: Question[] = [];
      
      try {
        const match = cleanedText.match(/\[.*\]/s);
        if (!match) throw new Error('No JSON array found in response.');
        parsedQuestions = JSON.parse(match[0]);
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length !== 20) throw new Error('Invalid format');
        parsedQuestions = parsedQuestions.filter(q => q.type === 'mcq' && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctAnswer === 'string');
        if (parsedQuestions.length !== 20) throw new Error('Not all questions are valid MCQ.');
      } catch {
        throw new Error('Failed to parse questions. Please try again.');
      }
      
      setQuestions(parsedQuestions.map(q => ({ ...q, userAnswer: '', markedForReview: false })));
      setCurrentQuestion(0);
      setShowResults(false);
      setTimeLeft(TOTAL_TIME);
      setScore(0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start quiz. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!examStarted || showResults || loading || error) return;
    setQuestionStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleConfirmEndTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [examStarted, showResults, loading, error]);

  useEffect(() => {
    if (showResults) {
      let sc = 0;
      questions.forEach(q => {
        if (q.userAnswer && q.correctAnswer && q.userAnswer === q.correctAnswer) {
          sc++;
        }
      });
      setScore(sc);
      onComplete(sc, TOTAL_TIME - timeLeft, questions);
    }
  }, [showResults, questions, timeLeft, onComplete]);

  const handleMCQ = (option: string) => {
    setQuestions(qs => qs.map((q, i) => i === currentQuestion ? { ...q, userAnswer: option } : q));
  };

  const toggleMarkForReview = () => {
    setQuestions(qs => qs.map((q, i) => i === currentQuestion ? { ...q, markedForReview: !q.markedForReview } : q));
  };

  const handleNav = (idx: number) => {
    setQuestions(qs => {
      if (questionStartTime !== null && currentQuestion !== idx) {
        const now = Date.now();
        const elapsed = Math.floor((now - questionStartTime) / 1000);
        return qs.map((q, i) =>
          i === currentQuestion
            ? { ...q, timeSpent: (q.timeSpent || 0) + elapsed }
            : q
        );
      }
      return qs;
    });
    setCurrentQuestion(idx);
    setQuestionStartTime(Date.now());
  };

  const handleEndTest = () => {
    setShowEndDialog(true);
  };

  const handleConfirmEndTest = () => {
    setQuestions(qs => {
      if (questionStartTime !== null) {
        const now = Date.now();
        const elapsed = Math.floor((now - questionStartTime) / 1000);
        return qs.map((q, i) =>
          i === currentQuestion
            ? { ...q, timeSpent: (q.timeSpent || 0) + elapsed }
            : q
        );
      }
      return qs;
    });
    setShowResults(true);
    clearInterval(timerRef.current!);
    setShowEndDialog(false);
  };

  const handleStartExam = async () => {
    setExamStarted(true);
    await generateQuestions();
  };

  const getStatus = (q: Question) => {
    if (q.userAnswer && q.markedForReview) return 'answered-marked';
    if (q.userAnswer) return 'answered';
    if (q.markedForReview) return 'marked';
    return 'not-answered';
  };

  const min = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const sec = (timeLeft % 60).toString().padStart(2, '0');

  const handleMaxAttemptsReached = () => {
    handleConfirmEndTest();
  };

  const { remainingAttempts, showDialog, closeDialog } = useTabSwitchDetection({
    onMaxAttemptsReached: handleMaxAttemptsReached,
  });

  const mappedQuestions = questions.map((q, idx) => {
    let status: 'Correct' | 'Incorrect' | 'Not Answered';
    if (q.userAnswer) {
      status = q.userAnswer === q.correctAnswer ? 'Correct' : 'Incorrect';
    } else {
      status = 'Not Answered';
    }
    return {
      id: idx + 1,
      section: topic.includes('Verbal') ? 'Verbal' : 'Aptitude',
      topic: (q as any).topic || topic,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: q.userAnswer,
      status,
      explanation: (q as any).explanation || '',
      timeSpent: (q as any).timeSpent || undefined,
      difficulty: (q as any).difficulty || undefined,
      type: q.type || 'MCQ',
    };
  });

  if (!examStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <button
            className="mb-4 category-btn"
            onClick={() => window.history.back()}
          >
            ← Back to Quiz
          </button>
          <div className="rounded-card soft-shadow p-8 flex flex-col gap-4 card-media">
            <div className="heading-hero mb-2">{topic} Exam</div>
            <div className="text-2xl font-medium mb-4" style={{ color: '#5C5C5C' }}>
              This exam covers:
              <ul className="list-disc ml-6 mt-2 text-base">
                {description.split(',').map((desc, i) => (
                  <li key={i}>{desc.trim()}</li>
                ))}
              </ul>
            </div>
            <div className="text-base mb-4" style={{ color: '#5C5C5C' }}>
              You will get 20 MCQ questions and 40 minutes to complete the test.
            </div>
            <button className="category-btn active w-full" onClick={handleStartExam}>Start Exam</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
        <LoadingSpinner />
        <p className="text-[#000000] text-lg font-medium mt-4">Generating questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={generateQuestions} className="w-full">Try Again</Button>
      </div>
    );
  }

  if (showResults) {
    return (
      <QuizResultPage
        questions={mappedQuestions}
        totalScore={score}
        totalQuestions={questions.length}
        examTitle={topic}
      />
    );
  }

  return (
    <div className="flex h-screen exam-content">
      <div className="w-56 bg-white border-r flex flex-col items-center py-6">
        <div className="mb-6 font-bold text-lg">All Questions</div>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {questions.map((q, idx) => {
            let color = '';
            if (getStatus(q) === 'answered') color = 'bg-green-400 text-white';
            else if (getStatus(q) === 'not-answered') color = 'bg-red-400 text-white';
            else if (getStatus(q) === 'marked') color = 'bg-purple-400 text-white';
            else if (getStatus(q) === 'answered-marked') color = 'bg-fuchsia-600 text-white';
            return (
              <button
                key={idx}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${currentQuestion === idx ? 'border-black' : 'border-transparent'} ${color}`}
                onClick={() => handleNav(idx)}
                title={`Q${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <div className="mt-auto space-y-2 text-xs">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Answered</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Not Answered</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-400 inline-block" /> Marked for review</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-fuchsia-600 inline-block" /> Answered & Marked</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b px-8 py-4 bg-gray-50">
          <div className="font-bold text-lg">Q.{currentQuestion + 1}</div>
          <div className="flex items-center gap-4">
            <span className="bg-gray-200 px-3 py-1 rounded text-sm text-black">MCQ</span>
            <span className="bg-purple-100 px-3 py-1 rounded text-purple-700 font-semibold">{min}:{sec}</span>
            <Button variant="destructive" onClick={handleEndTest}>End Test</Button>
          </div>
        </div>
        <div className="flex-1 flex flex-row">
          <div className="flex-1 flex flex-col justify-center items-center px-8">
            <div className="text-xl font-semibold mb-4">{questions[currentQuestion]?.question}</div>
            {questions[currentQuestion]?.options && (
              <div className="space-y-2 w-full max-w-md">
                {questions[currentQuestion].options.map((opt, i) => (
                  <button
                    key={i}
                    className={`option-btn${questions[currentQuestion].userAnswer === opt ? ' selected' : ''}`}
                    onClick={() => handleMCQ(opt)}
                    type="button"
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-80 border-l bg-gray-50 flex flex-col items-center py-8 px-4">
            <div className="mb-4">
              <Button
                variant={questions[currentQuestion].markedForReview ? 'default' : 'outline'}
                onClick={toggleMarkForReview}
                className="w-full flex items-center gap-2"
              >
                {questions[currentQuestion].markedForReview ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {questions[currentQuestion].markedForReview ? 'Marked for Review' : 'Mark for Review'}
              </Button>
            </div>
            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
                disabled={currentQuestion === 0}
              >Previous</Button>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(q => Math.min(questions.length - 1, q + 1))}
                disabled={currentQuestion === questions.length - 1}
              >Next</Button>
            </div>
          </div>
        </div>
      </div>
      <EndTestDialog
        isOpen={showEndDialog}
        onClose={() => setShowEndDialog(false)}
        onConfirm={handleConfirmEndTest}
        attemptedQuestions={questions.filter(q => q.userAnswer).length}
        totalQuestions={questions.length}
      />
      <TabSwitchDialog
        isOpen={showDialog}
        onClose={closeDialog}
        remainingAttempts={remainingAttempts}
        onConfirm={handleConfirmEndTest}
      />
    </div>
  );
};

export default ExamPage; 