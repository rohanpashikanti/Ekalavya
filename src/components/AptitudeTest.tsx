import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import EndTestDialog from './exam/EndTestDialog';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'mcq';
  userAnswer?: string;
  markedForReview?: boolean;
}

const TOPICS = [
  // Quantitative Aptitude
  'Percentages',
  'Profit and Loss',
  'Averages',
  'Ratio and Proportion',
  'Time and Work',
  'Pipes and Cisterns',
  
  // Time, Speed & Distance
  'Trains',
  'Boats and Streams',
  'Time, Speed and Distance',
  
  // Interest
  'Simple and Compound Interest',
  
  // Reasoning
  'Directions and Distances',
  'Blood Relations',
  'Seating Arrangements',
  'Syllogisms',
  'Analogy and Classification',
  
  // Series and Coding
  'Number Series',
  'Letter Coding',
  'Number Coding',
  'Letter and Number Mixed Coding',
];

const TOTAL_TIME = 40 * 60; // 40 minutes in seconds

const AptitudeTest = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [examStarted, setExamStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [score, setScore] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const genAI = new GoogleGenerativeAI('AIzaSyDSNKVFGhfCCX6Onx5b8NEyk38qTH-YRXg');

  // Generate 20 MCQ questions based on topic
  const generateQuestions = async (topic: string) => {
    setLoading(true);
    setError(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Generate 20 MCQ aptitude test questions on the topic '${topic}'. Each question should be of medium to hard difficulty level. Each question should have:\n- type: 'mcq'\n- question: string\n- options: array of 4 possible answer values (e.g., [\"10%\", \"8%\", \"12%\", \"15%\"])\n- correctAnswer: one of the options (the value, not the letter)\nRespond ONLY with a valid JSON array, no explanation, no markdown, no extra text.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      let parsedQuestions: Question[] = [];
      try {
        // Extract JSON array from the response
        const match = text.match(/\[.*\]/s);
        if (!match) throw new Error('No JSON array found in response.');
        parsedQuestions = JSON.parse(match[0]);
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length !== 20) throw new Error('Invalid format');
        // Validate all are MCQ and have 4 options
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

  // Timer logic
  useEffect(() => {
    if (!examStarted || showResults || loading || error) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleEndTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [examStarted, showResults, loading, error]);

  // Score calculation (MCQ only)
  useEffect(() => {
    if (showResults) {
      let sc = 0;
      questions.forEach(q => {
        if (q.userAnswer && q.correctAnswer && q.userAnswer === q.correctAnswer) {
          sc++;
        }
      });
      setScore(sc);
    }
  }, [showResults, questions]);

  // Store exam result in localStorage
  useEffect(() => {
    if (showResults && questions.length > 0) {
      const historyKey = 'aiAptitudeHistory';
      const prev = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const newEntry = {
        topic: selectedTopic,
        score,
        total: questions.length,
        date: new Date().toISOString(),
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userAnswer: q.userAnswer,
          markedForReview: q.markedForReview,
        })),
      };
      localStorage.setItem(historyKey, JSON.stringify([newEntry, ...prev]));
    }
  }, [showResults]);

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
    await generateQuestions(selectedTopic);
  };

  // Status helpers
  const getStatus = (q: Question) => {
    if (q.userAnswer && q.markedForReview) return 'answered-marked';
    if (q.userAnswer) return 'answered';
    if (q.markedForReview) return 'marked';
    return 'not-answered';
  };

  // Timer display
  const min = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const sec = (timeLeft % 60).toString().padStart(2, '0');

  // Start screen
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
          <div className="rounded-card soft-shadow p-8 flex flex-col gap-4 card-interior">
            <div className="heading-hero mb-2">Start Aptitude Exam</div>
            <div className="text-2xl font-medium mb-4" style={{ color: '#5C5C5C' }}>
              Select Topic
            </div>
            <select
              className="w-full border rounded p-2 mb-4"
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
            >
              {TOPICS.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
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
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-lg">Generating questions...</p>
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
        <Button onClick={() => generateQuestions(selectedTopic)} className="w-full">Try Again</Button>
      </div>
    );
  }
  if (showResults) {
    return (
      <Card className="max-w-3xl mx-auto p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-xl font-semibold">Your Score: {score} / {questions.length}</div>
            {questions.map((q, idx) => (
              <div key={idx} className="p-3 border rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Q.{idx + 1}</span>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">MCQ</span>
                  {q.markedForReview && <BookmarkCheck className="w-4 h-4 text-purple-500" />}
                </div>
                <div className="text-gray-700 mb-2">{q.question}</div>
                <div>
                  <span className="font-semibold">Your answer: </span>
                  {q.userAnswer ? `${String.fromCharCode(65 + q.options.indexOf(q.userAnswer))}. ${q.userAnswer}` : <span className="text-gray-400">Not answered</span>}
                  <span className="ml-2 text-xs text-blue-500">(Correct: {String.fromCharCode(65 + q.options.indexOf(q.correctAnswer))}. {q.correctAnswer})</span>
                </div>
              </div>
            ))}
            <Button onClick={() => { setExamStarted(false); setShowResults(false); }} className="w-full mt-4">Take Test Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
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
        {/* Legend */}
        <div className="mt-auto space-y-2 text-xs">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Answered</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Not Answered</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-400 inline-block" /> Marked for review</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-fuchsia-600 inline-block" /> Answered & Marked</div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-8 py-4 bg-gray-50">
          <div className="font-bold text-lg">Q.{currentQuestion + 1}</div>
          <div className="flex items-center gap-4">
            <span className="bg-gray-200 px-3 py-1 rounded text-sm text-black">MCQ</span>
            <span className="bg-purple-100 px-3 py-1 rounded text-purple-700 font-semibold">{min}:{sec}</span>
            <Button variant="destructive" onClick={handleEndTest}>End Test</Button>
          </div>
        </div>
        {/* Question & Answer */}
        <div className="flex-1 flex flex-row">
          {/* Question */}
          <div className="flex-1 flex flex-col justify-center items-center px-8">
            <div className="text-xl font-semibold mb-4">{questions[currentQuestion]?.question}</div>
            {/* MCQ */}
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
          {/* Right Panel */}
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
    </div>
  );
};

export default AptitudeTest; 