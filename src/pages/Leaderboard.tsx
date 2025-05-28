import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Medal, Trophy, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Get user profiles with their quiz statistics
      const profilesRef = collection(db, 'user_stats');
      const q = query(profilesRef, orderBy('total_score', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);

      const leaderboardData = querySnapshot.docs.map((doc, index) => ({
        user_id: doc.id,
        ...doc.data(),
        rank: index + 1,
        avgScore: doc.data().total_quizzes > 0 
          ? Math.round((doc.data().total_score / (doc.data().total_quizzes * 20)) * 100) 
          : 0
      }));

      setLeaderboard(leaderboardData);

      // Find current user's rank
      const currentUserRank = leaderboardData.find(item => item.user_id === user?.uid)?.rank;
      setUserRank(currentUserRank || null);

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 2:
        return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
      case 3:
        return 'from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'from-gray-800/50 to-gray-800/30 border-gray-700';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-white">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-gray-400">Top performers in aptitude tests</p>
          </div>
          {userRank && (
            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
              Your Rank: #{userRank}
            </Badge>
          )}
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 2nd Place */}
            <Card className={`bg-gradient-to-br ${getRankColor(2)} order-1 md:order-1`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  {getRankIcon(2)}
                </div>
                <CardTitle className="text-white text-lg">
                  {leaderboard[1]?.displayName || 'Anonymous'}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Silver Medal
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {leaderboard[1]?.total_score}
                </div>
                <div className="text-sm text-gray-300">
                  {leaderboard[1]?.avgScore}% avg • {leaderboard[1]?.total_quizzes} quizzes
                </div>
              </CardContent>
            </Card>

            {/* 1st Place */}
            <Card className={`bg-gradient-to-br ${getRankColor(1)} order-2 md:order-2 md:-mt-4`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  {getRankIcon(1)}
                </div>
                <CardTitle className="text-white text-xl">
                  {leaderboard[0]?.displayName || 'Anonymous'}
                </CardTitle>
                <CardDescription className="text-yellow-300">
                  Champion
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {leaderboard[0]?.total_score}
                </div>
                <div className="text-sm text-gray-300">
                  {leaderboard[0]?.avgScore}% avg • {leaderboard[0]?.total_quizzes} quizzes
                </div>
              </CardContent>
            </Card>

            {/* 3rd Place */}
            <Card className={`bg-gradient-to-br ${getRankColor(3)} order-3 md:order-3`}>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  {getRankIcon(3)}
                </div>
                <CardTitle className="text-white text-lg">
                  {leaderboard[2]?.displayName || 'Anonymous'}
                </CardTitle>
                <CardDescription className="text-amber-300">
                  Bronze Medal
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {leaderboard[2]?.total_score}
                </div>
                <div className="text-sm text-gray-300">
                  {leaderboard[2]?.avgScore}% avg • {leaderboard[2]?.total_quizzes} quizzes
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Full Rankings
            </CardTitle>
            <CardDescription className="text-gray-400">
              Complete leaderboard of all participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No participants yet. Be the first to take a quiz!
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((participant) => (
                  <div 
                    key={participant.user_id} 
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      participant.user_id === user?.uid 
                        ? 'bg-cyan-600/20 border border-cyan-500/30' 
                        : 'bg-gray-700/30 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {getRankIcon(participant.rank)}
                      </div>
                      <div>
                        <div className={`font-semibold ${participant.user_id === user?.uid ? 'text-cyan-400' : 'text-white'}`}>
                          {participant.displayName || 'Anonymous'}
                          {participant.user_id === user?.uid && (
                            <Badge variant="outline" className="ml-2 border-cyan-500 text-cyan-400">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {participant.total_quizzes} quizzes
                          </span>
                          <span>Streak: {participant.current_streak}</span>
                          <span>Best: {participant.max_streak}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {participant.total_score}
                      </div>
                      <div className="text-sm text-gray-400">
                        {participant.avgScore}% avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard; 