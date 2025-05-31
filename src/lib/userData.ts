export interface UserData {
  totalQuizzes: number;
  totalScore: number;
  avgScore: number;
  avgTime: number;
  bestScore: number;
  currentStreak: number;
  bestStreak: number;
  accuracy: number;
  username: string;
  lastQuizDate: string;
  weeklyProgress: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  quizHistory: Array<{
    topic: string;
    score: number;
    total: number;
    timeTaken: number;
    date: string;
    questions: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      markedForReview: boolean;
    }>;
  }>;
}

export const getUserData = (userId: string): UserData => {
  console.log('Getting user data for ID:', userId);
  const userKey = `user_${userId}`;
  console.log('Using localStorage key:', userKey);
  
  const defaultData = {
    totalQuizzes: 0,
    totalScore: 0,
    avgScore: 0,
    avgTime: 0,
    bestScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    accuracy: 0,
    username: '',
    lastQuizDate: '',
    weeklyProgress: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    quizHistory: []
  };

  const storedData = localStorage.getItem(userKey);
  console.log('Stored data:', storedData);
  
  if (!storedData) {
    console.log('No stored data found, returning default data');
    return defaultData;
  }

  const userData = JSON.parse(storedData);
  console.log('Parsed user data:', userData);

  // Calculate statistics from quiz history
  if (userData.quizHistory && userData.quizHistory.length > 0) {
    console.log('Calculating statistics from quiz history');
    const totalQuizzes = userData.quizHistory.length;
    const totalScore = userData.quizHistory.reduce((sum: number, quiz: any) => sum + quiz.score, 0);
    const totalQuestions = userData.quizHistory.reduce((sum: number, quiz: any) => sum + quiz.total, 0);
    const totalTime = userData.quizHistory.reduce((sum: number, quiz: any) => sum + quiz.timeTaken, 0);
    const bestScore = Math.max(...userData.quizHistory.map((quiz: any) => quiz.score));

    // Update user data with calculated statistics
    userData.totalQuizzes = totalQuizzes;
    userData.totalScore = totalScore;
    userData.avgScore = totalQuizzes > 0 ? (totalScore / totalQuestions) * 100 : 0;
    userData.avgTime = totalQuizzes > 0 ? totalTime / totalQuizzes : 0;
    userData.bestScore = bestScore;
    userData.accuracy = totalQuizzes > 0 ? (totalScore / totalQuestions) * 100 : 0;

    // Calculate streak
    const sortedQuizzes = [...userData.quizHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let bestStreak = userData.bestStreak || 0;
    let lastDate = null;

    for (const quiz of sortedQuizzes) {
      const quizDate = new Date(quiz.date);
      quizDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        currentStreak = 1;
        lastDate = quizDate;
        continue;
      }

      const diffDays = Math.floor((lastDate.getTime() - quizDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (diffDays > 1) {
        break;
      }
      
      lastDate = quizDate;
    }

    userData.currentStreak = currentStreak;
    userData.bestStreak = bestStreak;

    // Update weekly progress
    const today = new Date();
    const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if we need to reset weekly progress (new week)
    const lastQuizDate = userData.lastQuizDate ? new Date(userData.lastQuizDate) : null;
    if (lastQuizDate) {
      const lastWeek = lastQuizDate.getWeek();
      const currentWeek = today.getWeek();
      
      if (lastWeek !== currentWeek) {
        userData.weeklyProgress = defaultData.weeklyProgress;
      }
    }

    // Update current day's progress
    if (userData.quizHistory.some((quiz: any) => {
      const quizDate = new Date(quiz.date);
      return quizDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === currentDay;
    })) {
      userData.weeklyProgress[currentDay] = true;
    }

    // Save the updated data back to localStorage
    saveUserData(userId, userData);
    console.log('Updated and saved user data:', userData);
  }

  return userData;
};

// Add TypeScript declaration for getWeek method
declare global {
  interface Date {
    getWeek(): number;
  }
}

// Add helper function to get week number
Date.prototype.getWeek = function() {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const saveUserData = (userId: string, data: UserData): void => {
  const userKey = `user_${userId}`;
  localStorage.setItem(userKey, JSON.stringify(data));
};

export const getWeeklyProgress = (userId: string): number => {
  const userData = getUserData(userId);
  return Object.values(userData.weeklyProgress).filter(Boolean).length;
};

export const getRecentQuizzes = (userId: string, limit: number = 5) => {
  const userData = getUserData(userId);
  return userData?.quizHistory.slice(0, limit) || [];
};

export const analyzeUserPerformance = (userId: string) => {
  const userData = getUserData(userId);
  const recentQuizzes = userData.quizHistory;

  // Analyze performance by topic
  const topicPerformance = {
    Quantitative: { total: 0, correct: 0, weakAreas: new Set<string>() },
    Logical: { total: 0, correct: 0, weakAreas: new Set<string>() },
    Verbal: { total: 0, correct: 0, weakAreas: new Set<string>() },
    'General Knowledge': { total: 0, correct: 0, weakAreas: new Set<string>() }
  };

  // Analyze performance by question type
  const questionTypePerformance = {
    'Number Series': { total: 0, correct: 0 },
    'Percentage and Ratios': { total: 0, correct: 0 },
    'Time and Work': { total: 0, correct: 0 },
    'Speed and Distance': { total: 0, correct: 0 },
    'Profit and Loss': { total: 0, correct: 0 },
    'Averages': { total: 0, correct: 0 },
    'Simple and Compound Interest': { total: 0, correct: 0 },
    'Mixtures and Alligations': { total: 0, correct: 0 },
    'Geometry': { total: 0, correct: 0 },
    'Probability': { total: 0, correct: 0 }
  };

  recentQuizzes.forEach(quiz => {
    const topic = quiz.topic;
    if (topicPerformance[topic]) {
      topicPerformance[topic].total += quiz.total;
      topicPerformance[topic].correct += quiz.score;

      // Analyze individual questions to find weak areas
      quiz.questions.forEach(q => {
        if (q.userAnswer !== q.correctAnswer) {
          // Extract question type from the question text
          const questionType = extractQuestionType(q.question);
          if (questionType) {
            topicPerformance[topic].weakAreas.add(questionType);
            if (questionTypePerformance[questionType]) {
              questionTypePerformance[questionType].total++;
              if (q.userAnswer === q.correctAnswer) {
                questionTypePerformance[questionType].correct++;
              }
            }
          }
        }
      });
    }
  });

  // Calculate accuracy for each topic
  Object.keys(topicPerformance).forEach(topic => {
    const perf = topicPerformance[topic];
    perf.accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
  });

  // Calculate accuracy for each question type
  Object.keys(questionTypePerformance).forEach(type => {
    const perf = questionTypePerformance[type];
    perf.accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
  });

  return {
    topicPerformance,
    questionTypePerformance,
    weakAreas: getWeakAreas(topicPerformance, questionTypePerformance)
  };
};

const extractQuestionType = (question: string): string | null => {
  const typeKeywords = {
    'Number Series': ['series', 'sequence', 'next number', 'missing number'],
    'Percentage and Ratios': ['percentage', 'ratio', 'proportion'],
    'Time and Work': ['time', 'work', 'days', 'hours'],
    'Speed and Distance': ['speed', 'distance', 'time', 'km/h'],
    'Profit and Loss': ['profit', 'loss', 'cost price', 'selling price'],
    'Averages': ['average', 'mean', 'median'],
    'Simple and Compound Interest': ['interest', 'rate', 'principal', 'compound'],
    'Mixtures and Alligations': ['mixture', 'alligation', 'ratio'],
    'Geometry': ['triangle', 'circle', 'square', 'rectangle', 'area', 'perimeter'],
    'Probability': ['probability', 'chance', 'likely', 'unlikely']
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => question.toLowerCase().includes(keyword.toLowerCase()))) {
      return type;
    }
  }

  return null;
};

const getWeakAreas = (topicPerformance: any, questionTypePerformance: any) => {
  const weakAreas = {
    topics: [] as string[],
    questionTypes: [] as string[]
  };

  // Find weak topics (accuracy < 60%)
  Object.entries(topicPerformance).forEach(([topic, perf]: [string, any]) => {
    if (perf.accuracy < 60) {
      weakAreas.topics.push(topic);
    }
  });

  // Find weak question types (accuracy < 60%)
  Object.entries(questionTypePerformance).forEach(([type, perf]: [string, any]) => {
    if (perf.accuracy < 60) {
      weakAreas.questionTypes.push(type);
    }
  });

  return weakAreas;
}; 