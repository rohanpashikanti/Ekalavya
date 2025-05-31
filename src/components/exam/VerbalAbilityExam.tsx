import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, BookmarkCheck } from 'lucide-react';
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

const TOTAL_TIME = 40 * 60; // 40 minutes in seconds
const TOTAL_QUESTIONS = 20;
const READING_COMP_QUESTIONS = 8;
const GRAMMAR_QUESTIONS = 6;
const VOCABULARY_QUESTIONS = 6;

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
      
      const prompt = `Generate a Verbal Ability exam with the following structure:

1. Reading Comprehension (8 questions total):
   - Generate 2 different paragraphs, each followed by 4 questions
   - Each paragraph should be 150-200 words long
   - Questions should test understanding, inference, and critical analysis
   - Format for each paragraph section:
     {
       "paragraph": "the reading passage",
       "questions": [
         {
           "question": "question text",
           "options": ["option1", "option2", "option3", "option4"],
           "correctAnswer": "correct option text",
           "type": "mcq"
         }
         // 4 questions per paragraph
       ]
     }

2. Grammar (6 questions):
   - Verb tenses
   - Sentence correction
   - Subject-verb agreement
   - Parts of speech
   Format: {
     "question": "question text",
     "options": ["option1", "option2", "option3", "option4"],
     "correctAnswer": "correct option text",
     "type": "mcq"
   }

3. Vocabulary (6 questions):
   - Synonyms and antonyms
   - Word meanings
   - Contextual usage
   Format: {
     "question": "question text",
     "options": ["option1", "option2", "option3", "option4"],
     "correctAnswer": "correct option text",
     "type": "mcq"
   }

Return a JSON object with this structure:
{
  "readingComprehension": [paragraph1, paragraph2],
  "grammar": [6 grammar questions],
  "vocabulary": [6 vocabulary questions]
}

Each question should:
- Be beginner to intermediate difficulty
- Have 4 options
- Include clear explanations
- Be unique and challenging

Return ONLY a valid JSON object, no other text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response text to ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const parsedData = JSON.parse(cleanedText);
        
        // Combine all questions into a single array
        const allQuestions: Question[] = [
          // Reading Comprehension questions
          ...parsedData.readingComprehension.flatMap((section: ReadingComprehension) => 
            section.questions.map(q => ({
              ...q,
              paragraph: section.paragraph,
              userAnswer: '',
              markedForReview: false
            }))
          ),
          // Grammar questions
          ...parsedData.grammar.map((q: Question) => ({
            ...q,
            userAnswer: '',
            markedForReview: false
          })),
          // Vocabulary questions
          ...parsedData.vocabulary.map((q: Question) => ({
            ...q,
            userAnswer: '',
            markedForReview: false
          }))
        ];
        
        setQuestions(allQuestions);
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
          handleEndTest();
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

  if (!examStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Card className="w-full max-w-md p-6 bg-gray-800/50 backdrop-blur-lg border border-gray-700">
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/quiz'}
                className="w-fit border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-400"
              >
                ← Back to Quiz
              </Button>
              <CardTitle className="text-2xl font-bold text-white">Verbal Ability Exam</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-gray-400">
              <p>This exam covers:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Reading Comprehension</li>
                <li>Grammar</li>
                <li>Vocabulary</li>
              </ul>
            </div>
            <div className="mb-4 text-gray-400">You will get {TOTAL_QUESTIONS} MCQ questions and {TOTAL_TIME / 60} minutes to complete the test.</div>
            <Button 
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              onClick={handleStartExam}
            >
              Start Exam
            </Button>
          </CardContent>
        </Card>
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
        <Button onClick={generateQuestions} className="w-full">Try Again</Button>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <Card className="max-w-3xl mx-auto p-6 bg-gray-800/50 backdrop-blur-lg border border-gray-700">
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="w-fit border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-400"
              >
                ← Back to Dashboard
              </Button>
              <CardTitle className="text-2xl font-bold text-white">Exam Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-xl font-semibold text-white">Your Score: {score} / {questions.length}</div>
              {questions.map((q, idx) => (
                <div key={idx} className="p-3 border border-gray-700 rounded bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">Q.{idx + 1}</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">MCQ</span>
                    {q.markedForReview && <BookmarkCheck className="w-4 h-4 text-purple-500" />}
                  </div>
                  <div className="text-gray-300 mb-2">{q.question}</div>
                  <div>
                    <span className="font-semibold text-gray-400">Your answer: </span>
                    {q.userAnswer ? (
                      <span className="text-gray-300">
                        {String.fromCharCode(65 + q.options.indexOf(q.userAnswer))}. {q.userAnswer}
                      </span>
                    ) : (
                      <span className="text-gray-500">Not answered</span>
                    )}
                    <span className="ml-2 text-xs text-blue-400">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white mb-2">End Test</DialogTitle>
            <DialogDescription className="text-gray-400">
              <div className="space-y-6">
                <p className="text-base">Are you sure you want to end the test? You cannot return to the test once ended.</p>
                
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
                          <span className="text-green-400 font-semibold">{getAttemptedCount()}</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Questions Attempted</p>
                          <p className="text-lg font-semibold text-green-400">{getAttemptedCount()} / {questions.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                          <span className="text-red-400 font-semibold">{getRemainingCount()}</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Questions Remaining</p>
                          <p className="text-lg font-semibold text-red-400">{getRemainingCount()} / {questions.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center">
                        <span className="text-purple-400 font-semibold text-sm">{min}:{sec}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Time Remaining</p>
                        <p className="text-lg font-semibold text-purple-400">{min}:{sec}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={handleCancelEndTest}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-400"
            >
              Continue Test
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmEndTest}
              className="flex-1"
            >
              End Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col h-screen">
        <div className="flex-1 flex flex-row">
          <div className="w-64 border-r border-gray-700 bg-gray-800/50 p-4">
            <div className="mb-4">
              <div className="text-sm font-medium mb-2 text-gray-300">Time Left: {min}:{sec}</div>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleNav(idx)}
                    className={`p-2 text-sm rounded ${
                      idx === currentQuestion
                        ? 'bg-blue-500 text-white'
                        : getStatus(q) === 'answered'
                        ? 'bg-green-900/50 text-green-400'
                        : getStatus(q) === 'marked'
                        ? 'bg-purple-900/50 text-purple-400'
                        : getStatus(q) === 'answered-marked'
                        ? 'bg-purple-900/50 text-purple-400'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-purple-500 hover:text-purple-400"
                onClick={toggleMarkForReview}
              >
                {questions[currentQuestion]?.markedForReview ? 'Unmark for Review' : 'Mark for Review'}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleEndTest}
              >
                End Test
              </Button>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-700 px-8 py-4 bg-gray-800/50">
              <div className="font-bold text-lg text-white">Q.{currentQuestion + 1}</div>
              <div className="flex items-center gap-4">
                <span className="bg-gray-700 px-3 py-1 rounded text-sm text-gray-300">MCQ</span>
                <span className="bg-purple-900/50 px-3 py-1 rounded text-purple-400 font-semibold">{min}:{sec}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center px-8 bg-gray-900/50">
              {questions[currentQuestion]?.paragraph && (
                <div className="w-full max-w-3xl mb-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="text-gray-300 leading-relaxed">{questions[currentQuestion].paragraph}</div>
                </div>
              )}
              <div className="text-xl font-semibold mb-4 text-white">{questions[currentQuestion]?.question}</div>
              {questions[currentQuestion]?.options && (
                <div className="space-y-2 w-full max-w-md">
                  {questions[currentQuestion].options.map((opt, i) => (
                    <Button
                      key={i}
                      variant={questions[currentQuestion].userAnswer === opt ? 'default' : 'outline'}
                      className={`w-full text-left h-auto min-h-[48px] py-3 px-4 whitespace-normal ${
                        questions[currentQuestion].userAnswer === opt
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                      }`}
                      onClick={() => handleMCQ(opt)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-semibold shrink-0">{String.fromCharCode(65 + i)}.</span>
                        <span className="text-left">{opt}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex justify-between w-full max-w-md mt-8">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-400"
                  onClick={() => handleNav(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  ← Previous
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-cyan-400 hover:text-cyan-400"
                  onClick={() => handleNav(Math.min(questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === questions.length - 1}
                >
                  Next →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerbalAbilityExam; 