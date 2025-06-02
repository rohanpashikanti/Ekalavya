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

const TOTAL_TIME = 25 * 60; // 40 minutes in seconds
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
                <li>Reading Comprehension</li>
                <li>Grammar</li>
                <li>Vocabulary</li>
              </ul>
            </div>
            <div className="text-base mb-4" style={{ color: '#5C5C5C' }}>
              You will get 20 MCQ questions and 40 minutes to complete the exam.
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
              <CardTitle className="text-2xl font-bold text-[#000000]">Verbal Ability Results</CardTitle>
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
                  {q.paragraph && (
                    <div className="text-[#5C5C5C] mb-2 italic">{q.paragraph}</div>
                  )}
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
    <div className="max-w-4xl mx-auto p-6">
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
                  {currentQuestion < READING_COMP_QUESTIONS ? 'Reading Comprehension' :
                   currentQuestion < READING_COMP_QUESTIONS + GRAMMAR_QUESTIONS ? 'Grammar' : 'Vocabulary'}
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
    </div>
  );
};

export default VerbalAbilityExam; 