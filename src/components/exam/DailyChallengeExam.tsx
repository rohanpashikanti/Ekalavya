import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import EndTestDialog from './EndTestDialog';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'mcq';
  userAnswer?: string;
  markedForReview?: boolean;
  topic: string;
}

interface DailyChallengeExamProps {
  onComplete: (score: number, timeTaken: number, questions: Question[]) => void;
}

const TOTAL_TIME = 50 * 60; // 50 minutes in seconds
const TOTAL_QUESTIONS = 25;

const TOPICS = {
  ARITHMETIC: [
    'Percentages',
    'Profit & Loss',
    'Averages',
    'Ratio and Proportion',
    'Time and Work',
    'Pipes and Cisterns'
  ],
  TIME_SPEED_DISTANCE: [
    'Trains',
    'Boats and Streams',
    'Simple and Compound Interest'
  ],
  LOGICAL_REASONING: [
    'Directions and Distances',
    'Blood Relations',
    'Seating Arrangements',
    'Syllogisms',
    'Analogy and Classification'
  ],
  ANALYTICAL_REASONING: [
    'Number Series'
  ],
  CODING_DECODING: [
    'Letter Coding',
    'Number Coding',
    'Letter and Number Mixed Coding'
  ]
};

const DailyChallengeExam: React.FC<DailyChallengeExamProps> = ({ onComplete }) => {
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
      
      // Create a prompt that covers all topics
      const prompt = `Generate ${TOTAL_QUESTIONS} multiple choice questions covering various aptitude topics.
      Include questions from these categories:
      - Arithmetic: ${TOPICS.ARITHMETIC.join(', ')}
      - Time, Speed & Distance: ${TOPICS.TIME_SPEED_DISTANCE.join(', ')}
      - Logical Reasoning: ${TOPICS.LOGICAL_REASONING.join(', ')}
      - Analytical Reasoning: ${TOPICS.ANALYTICAL_REASONING.join(', ')}
      - Coding-Decoding: ${TOPICS.CODING_DECODING.join(', ')}

      Each question should:
      - Be medium to hard difficulty
      - Have 4 options
      - Include the topic it belongs to
      - Be unique and challenging

      Format each question as a JSON object with:
      {
        "question": "question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": "correct option text",
        "type": "mcq",
        "topic": "topic name"
      }

      Return ONLY a valid JSON array of these objects, no other text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response text to ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const parsedQuestions = JSON.parse(cleanedText);
        
        // Validate the parsed questions
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length !== TOTAL_QUESTIONS) {
          throw new Error('Invalid question count');
        }
        
        // Validate each question's structure
        const validQuestions = parsedQuestions.every(q => 
          typeof q.question === 'string' &&
          Array.isArray(q.options) && q.options.length === 4 &&
          typeof q.correctAnswer === 'string' &&
          q.type === 'mcq' &&
          typeof q.topic === 'string'
        );
        
        if (!validQuestions) {
          throw new Error('Invalid question format');
        }
        
        // Add userAnswer and markedForReview fields
        const questionsWithState = parsedQuestions.map(q => ({
          ...q,
          userAnswer: '',
          markedForReview: false
        }));
        
        setQuestions(questionsWithState);
        setCurrentQuestion(0);
        setShowResults(false);
        setTimeLeft(TOTAL_TIME);
        setScore(0);
      } catch (parseError) {
        console.error('Error parsing questions:', parseError);
        throw new Error('Failed to parse questions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <div className="heading-hero mb-2">Daily Challenge</div>
            <div className="text-2xl font-medium mb-4" style={{ color: '#5C5C5C' }}>
              Test your aptitude skills with this daily challenge covering various topics including Arithmetic, Logical Reasoning, and more.
            </div>
            <div className="text-base mb-4" style={{ color: '#5C5C5C' }}>
              You will get 25 MCQ questions and 50 minutes to complete the exam.
            </div>
            <button className="category-btn active w-full" onClick={handleStartExam}>Start Daily Challenge</button>
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
      <div className="min-h-screen bg-gradient-to-br from-[#B6EADA] via-[#E1DDFC] to-[#F6C6EA] py-8">
        <Card className="max-w-3xl mx-auto p-6 bg-white/80 backdrop-blur-lg border border-[#E1DDFC] shadow-lg">
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="w-fit border-[#E1DDFC] text-[#5C5C5C] hover:bg-[rgb(204,220,251)] hover:border-[rgb(204,220,251)] hover:text-[#000000]"
              >
                ← Back to Dashboard
              </Button>
              <CardTitle className="text-2xl font-bold text-[#000000]">Daily Challenge Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-xl font-semibold text-[#000000]">Your Score: {score} / {questions.length}</div>
              {questions.map((q, idx) => (
                <div key={idx} className="p-3 border border-[#E1DDFC] rounded bg-white/50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#000000]">Q.{idx + 1}</span>
                    <span className="text-xs bg-[#E1DDFC] px-2 py-0.5 rounded text-[#5C5C5C]">MCQ</span>
                    {q.markedForReview && <BookmarkCheck className="w-4 h-4 text-[#F6C6EA]" />}
                  </div>
                  <div className="text-[#5C5C5C] mb-2">{q.question}</div>
                  <div>
                    <span className="font-semibold text-[#000000]">Your answer: </span>
                    {q.userAnswer ? (
                      <span className="text-[#5C5C5C]">
                        {String.fromCharCode(65 + q.options.indexOf(q.userAnswer))}. {q.userAnswer}
                      </span>
                    ) : (
                      <span className="text-[#5C5C5C]">Not answered</span>
                    )}
                    <span className="ml-2 text-xs text-[#B6EADA]">
                      (Correct: {String.fromCharCode(65 + q.options.indexOf(q.correctAnswer))}. {q.correctAnswer})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F1EC] p-4">
      <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Challenge</h1>
        <div className="text-lg font-semibold">
          Time Left: {min}:{sec}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm bg-gray-200 px-2 py-0.5 rounded text-black">{questions[currentQuestion]?.topic}</span>
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
            >
              Previous
            </Button>
            <Button
              onClick={() => handleNav(currentQuestion + 1)}
              disabled={currentQuestion === questions.length - 1}
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
      </div>
    </div>
  );
};

export default DailyChallengeExam; 