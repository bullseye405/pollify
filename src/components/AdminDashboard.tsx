import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Activity, ToggleLeft, ToggleRight } from 'lucide-react';
import { PollService } from '../services/pollService';
import { Poll } from '../lib/supabase';

interface PollStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  topPoll: { question: string; votes: number } | null;
}

const AdminDashboard: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [stats, setStats] = useState<PollStats>({
    totalPolls: 0,
    activePolls: 0,
    totalVotes: 0,
    topPoll: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const pollsData = await PollService.getAllPolls();
      setPolls(pollsData);

      // Calculate stats
      const totalPolls = pollsData.length;
      const activePolls = pollsData.filter(poll => poll.active).length;
      
      // Get vote counts for each poll
      const pollVoteCounts = await Promise.all(
        pollsData.map(async (poll) => {
          const results = await PollService.getPollResults(poll.id);
          const voteCount = results.reduce((total, result) => total + result.vote_count, 0);
          return { poll, voteCount };
        })
      );

      const totalVotes = pollVoteCounts.reduce((total, item) => total + item.voteCount, 0);
      const topPollData = pollVoteCounts.reduce((top, current) => 
        current.voteCount > (top?.voteCount || 0) ? current : top
      , null);

      setStats({
        totalPolls,
        activePolls,
        totalVotes,
        topPoll: topPollData ? {
          question: topPollData.poll.question,
          votes: topPollData.voteCount
        } : null
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const togglePollStatus = async (pollId: string, currentStatus: boolean) => {
    const success = await PollService.togglePollStatus(pollId, !currentStatus);
    if (success) {
      // Refresh data
      loadDashboardData();
    } else {
      alert('Failed to update poll status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <p className="text-xl text-gray-600">
            Manage your polls and monitor engagement
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Polls</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalPolls}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Polls</p>
                <p className="text-3xl font-bold text-green-600">{stats.activePolls}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalVotes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Poll Votes</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.topPoll?.votes || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Polls Management */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Manage Polls
          </h2>

          {polls.length > 0 ? (
            <div className="space-y-4">
              {polls.map((poll) => (
                <div
                  key={poll.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {poll.question}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Created: {new Date(poll.created_at).toLocaleDateString()}</span>
                      <span>Multiple: {poll.allow_multiple ? 'Yes' : 'No'}</span>
                      <span>Requires Info: {poll.require_name_email ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      poll.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {poll.active ? 'Active' : 'Inactive'}
                    </span>
                    
                    <button
                      onClick={() => togglePollStatus(poll.id, poll.active)}
                      className="flex items-center text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      {poll.active ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                    
                    <a
                      href={`/poll/${poll.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      View Poll
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No polls created yet</p>
              <p className="text-sm">Create your first poll to get started!</p>
            </div>
          )}
        </div>

        {/* Top Poll Section */}
        {stats.topPoll && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🏆 Most Popular Poll
            </h2>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {stats.topPoll.question}
              </h3>
              <p className="text-purple-600 font-medium">
                {stats.topPoll.votes} total votes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;