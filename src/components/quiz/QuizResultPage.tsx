import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react';

// Question type interface
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
}

interface QuizResultPageProps {
  questions: Question[];
  totalScore: number;
  totalQuestions: number;
  examTitle?: string;
}

const statusColors = {
  Correct: 'bg-green-500 text-white',
  Incorrect: 'bg-red-500 text-white',
  'Not Answered': 'bg-gray-400 text-white',
};

const QuizResultPage: React.FC<QuizResultPageProps> = ({
  questions,
  totalScore,
  totalQuestions,
  examTitle = 'Test paper',
}) => {
  // Section and status filters
  const sections = Array.from(new Set(questions.map(q => q.section)));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Correct' | 'Incorrect' | 'Not Answered'>('All');
  const [currentIdx, setCurrentIdx] = useState(0);

  // Filtered questions for sidebar
  const filteredQuestions = questions.filter(q => {
    const sectionMatch = selectedSection ? q.section === selectedSection : true;
    const statusMatch = statusFilter === 'All' ? true : q.status === statusFilter;
    return sectionMatch && statusMatch;
  });

  // For navigation, show all questions in selected section
  const navQuestions = questions.filter(q =>
    selectedSection ? q.section === selectedSection : true
  );

  // Current question
  const currentQuestion = filteredQuestions[currentIdx] || filteredQuestions[0];

  // Helper for status color
  const getStatusColor = (status: string) => statusColors[status as keyof typeof statusColors] || 'bg-gray-300';

  // Helper for option color
  const getOptionColor = (opt: string, q: Question) => {
    if (q.userAnswer === undefined || q.userAnswer === '') return '';
    if (opt === q.correctAnswer) return 'bg-green-100 border-green-500';
    if (opt === q.userAnswer && q.userAnswer !== q.correctAnswer) return 'bg-red-100 border-red-500';
    return '';
  };

  // Helper for tag color
  const tagColor = (type: string) => {
    switch (type) {
      case 'MCQ': return 'bg-yellow-100 text-yellow-800';
      case 'Aptitude': return 'bg-blue-100 text-blue-800';
      case 'Verbal': return 'bg-purple-100 text-purple-800';
      case 'Difficult': return 'bg-red-100 text-red-800';
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Score percentage
  const percent = Math.round((totalScore / totalQuestions) * 100);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="w-80 bg-gray-800 text-white flex flex-col p-4 gap-4">
        <div className="text-lg font-bold mb-2">{examTitle}</div>
        {/* Section Filters */}
        <div className="mb-4">
          <div className="font-semibold mb-1">Sections</div>
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 py-1 rounded ${selectedSection === null ? 'bg-cyan-600' : 'bg-gray-700'} hover:bg-cyan-700`}
              onClick={() => setSelectedSection(null)}
            >All</button>
            {sections.map(section => (
              <button
                key={section}
                className={`px-3 py-1 rounded ${selectedSection === section ? 'bg-cyan-600' : 'bg-gray-700'} hover:bg-cyan-700`}
                onClick={() => setSelectedSection(section)}
              >{section}</button>
            ))}
          </div>
        </div>
        {/* Status Filters */}
        <div className="mb-4">
          <div className="font-semibold mb-1">Status</div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Correct', 'Incorrect', 'Not Answered'].map(status => (
              <button
                key={status}
                className={`px-3 py-1 rounded ${statusFilter === status ? 'bg-cyan-600' : 'bg-gray-700'} hover:bg-cyan-700`}
                onClick={() => setStatusFilter(status as any)}
              >{status}</button>
            ))}
          </div>
        </div>
        {/* Question Navigation */}
        <div className="mb-2 font-semibold">Questions</div>
        <div className="grid grid-cols-5 gap-2">
          {navQuestions.map((q, idx) => (
            <button
              key={q.id}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${getStatusColor(q.status)} ${filteredQuestions[currentIdx]?.id === q.id ? 'border-yellow-400 scale-110' : 'border-transparent'} hover:scale-105`}
              onClick={() => {
                const filteredIdx = filteredQuestions.findIndex(fq => fq.id === q.id);
                if (filteredIdx !== -1) setCurrentIdx(filteredIdx);
              }}
              title={`Q${q.id}`}
            >
              {q.id}
            </button>
          ))}
        </div>
        {/* Score summary */}
        <div className="mt-6 text-center">
          <div className="text-xl font-bold">Your Score</div>
          <div className="text-3xl font-extrabold text-cyan-400">{totalScore} / {totalQuestions}</div>
          <div className="text-sm text-gray-300">({percent}%)</div>
        </div>
      </div>
      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-start p-8">
        {currentQuestion && (
          <Card className="w-full max-w-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${getStatusColor(currentQuestion.status)}`}>{currentQuestion.id}</span>
                <span className="text-lg font-semibold">{currentQuestion.section}</span>
                <Badge className="ml-2 capitalize">{currentQuestion.topic}</Badge>
              </div>
              <div className="text-lg font-medium mb-4">{currentQuestion.question}</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {currentQuestion.options.map(opt => (
                  <div
                    key={opt}
                    className={`border rounded p-2 flex items-center gap-2 ${getOptionColor(opt, currentQuestion)}`}
                  >
                    <input
                      type="radio"
                      checked={currentQuestion.userAnswer === opt}
                      readOnly
                      className="accent-cyan-600"
                    />
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Correct Answer:</span>
                  <span className="text-green-700 font-bold">{currentQuestion.correctAnswer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Your Answer:</span>
                  <span className={currentQuestion.status === 'Correct' ? 'text-green-700 font-bold' : currentQuestion.status === 'Incorrect' ? 'text-red-700 font-bold' : 'text-gray-500'}>
                    {currentQuestion.userAnswer || 'Not Answered'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Status:</span>
                  <span className={getStatusColor(currentQuestion.status) + ' px-2 py-1 rounded text-sm'}>{currentQuestion.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold">Time Spent:</span>
                  <span>{currentQuestion.timeSpent ? `${currentQuestion.timeSpent} sec` : '-'}</span>
                </div>
              </div>
              <div className="mb-4">
                <span className="font-semibold">Explanation:</span>
                <div className="bg-gray-100 rounded p-3 mt-1 text-gray-700 text-sm">
                  {currentQuestion.explanation || 'No explanation provided.'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${tagColor(currentQuestion.type || '')}`}>Type: {currentQuestion.type || 'MCQ'}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${tagColor(currentQuestion.section)}`}>Section: {currentQuestion.section}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${tagColor(currentQuestion.topic)}`}>Topic: {currentQuestion.topic}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${tagColor(currentQuestion.difficulty || '')}`}>Level: {currentQuestion.difficulty || 'Medium'}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizResultPage; 