import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ExamPage from '../components/exam/ExamPage';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData, saveUserData } from '@/lib/userData';

const topics = {
  // Quantitative topics
  'arithmetic-1': {
    name: 'Arithmetic Ability-1',
    description: 'Percentage, Profit & Loss, SI & CI'
  },
  'arithmetic-2': {
    name: 'Arithmetic Ability-2',
    description: 'Ratio, Time & Work, Speed & Distance'
  },
  'number-system': {
    name: 'Number System',
    description: 'HCF/LCM, Divisibility, Prime Numbers'
  },
  // Logical Reasoning topics
  'verbal-reasoning': {
    name: 'Verbal Reasoning',
    description: 'Blood Relations, Seating, Directions'
  },
  'analogical-reasoning': {
    name: 'Analogical Reasoning',
    description: 'Analogy, Series, Syllogisms'
  }
};

const Exam: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!topicId || !topics[topicId as keyof typeof topics]) {
    navigate('/quiz');
    return null;
  }

  const topic = topics[topicId as keyof typeof topics];

  const handleExamComplete = async (score: number, timeTaken: number, questions: any[]) => {
    if (!user) return;

    try {
      // Get user's existing data
      const userData = getUserData(user.id);

      // Calculate new statistics
      const newTotalQuizzes = userData.totalQuizzes + 1;
      const newTotalScore = userData.totalScore + score;
      const newAvgScore = newTotalScore / newTotalQuizzes;
      const newAvgTime = ((userData.avgTime * userData.totalQuizzes) + timeTaken) / newTotalQuizzes;
      const newBestScore = Math.max(userData.bestScore, score);
      const newAccuracy = ((userData.accuracy * userData.totalQuizzes) + (score / 20)) / newTotalQuizzes;

      // Update weekly progress
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const newWeeklyProgress = { ...userData.weeklyProgress, [today]: true };

      // Update streak
      let newCurrentStreak = userData.currentStreak;
      let newBestStreak = userData.bestStreak;
      
      // Check if the last quiz was yesterday
      const lastQuizDate = userData.quizHistory[0]?.date;
      if (lastQuizDate) {
        const lastDate = new Date(lastQuizDate);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newCurrentStreak++;
          newBestStreak = Math.max(newBestStreak, newCurrentStreak);
        } else if (diffDays > 1) {
          newCurrentStreak = 1;
        }
      } else {
        newCurrentStreak = 1;
        newBestStreak = 1;
      }

      // Create new quiz entry
      const newQuizEntry = {
        topic: topic.name,
        score,
        total: 20,
        timeTaken,
        date: new Date().toISOString(),
        questions: questions.map(q => ({
          question: q.question,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          markedForReview: q.markedForReview
        }))
      };

      // Update user data
      const updatedUserData = {
        ...userData,
        totalQuizzes: newTotalQuizzes,
        totalScore: newTotalScore,
        avgScore: newAvgScore,
        avgTime: newAvgTime,
        bestScore: newBestScore,
        currentStreak: newCurrentStreak,
        bestStreak: newBestStreak,
        accuracy: newAccuracy,
        weeklyProgress: newWeeklyProgress,
        quizHistory: [newQuizEntry, ...userData.quizHistory]
      };

      // Save updated data
      saveUserData(user.id, updatedUserData);

      // Show success message
      alert('Exam results saved successfully!');
    } catch (error) {
      console.error('Error saving exam results:', error);
      alert('Failed to save exam results. Please try again.');
    }
  };

  return (
    <Layout>
      <ExamPage
        topic={topic.name}
        description={topic.description}
        onComplete={handleExamComplete}
      />
    </Layout>
  );
};

export default Exam; 