import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, BookmarkCheck, Bookmark } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EndTestDialog from './EndTestDialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import TabSwitchDialog from './TabSwitchDialog';
import useTabSwitchDetection from '@/hooks/useTabSwitchDetection';
import QuizResultPage from '@/components/quiz/QuizResultPage';
import { Link } from 'react-router-dom';

interface ReadingComprehension {
  paragraph: string;
  questions: Question[];
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'mcq';
  userAnswer?: string;
  markedForReview?: boolean;
  paragraph?: string; // For reading comprehension questions
}

interface VerbalAbilityExamProps {
  onComplete: (score: number, timeTaken: number, questions: Question[]) => void;
}

const TOTAL_TIME = 25 * 60; // 25 minutes in seconds
const TOTAL_QUESTIONS = 20;

const TOPICS = {
  READING_COMPREHENSION: [
    'Reading Comprehension',
    'Cloze Test',
    'Critical Reasoning',
    'Precis Summary & Central Idea Identification'
  ],
  GRAMMAR: [
    'Para Jumbles',
    'Sentence Correction',
    'Common Grammar Errors',
    'Prepositions',
    'Phrasal Verbs'
  ],
  VOCABULARY: [
    'Idioms and Phrases',
    'One Word Substitutions',
    'Synonyms and Antonyms',
    'Confusing Words',
    'Root Words',
    'Prefixes and Suffixes'
  ]
};

const VerbalAbilityExam: React.FC<VerbalAbilityExamProps> = ({ onComplete }) => {
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

  const genAI = new GoogleGenerativeAI('AIzaSyDSNKVFGhfCCX6Onx5b8NEyk38qTH-YRXg');

  const generateQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Randomly select topics for this exam
      const selectedTopics = {
        reading: TOPICS.READING_COMPREHENSION.sort(() => 0.5 - Math.random()).slice(0, 2),
        grammar: TOPICS.GRAMMAR.sort(() => 0.5 - Math.random()).slice(0, 2),
        vocabulary: TOPICS.VOCABULARY.sort(() => 0.5 - Math.random()).slice(0, 2)
      };

      const prompt = `Generate 20 medium to hard level multiple choice questions for Verbal Ability covering the following topics:
      
      Reading & Comprehension:
      ${selectedTopics.reading.map(t => `- ${t}`).join('\n')}
      
      Grammar & Sentence Structure:
      ${selectedTopics.grammar.map(t => `- ${t}`).join('\n')}
      
      Vocabulary & Usage:
      ${selectedTopics.vocabulary.map(t => `- ${t}`).join('\n')}
      
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
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleConfirmEndTest();  // Directly submit without showing dialog
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

  const handleNav = (idx: number) => setCurrentQuestion(idx);

  const handleEndTest = () => {
    setShowEndDialog(true);
  };

  const handleConfirmEndTest = () => {
    setShowResults(true);
    clearInterval(timerRef.current!);
    setShowEndDialog(false);
  };

  const handleCancelEndTest = () => {
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

  const getAttemptedCount = () => {
    return questions.filter(q => q.userAnswer).length;
  };

  const getRemainingCount = () => {
    return questions.length - getAttemptedCount();
  };

  const handleMaxAttemptsReached = () => {
    handleConfirmEndTest();
  };

  const { remainingAttempts, showDialog, closeDialog } = useTabSwitchDetection({
    onMaxAttemptsReached: handleMaxAttemptsReached,
  });

  // Add effect to disable text selection and copying
  useEffect(() => {
    if (examStarted && !showResults) {
      const preventCopy = (e: ClipboardEvent) => {
        e.preventDefault();
      };

      const preventSelect = (e: MouseEvent) => {
        e.preventDefault();
      };

      document.addEventListener('copy', preventCopy);
      document.addEventListener('selectstart', preventSelect);
      document.addEventListener('contextmenu', preventSelect);

      return () => {
        document.removeEventListener('copy', preventCopy);
        document.removeEventListener('selectstart', preventSelect);
        document.removeEventListener('contextmenu', preventSelect);
      };
    }
  }, [examStarted, showResults]);

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
          <div className="rounded-card soft-shadow p-8 flex flex-col gap-4 card-business">
            <div className="heading-hero mb-2">Verbal Ability</div>
            <div className="text-2xl font-medium mb-4" style={{ color: '#5C5C5C' }}>
              Test your verbal skills with this exam covering:
              <ul className="list-disc ml-6 mt-2 text-base">
                <li>Reading & Comprehension</li>
                <li>Grammar & Sentence Structure</li>
                <li>Vocabulary & Usage</li>
              </ul>
            </div>
            <div className="text-base mb-4" style={{ color: '#5C5C5C' }}>
              You will get 20 MCQ questions and 25 minutes to complete the exam.
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
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-56 bg-white border-r flex flex-col items-center py-8 px-4 shadow-md">
          <div className="mb-8 font-bold text-lg">Menu</div>
          <Link
            to="/dashboard"
            className="mb-4 w-full text-center py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/exam"
            className="mb-4 w-full text-center py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
          >
            Switch Exam
          </Link>
          {/* Add more sidebar links as needed */}
        </div>
        {/* Main Result Content */}
        <div className="flex-1 pl-8 pr-4 py-8">
          <QuizResultPage
            questions={questions.map((q, idx) => ({
              id: idx,
              section: 'Verbal Ability',
              topic: '-',
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              userAnswer: q.userAnswer,
              status: q.userAnswer ? (q.userAnswer === q.correctAnswer ? 'Correct' : 'Incorrect') : 'Not Answered',
              explanation: '',
              timeSpent: 0,
              difficulty: 'Medium',
              type: 'MCQ'
            }))}
            totalScore={score}
            totalQuestions={questions.length}
            examTitle="Verbal Ability"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 exam-content">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Verbal Ability</h1>
        <div className="text-lg font-semibold">
          Time Left: {min}:{sec}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm bg-gray-200 px-2 py-0.5 rounded text-black">
                  {currentQuestion < 8 ? 'Reading Comprehension' :
                   currentQuestion < 14 ? 'Grammar' : 'Vocabulary'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMarkForReview}
                  className="ml-auto"
                >
                  {questions[currentQuestion]?.markedForReview ? (
                    <BookmarkCheck className="w-4 h-4 text-purple-500" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {questions[currentQuestion]?.paragraph && (
                <div className="text-gray-700 mb-6 italic">{questions[currentQuestion].paragraph}</div>
              )}
              <div className="text-lg mb-6">
                Q.{currentQuestion + 1}. {questions[currentQuestion]?.question}
              </div>
              <div className="space-y-3">
                {questions[currentQuestion]?.options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant={questions[currentQuestion]?.userAnswer === option ? "default" : "outline"}
                    className={`w-full justify-start ${
                      questions[currentQuestion]?.userAnswer === option 
                        ? 'bg-[rgb(204,220,251)] text-[#000000] hover:bg-[rgb(204,220,251)] hover:text-[#000000]' 
                        : 'border-[#E1DDFC] text-[#5C5C5C] hover:bg-[rgb(204,220,251)] hover:border-[rgb(204,220,251)] hover:text-[#000000]'
                    }`}
                    onClick={() => handleMCQ(option)}
                  >
                    {String.fromCharCode(65 + idx)}. {option}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => handleNav(currentQuestion - 1)}
              disabled={currentQuestion === 0}
              className="bg-gradient-to-r from-[#B6EADA] to-[#F6C6EA] hover:from-[#A0E9CE] hover:to-[#F9D3F3] text-[#000000] font-semibold"
            >
              Previous
            </Button>
            <Button
              onClick={() => handleNav(currentQuestion + 1)}
              disabled={currentQuestion === questions.length - 1}
              className="bg-gradient-to-r from-[#B6EADA] to-[#F6C6EA] hover:from-[#A0E9CE] hover:to-[#F9D3F3] text-[#000000] font-semibold"
            >
              Next
            </Button>
          </div>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className={`w-full ${
                      currentQuestion === idx 
                        ? 'border-2 border-[#B6EADA] bg-[#B6EADA] text-[#000000]' 
                        : getStatus(q) === 'answered' 
                          ? 'bg-[#B6EADA] text-[#000000] border-[#B6EADA]' 
                          : getStatus(q) === 'marked' 
                            ? 'bg-[#FFD966] text-[#000000] border-[#FFD966]' 
                            : getStatus(q) === 'answered-marked' 
                              ? 'bg-[#F6C6EA] text-[#000000] border-[#F6C6EA]' 
                              : 'bg-[#E1DDFC] text-[#5C5C5C] border-[#E1DDFC]'
                    } hover:bg-[rgb(204,220,251)] hover:border-[rgb(204,220,251)] hover:text-[#000000]`}
                    onClick={() => handleNav(idx)}
                  >
                    {idx + 1}
                  </Button>
                ))}
              </div>
              <Button
                className="w-full mt-4 bg-gradient-to-r from-[#B6EADA] to-[#F6C6EA] hover:from-[#A0E9CE] hover:to-[#F9D3F3] text-[#000000] font-semibold"
                onClick={handleEndTest}
              >
                End Test
              </Button>
            </CardContent>
          </Card>
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

export default VerbalAbilityExam; 