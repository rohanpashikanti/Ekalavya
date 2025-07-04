import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Bookmark, BookmarkCheck, Play, CheckCircle2, XCircle } from 'lucide-react';
import EndTestDialog from './EndTestDialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import TabSwitchDialog from './TabSwitchDialog';
import useTabSwitchDetection from '@/hooks/useTabSwitchDetection';
import Editor from '@monaco-editor/react';

interface Question {
  topic: string;
  question: string;
  options: string[];
  answer: string;
  userAnswer?: string;
  markedForReview?: boolean;
  testResults?: {
    passed: boolean;
    output: string;
    expected: string;
  }[];
}

const PYTHON_QUIZ = [
  {
    topic: "Functions & Recursion",
    question: `
def mystery(x, y=[]):
    y.append(x)
    return y

print(mystery(1))
print(mystery(2))
    `,
    options: [
      "[1] and [2]",
      "[1] and [1, 2]",
      "[1] and [1]",
      "[2] and [1, 2]"
    ],
    answer: "[1] and [1, 2]"
  },
  {
    topic: "List Comprehension",
    question: `
result = [x**2 for x in range(5) if x % 2 == 0]
print(result)
    `,
    options: [
      "[0, 1, 4, 9, 16]",
      "[0, 2, 4]",
      "[0, 4, 16]",
      "[1, 9]"
    ],
    answer: "[0, 4, 16]"
  },
  {
    topic: "Lambda & Map",
    question: `
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
print(doubled)
    `,
    options: [
      "[1, 2, 3, 4]",
      "[2, 4, 6, 8]",
      "[1, 4, 9, 16]",
      "[2, 3, 4, 5]"
    ],
    answer: "[2, 4, 6, 8]"
  },
  {
    topic: "String Operations",
    question: `
text = "hello"
print(text[::-1])
    `,
    options: [
      "olleh",
      "hello",
      "hlo",
      "Syntax Error"
    ],
    answer: "olleh"
  },
  {
    topic: "Exception Handling",
    question: `
try:
    print(5 / 0)
except ZeroDivisionError:
    print("Error!")
    `,
    options: [
      "0",
      "5",
      "Error!",
      "ZeroDivisionError"
    ],
    answer: "Error!"
  }
];

const TOTAL_TIME = 60 * 60; // 60 minutes in seconds

const TechnicalCodingExam = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [examStarted, setExamStarted] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [score, setScore] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const editorRef = useRef<any>(null);

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

  const initializeExam = () => {
    setQuestions(PYTHON_QUIZ.map(q => ({ ...q, userAnswer: '', markedForReview: false })));
    setCurrentQuestion(0);
    setShowResults(false);
    setTimeLeft(TOTAL_TIME);
    setScore(0);
  };

  // Timer logic
  useEffect(() => {
    if (!examStarted || showResults || loading || error) return;
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

  // Score calculation
  useEffect(() => {
    if (showResults) {
      let sc = 0;
      questions.forEach(q => {
        if (q.userAnswer === q.answer) {
          sc++;
        }
      });
      setScore(sc);
    }
  }, [showResults, questions]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setQuestions(qs => qs.map((q, i) => i === currentQuestion ? { ...q, userAnswer: value } : q));
    }
  };

  const runTests = async () => {
    if (!editorRef.current) return;
    
    setRunningTests(true);
    const code = editorRef.current.getValue();
    const question = questions[currentQuestion];
    
    try {
      // Create a function from the user's code
      const userFunction = new Function('return ' + code)();
      const result = userFunction();
      const resultStr = String(result);
      
      const passed = resultStr === question.answer;
      
      setQuestions(prevQuestions => {
        const newQuestions = [...prevQuestions];
        newQuestions[currentQuestion] = {
          ...newQuestions[currentQuestion],
          testResults: [{
            passed,
            output: resultStr,
            expected: question.answer
          }],
          userAnswer: code
        };
        return newQuestions;
      });

    } catch (error) {
      console.error('Error running tests:', error);
      setQuestions(prevQuestions => {
        const newQuestions = [...prevQuestions];
        newQuestions[currentQuestion] = {
          ...newQuestions[currentQuestion],
          testResults: [{
            passed: false,
            output: error instanceof Error ? error.message : 'Error',
            expected: question.answer
          }],
          userAnswer: code
        };
        return newQuestions;
      });
    } finally {
      setRunningTests(false);
    }
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

  const handleStartExam = () => {
    setExamStarted(true);
    initializeExam();
  };

  const getStatus = (q: Question) => {
    if (q.testResults?.[0]?.passed && q.markedForReview) return 'answered-marked';
    if (q.testResults?.[0]?.passed) return 'answered';
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
            ← Back to Technical Quiz
          </button>
          <div className="rounded-card soft-shadow p-8 flex flex-col gap-4 card-interior">
            <div className="heading-hero mb-2">Python Coding Quiz</div>
            <div className="text-2xl font-medium mb-4" style={{ color: '#5C5C5C' }}>
              Test Your Python Knowledge
            </div>
            <div className="text-base mb-4" style={{ color: '#5C5C5C' }}>
              You will get 5 Python coding questions and 60 minutes to complete the test.
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
        <p className="text-[#000000] text-lg font-medium mt-4">Loading questions...</p>
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
        <Button onClick={initializeExam} className="w-full">Try Again</Button>
      </div>
    );
  }

  if (showResults) {
    return (
      <Card className="max-w-4xl mx-auto p-6">
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
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{q.topic}</span>
                  {q.markedForReview && <BookmarkCheck className="w-4 h-4 text-purple-500" />}
                </div>
                <div className="text-gray-700 mb-2">{q.question}</div>
                <div className="mb-2">
                  <span className="font-semibold">Status: </span>
                  {q.testResults?.[0]?.passed ? (
                    <span className="text-green-500">Correct</span>
                  ) : (
                    <span className="text-red-500">Incorrect</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Your answer:</span>
                    <span className="font-mono">{q.testResults?.[0]?.output || 'Not attempted'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Correct answer:</span>
                    <span className="font-mono">{q.answer}</span>
                  </div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#B6EADA] via-[#E1DDFC] to-[#F6C6EA] p-4 exam-content">
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-2">Question Navigator</h2>
            <div className="text-sm text-gray-600 mb-4">
              Topic: <span className="font-semibold text-black">{questions[currentQuestion]?.topic}</span>
            </div>
            <div className="text-sm text-gray-600">
              Time Left: <span className="font-semibold text-black">{min}:{sec}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {questions.map((q, idx) => {
              let color = '';
              if (getStatus(q) === 'answered') color = 'bg-[#B6EADA] text-black';
              else if (getStatus(q) === 'not-answered') color = 'bg-[#E1DDFC] text-black';
              else if (getStatus(q) === 'marked') color = 'bg-[#F6C6EA] text-black';
              else if (getStatus(q) === 'answered-marked') color = 'bg-[#FFD966] text-black';
              return (
                <button
                  key={idx}
                  className={`w-full p-3 rounded-lg flex items-center justify-center font-bold border-2 transition-all ${
                    currentQuestion === idx ? 'border-black scale-105' : 'border-transparent'
                  } ${color} hover:scale-100`}
                  onClick={() => handleNav(idx)}
                  title={`Q${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-auto space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#B6EADA] inline-block" />
              <span>Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E1DDFC] inline-block" />
              <span>Not Attempted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F6C6EA] inline-block" />
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FFD966] inline-block" />
              <span>Correct & Marked</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Question {currentQuestion + 1}</h1>
              <span className="bg-[#E1DDFC] px-3 py-1 rounded-full text-sm font-medium">{questions[currentQuestion]?.topic}</span>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleEndTest}
              className="bg-red-500 hover:bg-red-600"
            >
              End Test
            </Button>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="text-xl font-semibold mb-4">{questions[currentQuestion]?.question}</div>
            
            {/* Code Editor */}
            <div className="h-[400px] mb-6 border rounded-lg overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="python"
                value={questions[currentQuestion]?.userAnswer || questions[currentQuestion]?.question}
                onChange={handleCodeChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Test Results */}
            {questions[currentQuestion]?.testResults && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Test Results:</h3>
                <div className="space-y-2">
                  {questions[currentQuestion].testResults.map((test, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {test.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div className="font-mono text-sm">
                        {test.passed ? 'Correct' : 'Incorrect'}
                        {!test.passed && (
                          <div className="text-red-500">
                            Expected: {test.expected}, Got: {test.output}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={toggleMarkForReview}
              className="flex items-center gap-2 bg-[#E1DDFC] hover:bg-[#F6C6EA]"
            >
              {questions[currentQuestion].markedForReview ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  Marked for Review
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Mark for Review
                </>
              )}
            </Button>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
                disabled={currentQuestion === 0}
                className="bg-[#E1DDFC] hover:bg-[#F6C6EA]"
              >
                Previous
              </Button>
              <Button
                onClick={runTests}
                disabled={runningTests}
                className="bg-[#B6EADA] hover:bg-[#9ED7C5] text-black flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {runningTests ? 'Running...' : 'Run Code'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(q => Math.min(questions.length - 1, q + 1))}
                disabled={currentQuestion === questions.length - 1}
                className="bg-[#E1DDFC] hover:bg-[#F6C6EA]"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <EndTestDialog
        isOpen={showEndDialog}
        onClose={() => setShowEndDialog(false)}
        onConfirm={handleConfirmEndTest}
        attemptedQuestions={questions.filter(q => q.testResults?.[0]?.passed).length}
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

export default TechnicalCodingExam; 