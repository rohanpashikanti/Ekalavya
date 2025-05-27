# Ekalavya

A modern, comprehensive aptitude examination platform built with React, TypeScript, and Supabase. Test your skills across multiple categories with AI-generated questions and track your progress with detailed analytics.

## 🚀 Features

- **User Authentication**: Secure login/signup with Supabase (email/password & magic links)
- **AI-Powered Quizzes**: Dynamic question generation using Google Gemini AI
- **Performance Tracking**: Detailed analytics with streak tracking and progress charts
- **Multiple Categories**: Quantitative, Logical Reasoning, Verbal Ability, and General Knowledge
- **Leaderboards**: Global rankings and competitive scoring
- **Responsive Design**: Modern dark theme with neon accents
- **Real-time Updates**: Live progress tracking and instant feedback

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast development
- **TailwindCSS** for styling
- **React Router DOM** for navigation
- **TanStack Query** for data fetching
- **Orbitron Font** for futuristic aesthetics

### Backend & Database
- **Supabase** for authentication and real-time features
- **MongoDB Atlas** with Mongoose ODM for data storage
- **Node.js + Express** API layer (planned)

### AI Integration
- **Google Gemini AI** for dynamic question generation

## 📦 Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd aptitude-exam-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `GEMINI_API_KEY`: Google Gemini AI API key

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:8080](http://localhost:8080) to view the application.

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Copy your project URL and anon key to `.env`
3. Configure email templates for magic link authentication
4. Set up RLS policies for your database tables

### MongoDB Setup

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user and get the connection string
3. Add the connection string to your `.env` file

### Gemini AI Setup

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the key to your `.env` file as `GEMINI_API_KEY`

## 🏗 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout components (Header, Sidebar)
│   └── ui/              # Base UI components (shadcn/ui)
├── contexts/            # React contexts (Auth)
├── hooks/               # Custom React hooks
├── pages/               # Main application pages
│   ├── auth/           # Authentication pages
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Quiz.tsx        # Quiz interface
│   ├── History.tsx     # Quiz history
│   ├── Leaderboard.tsx # Global rankings
│   └── Profile.tsx     # User profile
├── lib/                # Utility functions
└── types/              # TypeScript type definitions
```

## 🎨 Design System

### Colors
- **Primary**: Cyan (#06B6D4) to Purple (#8B5CF6) gradients
- **Background**: Dark gray (#0F172A) with purple accents
- **Text**: White and gray variations
- **Accents**: Neon cyan, purple, and gradient combinations

### Typography
- **Primary Font**: Orbitron (futuristic, technical aesthetic)
- **Weight Range**: 400-900 for hierarchy

### Components
- Glass-morphism cards with backdrop blur
- Neon border effects on interactive elements
- Smooth transitions and hover animations
- Responsive grid layouts

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured layout with sidebar navigation
- **Tablet**: Adapted layout with collapsible sidebar
- **Mobile**: Touch-friendly interface with bottom navigation

## 🔐 Authentication Flow

1. **Registration**: Email/password signup with email verification
2. **Login**: Standard login or magic link authentication
3. **Profile Creation**: Automatic MongoDB user profile creation
4. **Protected Routes**: AuthGuard component protects authenticated pages
5. **Session Management**: Persistent login state with Supabase

## 📊 Data Models

### User Profile (MongoDB)
```javascript
{
  supabase_uid: String,
  email: String,
  createdAt: Date,
  streak: Number,
  maxStreak: Number,
  totalQuizzes: Number,
  totalCorrect: Number,
  categoryStats: Array
}
```

## 🚦 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for authentication and real-time features
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [shadcn/ui](https://ui.shadcn.com) for beautiful component primitives
- [Lucide React](https://lucide.dev) for consistent iconography
- [Google Fonts](https://fonts.google.com) for Orbitron typography

---

Built with ❤️ using modern web technologies for the best user experience.
