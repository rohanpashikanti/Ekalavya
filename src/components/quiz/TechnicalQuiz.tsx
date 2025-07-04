import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const TOPICS = [
  'Python Basics',
  'Data Types & Type Casting',
  'Control Flow (if, for, while)',
  'Functions & Recursion',
  'Object-Oriented Programming',
  'Exception Handling',
  'File Handling',
  'Python Libraries (NumPy, Pandas)',
  'List & Dictionary Comprehensions',
  'Lambda, Map, Filter, Reduce',
  'Iterators & Generators',
  'Regular Expressions',
  'Modules & Packages',
  'Decorators & Closures',
  'Data Structures in Python (List, Dict, Set, Tuple)',
  'Algorithms (Searching, Sorting)',
  'Time & Space Complexity in Python',
  'Mock Interviews: Python Coding',
  'Debugging & Code Tracing',
  'Placement-focused MCQs'
];

const TechnicalQuiz = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex-1 max-w-4xl mx-auto py-8">
        <h1 className="heading-hero mb-2">Technical Quiz</h1>
        <div className="text-2xl font-medium mb-8" style={{ color: '#5C5C5C' }}>Choose your technical assessment type</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theory Section */}
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow rounded-card soft-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-[#B6EADA]" />
                <CardTitle className="text-2xl">Theory Exam</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-[#5C5C5C]">
                  Test your Python knowledge with 20 MCQ questions covering essential programming concepts and best practices.
                </p>
                <div className="space-y-2 text-sm text-[#5C5C5C]">
                  <div>• 20 Multiple Choice Questions</div>
                  <div>• 40 Minutes Time Limit</div>
                  <div>• Python-focused Topics</div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-[#1A1A1A]">Topics Covered:</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#5C5C5C]">
                    {TOPICS.map((topic, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B6EADA]"></span>
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full category-btn active mt-4"
                  onClick={() => navigate('/technical')}
                >
                  Start Theory Exam
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Coding Section */}
          <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow rounded-card soft-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Code className="w-6 h-6 text-[#F6C6EA]" />
                <CardTitle className="text-2xl">Coding Exam</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-[#5C5C5C]">
                  Put your Python coding skills to the test with 5 practical programming challenges.
                </p>
                <div className="space-y-2 text-sm text-[#5C5C5C]">
                  <div>• 5 Coding Questions</div>
                  <div>• 60 Minutes Time Limit</div>
                  <div>• Real-time Code Execution & Testing</div>
                  <div>• Python-specific Problems</div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-[#1A1A1A]">Focus Areas:</h3>
                  <div className="grid grid-cols-1 gap-2 text-xs text-[#5C5C5C]">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F6C6EA]"></span>
                      Data Structures & Algorithms
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F6C6EA]"></span>
                      Problem Solving & Optimization
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F6C6EA]"></span>
                      Code Quality & Best Practices
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full category-btn active mt-4"
                  onClick={() => navigate('/technical')}
                >
                  Start Coding Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TechnicalQuiz; 