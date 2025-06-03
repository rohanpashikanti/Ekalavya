import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiApiKey = 'AIzaSyDSNKVFGhfCCX6Onx5b8NEyk38qTH-YRXg';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, difficulty = 'intermediate', quizType = 'full', userId } = await req.json();
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's quiz history
    const { data: userQuizzes, error: historyError } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Error fetching user history:', historyError);
    }

    // Analyze user performance
    const { questionTypes: weakAreas, recentPerformance } = analyzeUserPerformance(userQuizzes || []);

    // Adjust difficulty based on recent performance
    let adjustedDifficulty = difficulty;
    if (weakAreas.length > 0) {
      const avgRecentPerformance = Array.from(recentPerformance.values()).reduce((a, b) => a + b, 0) / recentPerformance.size;
      if (avgRecentPerformance < 40) {
        adjustedDifficulty = 'beginner';
      } else if (avgRecentPerformance > 80) {
        adjustedDifficulty = 'advanced';
      }
    }

    console.log(`Generating quiz for topic: ${topic}, adjusted difficulty: ${adjustedDifficulty}, type: ${quizType}`);
    console.log('User weak areas:', weakAreas);

    // Special prompt for daily challenge
    if (quizType === 'exam' && topic === 'daily-challenge') {
      const dailyPrompt = `Generate 25 multiple choice questions covering all aptitude topics:
        - Quantitative Aptitude (6 questions):
          * Arithmetic (Percentage, Profit & Loss, Simple & Compound Interest)
          * Number System (Divisibility, HCF/LCM, Prime Numbers)
          * Algebra and Data Interpretation
        - Logical Reasoning (6 questions):
          * Verbal Reasoning (Blood Relations, Directions, Seating Arrangements)
          * Puzzles (Floor based, Month/Year based)
          * Coding-Decoding and Number Series
        - Verbal Ability (6 questions):
          * Reading Comprehension
          * Grammar and Vocabulary
          * Sentence Correction and Completion
        - General Knowledge (7 questions):
          * Current Affairs and Important Events
          * History, Geography, and Science
          * Sports, Awards, and Personalities
          * Indian Constitution and Polity

        Difficulty level: ${adjustedDifficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}
        For each weak area, include at least 2 questions.
        Ensure questions are appropriate for the user's current skill level.
        Include real-world scenarios and practical applications where possible.
        Mix easy, medium, and hard questions based on the difficulty level.

        Important:
        - Each question must have exactly one correct answer
        - All options must be distinct and valid
        - Include clear explanations for each answer
        - For coding-decoding questions:
          * Ensure the coding pattern is consistent and logical
          * Provide clear rules for encoding/decoding
          * Avoid ambiguous or multiple possible interpretations
          * Include step-by-step explanations
        - For number system questions:
          * Ensure all calculations are accurate
          * Provide clear step-by-step solutions
          * Avoid ambiguous or unclear questions
          * Include proper explanations for each step
        - For logical reasoning questions:
          * Ensure logical consistency
          * Provide clear reasoning steps
          * Avoid ambiguous scenarios
          * Include detailed explanations
        - For verbal ability questions:
          * Ensure grammar and vocabulary are accurate
          * Provide clear context
          * Avoid ambiguous language
          * Include proper explanations`;

      const fullPrompt = `${dailyPrompt}

      Return ONLY a valid JSON array with exactly 25 questions. Each question should have this exact format:
      {
        "question_text": "Question here?",
        "option_a": "Option A",
        "option_b": "Option B", 
        "option_c": "Option C",
        "option_d": "Option D",
        "correct_answer": "A",
        "explanation": "Brief explanation of the correct answer",
        "topic": "One of: Quantitative, Logical, Verbal, General"
      }

      Important: 
      - Return ONLY the JSON array, no additional text or markdown formatting
      - Ensure exactly 25 questions
      - Make questions challenging but fair for ${adjustedDifficulty} level
      - Provide clear, concise explanations
      - Correct answer should be A, B, C, or D (not option_a, option_b, etc.)
      - Include more questions from the user's weak areas
      - Vary the difficulty based on user's performance in each area
      - Ensure proper distribution of questions across topics
      - Each question must have exactly one correct answer
      - All options must be distinct and valid
      - Avoid ambiguous or unclear questions
      - Ensure questions test understanding, not just memorization
      - For coding-decoding questions:
        * Ensure the coding pattern is consistent and logical
        * Provide clear rules for encoding/decoding
        * Avoid ambiguous or multiple possible interpretations
        * Include step-by-step explanations
      - For number system questions:
        * Ensure all calculations are accurate
        * Provide clear step-by-step solutions
        * Avoid ambiguous or unclear questions
        * Include proper explanations for each step
      - For logical reasoning questions:
        * Ensure logical consistency
        * Provide clear reasoning steps
        * Avoid ambiguous scenarios
        * Include detailed explanations
      - For verbal ability questions:
        * Ensure grammar and vocabulary are accurate
        * Provide clear context
        * Avoid ambiguous language
        * Include proper explanations`;

      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      console.log('Generated text:', generatedText);

      // Parse the JSON response with better error handling
      let questions;
      try {
        // Clean the response to extract JSON
        let jsonString = generatedText;
        
        // Remove markdown code blocks if present
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Find the first [ and last ]
        const jsonStart = jsonString.indexOf('[');
        const jsonEnd = jsonString.lastIndexOf(']') + 1;
        
        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('No valid JSON array found in response');
        }
        
        jsonString = jsonString.substring(jsonStart, jsonEnd);
        
        // Fix common JSON issues
        jsonString = jsonString.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        
        questions = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse questions:', parseError);
        console.error('Raw text:', generatedText);
        throw new Error('Failed to parse generated questions');
      }

      // Validate we have 25 questions
      if (!Array.isArray(questions) || questions.length !== 25) {
        throw new Error(`Expected 25 questions, got ${questions?.length || 0}`);
      }

      // Validate question structure and topic distribution
      const topicCounts = {
        Quantitative: 0,
        Logical: 0,
        Verbal: 0,
        General: 0
      };

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer || !q.explanation || !q.topic) {
          throw new Error(`Question ${i + 1} is missing required fields`);
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
          throw new Error(`Question ${i + 1} has invalid correct_answer: ${q.correct_answer}`);
        }
        if (!topicCounts.hasOwnProperty(q.topic)) {
          throw new Error(`Question ${i + 1} has invalid topic: ${q.topic}`);
        }
        topicCounts[q.topic]++;
      }

      // Validate topic distribution
      if (topicCounts.Quantitative < 5 || topicCounts.Logical < 5 || 
          topicCounts.Verbal < 5 || topicCounts.General < 5) {
        throw new Error('Invalid topic distribution in questions');
      }

      // Create a new quiz in the database
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          topic: 'daily-challenge',
          difficulty: adjustedDifficulty,
          quiz_type: 'exam',
          total_questions: 25,
        })
        .select()
        .single();

      if (quizError) {
        console.error('Quiz creation error:', quizError);
        throw new Error(`Failed to create quiz: ${quizError.message}`);
      }

      // Insert questions
      const questionsToInsert = questions.map((q: any) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        topic: q.topic
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Questions insertion error:', questionsError);
        throw new Error(`Failed to save questions: ${questionsError.message}`);
      }

      console.log(`Successfully created daily challenge exam ${quiz.id} with 25 questions`);

      return new Response(JSON.stringify({ 
        quiz_id: quiz.id,
        questions: questions 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Define prompts for different topics with personalized focus
    const topicPrompts = {
      'quantitative': `Generate 20 multiple choice questions on Quantitative Aptitude covering topics like:
        - Arithmetic Operations
        - Percentages and Ratios
        - Time and Work
        - Speed and Distance
        - Profit and Loss
        - Averages
        - Simple and Compound Interest
        - Mixtures and Alligations
        - Geometry
        - Probability
        Difficulty level: ${difficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}
        
        Important:
        - Each question must have exactly one correct answer
        - All options must be distinct and valid
        - Include clear explanations for each answer
        - Ensure questions test understanding, not just memorization
        - Avoid ambiguous or unclear questions
        - For number system questions:
          * Ensure all calculations are accurate
          * Provide clear step-by-step solutions
          * Avoid ambiguous or unclear questions
          * Include proper explanations for each step`,
      
      'logical': `Generate 20 multiple choice questions on Logical Reasoning covering topics like:
        - Verbal Reasoning (Blood Relations, Directions, Seating Arrangements)
        - Puzzles (Floor based, Month/Year based)
        - Coding-Decoding and Number Series
        - Syllogisms and Analogies
        Difficulty level: ${adjustedDifficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}
        
        Important:
        - Each question must have exactly one correct answer
        - All options must be distinct and valid
        - Include clear explanations for each answer
        - For coding-decoding questions:
          * Ensure the coding pattern is consistent and logical
          * Provide clear rules for encoding/decoding
          * Avoid ambiguous or multiple possible interpretations
          * Include step-by-step explanations
        - For logical reasoning questions:
          * Ensure logical consistency
          * Provide clear reasoning steps
          * Avoid ambiguous scenarios
          * Include detailed explanations`,
      
      'verbal': `Generate 20 multiple choice questions on Verbal Ability covering topics like:
        - Reading Comprehension
        - Grammar and Vocabulary
        - Sentence Correction and Completion
        - Para jumbles and Critical Reasoning
        Difficulty level: ${adjustedDifficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}
        For each weak area, include at least 3 questions.
        Ensure questions are appropriate for the user's current skill level.
        Include real-world scenarios and practical applications where possible.`,
      
      'general': `Generate 20 multiple choice questions on General Knowledge covering topics like:
        - Current Affairs and Important Events
        - History, Geography, and Science
        - Sports, Awards, and Personalities
        - Indian Constitution and Polity
        Difficulty level: ${adjustedDifficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}
        For each weak area, include at least 3 questions.
        Ensure questions are appropriate for the user's current skill level.
        Include real-world scenarios and practical applications where possible.`,

      // Specific topic prompts
      'arithmetic-1': `Generate 20 multiple choice questions on Arithmetic Ability-1 covering:
        - Speed Math, Percentage, Fraction, Decimal
        - Averages, Profit & Loss, Discount
        - Simple Interest and Compound Interest
        Difficulty level: ${difficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}`,
      
      'arithmetic-2': `Generate 20 multiple choice questions on Arithmetic Ability-2 covering:
        - Ratio, Proportion, Partnership
        - Ages, Time and Work
        - Pipes and Cisterns, Time Speed Distance
        Difficulty level: ${difficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}`,
      
      'number-system': `Generate 20 multiple choice questions on Number System covering:
        - Properties of Numbers, Division Rules
        - Prime Factorization, HCF and LCM
        - Remainders and Trailing Zeroes
        - Number Series and Sequences
        - Base Systems and Conversions
        - Divisibility Rules
        - Factors and Multiples
        - Number Properties (Even, Odd, Prime, Composite)
        - Modular Arithmetic
        - Number Patterns
        Difficulty level: ${difficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}
        
        Important:
        - Each question must have exactly one correct answer
        - All options must be distinct and valid
        - Include clear explanations for each answer
        - Ensure questions test understanding, not just memorization
        - Avoid ambiguous or unclear questions`,
      
      'verbal-reasoning': `Generate 20 multiple choice questions on Verbal Reasoning covering:
        - Directions and Distance
        - Blood Relations
        - Seating Arrangements (Circular, Linear)
        - Coding Decoding (Letter, Number, Mixed)
        - Logical Deduction
        - Syllogisms
        - Statement and Arguments
        - Statement and Assumptions
        - Statement and Conclusions
        - Cause and Effect
        Difficulty level: ${difficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}
        
        Important:
        - Each question must have exactly one correct answer
        - All options must be distinct and valid
        - Include clear explanations for each answer
        - For coding-decoding questions:
          * Keep the questions simple and straightforward
          * Use basic letter/number patterns (e.g., A+1=B, 1+1=2)
          * Avoid complex or multi-step patterns
          * Use common words and simple numbers
          * Provide clear examples before the question
          * Make the pattern obvious and easy to spot
          * Include step-by-step explanations
        - Ensure questions test understanding, not just memorization`,
      
      'analogical-reasoning': `Generate 20 multiple choice questions on Analogical and Abductive Reasoning covering:
        - Analogy and Classification
        - Number Series
        - Syllogisms
        - Venn diagrams and conclusions
        - Logical Deduction
        - Pattern Recognition
        - Relationship Analysis
        - Similarity and Difference
        - Cause and Effect
        - Logical Sequence
        Difficulty level: ${difficulty}
        Focus more on these weak areas: ${weakAreas.join(', ')}`
    };

    const prompt = topicPrompts[topic as keyof typeof topicPrompts] || topicPrompts.quantitative;

    const fullPrompt = `${prompt}

    Return ONLY a valid JSON array with exactly 20 questions. Each question should have this exact format:
    {
      "question_text": "Question here?",
      "option_a": "Option A",
      "option_b": "Option B", 
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_answer": "A",
      "explanation": "Brief explanation of the correct answer"
    }

    Important: 
    - Return ONLY the JSON array, no additional text or markdown formatting
    - Ensure exactly 20 questions
    - Make questions challenging but fair for ${difficulty} level
    - Provide clear, concise explanations
    - Correct answer should be A, B, C, or D (not option_a, option_b, etc.)
    - Include more questions from the user's weak areas
    - Vary the difficulty based on user's performance in each area
    - Each question must have exactly one correct answer
    - All options must be distinct and valid
    - Avoid ambiguous or unclear questions
    - Ensure questions test understanding, not just memorization
    - For coding-decoding questions:
      * Keep the questions simple and straightforward
      * Use basic letter/number patterns (e.g., A+1=B, 1+1=2)
      * Avoid complex or multi-step patterns
      * Use common words and simple numbers
      * Provide clear examples before the question
      * Make the pattern obvious and easy to spot
      * Include step-by-step explanations
    - For number system questions:
      * Ensure all calculations are accurate
      * Provide clear step-by-step solutions
      * Avoid ambiguous or unclear questions
      * Include proper explanations for each step`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    console.log('Generated text:', generatedText);

    // Parse the JSON response with better error handling
    let questions;
    try {
      // Clean the response to extract JSON
      let jsonString = generatedText;
      
      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Find the first [ and last ]
      const jsonStart = jsonString.indexOf('[');
      const jsonEnd = jsonString.lastIndexOf(']') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON array found in response');
      }
      
      jsonString = jsonString.substring(jsonStart, jsonEnd);
      
      // Fix common JSON issues
      jsonString = jsonString.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      
      questions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse questions:', parseError);
      console.error('Raw text:', generatedText);
      throw new Error('Failed to parse generated questions');
    }

    // Validate we have 20 questions
    if (!Array.isArray(questions) || questions.length !== 20) {
      throw new Error(`Expected 20 questions, got ${questions?.length || 0}`);
    }

    // Validate question structure
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer || !q.explanation) {
        throw new Error(`Question ${i + 1} is missing required fields`);
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        throw new Error(`Question ${i + 1} has invalid correct_answer: ${q.correct_answer}`);
      }
    }

    // Create a new quiz in the database
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        topic: topic,
        difficulty: adjustedDifficulty,
        quiz_type: quizType,
        total_questions: 20,
      })
      .select()
      .single();

    if (quizError) {
      console.error('Quiz creation error:', quizError);
      throw new Error(`Failed to create quiz: ${quizError.message}`);
    }

    // Insert questions
    const questionsToInsert = questions.map((q: any) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Questions insertion error:', questionsError);
      throw new Error(`Failed to save questions: ${questionsError.message}`);
    }

    console.log(`Successfully created quiz ${quiz.id} with 20 questions`);

    return new Response(JSON.stringify({ 
      quiz_id: quiz.id,
      questions: questions 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate quiz' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to analyze user performance
const analyzeUserPerformance = (quizzes: any[]) => {
  const questionTypePerformance: { [key: string]: { total: number; correct: number; lastAttempts: number[] } } = {};
  const weakAreas = new Set<string>();
  const recentPerformance = new Map<string, number>();

  // Sort quizzes by date to get most recent first
  const sortedQuizzes = [...quizzes].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sortedQuizzes.forEach(quiz => {
    quiz.questions.forEach((q: any) => {
      const questionType = extractQuestionType(q.question_text);
      if (questionType) {
        if (!questionTypePerformance[questionType]) {
          questionTypePerformance[questionType] = { 
            total: 0, 
            correct: 0,
            lastAttempts: []
          };
        }
        questionTypePerformance[questionType].total++;
        if (q.user_answer === q.correct_answer) {
          questionTypePerformance[questionType].correct++;
        }
        // Track last 5 attempts for each question type
        questionTypePerformance[questionType].lastAttempts.push(
          q.user_answer === q.correct_answer ? 1 : 0
        );
        if (questionTypePerformance[questionType].lastAttempts.length > 5) {
          questionTypePerformance[questionType].lastAttempts.shift();
        }
      }
    });
  });

  // Calculate accuracy and identify weak areas
  Object.entries(questionTypePerformance).forEach(([type, perf]) => {
    const overallAccuracy = (perf.correct / perf.total) * 100;
    const recentAccuracy = perf.lastAttempts.length > 0 
      ? (perf.lastAttempts.reduce((a, b) => a + b, 0) / perf.lastAttempts.length) * 100
      : 0;
    
    // Store recent performance for difficulty adjustment
    recentPerformance.set(type, recentAccuracy);

    // Consider an area weak if either overall or recent performance is poor
    if (overallAccuracy < 60 || recentAccuracy < 50) {
      weakAreas.add(type);
    }
  });

  return {
    questionTypes: Array.from(weakAreas),
    recentPerformance
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
