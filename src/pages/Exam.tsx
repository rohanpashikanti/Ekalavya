import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ExamPage from '../components/exam/ExamPage';
import DailyChallengeExam from '../components/exam/DailyChallengeExam';
import VerbalAbilityExam from '../components/exam/VerbalAbilityExam';
import { useAuth } from '@/contexts/AuthContext';
import { getUserData, saveUserData } from '@/lib/userData';

const topics = {
  // Quantitative topics
  'arithmetic-1': {
    name: 'Arithmetic Ability-1',
    description: 'Percentages, Profit & Loss, Simple & Compound Interest'
  },
  'arithmetic-2': {
    name: 'Arithmetic Ability-2',
    description: 'Ratio, Time & Work, Speed & Distance, Partnership'
  },
  'number-system': {
    name: 'Number System',
    description: 'Number System, HCF and LCM, Simplification, Averages, Permutation and Combination, Mixture and Alligation'
  },
  // Logical Reasoning topics
  'verbal-reasoning': {
    name: 'Verbal Reasoning',
    description: 'Blood Relations, Seating Arrangement, Directions'
  },
  'analogical-reasoning': {
    name: 'Analogical Reasoning',
    description: 'Analogy, Alphabet Series, Missing Terms,Syllogisms'
  },
  // Verbal Ability
  'verbal-ability': {
    name: 'Verbal Ability',
    description: 'Reading & Comprehension (Reading Comprehension, Cloze Test, Critical Reasoning, Precis Summary), Grammar & Sentence Structure (Para Jumbles, Sentence Correction, Common Grammar Errors, Prepositions, Phrasal Verbs), Vocabulary & Usage (Idioms and Phrases, One Word Substitutions, Synonyms and Antonyms, Confusing Words, Root Words, Prefixes and Suffixes)'
  },
  // Daily Challenge
  'daily-challenge': {
    name: 'Daily Challenge',
    description: 'A comprehensive test covering various aptitude topics including Arithmetic, Logical Reasoning, and more.'
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
      const userData = getUserData(user.uid);

      // Calculate new statistics
      const newTotalQuizzes = userData.totalQuizzes + 1;
      const newTotalScore = userData.totalScore + score;
      const newAvgScore = newTotalScore / newTotalQuizzes;
      const newAvgTime = ((userData.avgTime * userData.totalQuizzes) + timeTaken) / newTotalQuizzes;
      const newBestScore = Math.max(userData.bestScore, score);
      const newAccuracy = ((userData.accuracy * userData.totalQuizzes) + (score / (topicId === 'daily-challenge' ? 25 : 20))) / newTotalQuizzes;

      // Update weekly progress
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const newWeeklyProgress = { ...userData.weeklyProgress, [today]: true };

      // Update streak
      let newCurrentStreak = userData.currentStreak;
      let newBestStreak = userData.bestStreak;
      
      // Check if the last quiz was yesterday
      const lastQuizDate = userData.lastQuizDate;
      const now = new Date();
      
      if (lastQuizDate) {
        const lastDate = new Date(lastQuizDate);
        // Set both dates to midnight for accurate day comparison
        lastDate.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day - increment streak
          newCurrentStreak++;
          newBestStreak = Math.max(newBestStreak, newCurrentStreak);
        } else if (diffDays > 1) {
          // Gap of more than one day - reset streak
          newCurrentStreak = 1;
        }
        // If same day, keep current streak
      } else {
        // First quiz - start streak
        newCurrentStreak = 1;
        newBestStreak = 1;
      }

      // Calculate weekly progress count
      const weeklyProgressCount = Object.values(newWeeklyProgress).filter(Boolean).length;

      // Create new quiz entry
      const newQuizEntry = {
        topic: topic.name,
        score,
        total: topicId === 'daily-challenge' ? 25 : 20,
        timeTaken,
        date: now.toISOString(),
        questions: questions.map(q => ({
          question: q.question,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          markedForReview: q.markedForReview,
          topic: q.topic
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
        lastQuizDate: now.toISOString(),
        quizHistory: [newQuizEntry, ...userData.quizHistory]
      };

      // Save updated data
      saveUserData(user.uid, updatedUserData);

      // Show success message with streak and weekly progress info
      const streakMessage = `Exam results saved! Your streak is now ${newCurrentStreak} days and weekly progress is ${weeklyProgressCount}/7.`;
      alert(streakMessage);
    } catch (error) {
      console.error('Error saving exam results:', error);
      alert('Failed to save exam results. Please try again.');
    }
  };

  if (topicId === 'daily-challenge') {
    return <DailyChallengeExam onComplete={handleExamComplete} />;
  }

  if (topicId === 'verbal-ability') {
    return <VerbalAbilityExam onComplete={handleExamComplete} />;
  }

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