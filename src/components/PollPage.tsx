import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, Home, Users, CheckCircle } from 'lucide-react';
import { PollService } from '../services/pollService';
import { PollWithOptions, VoteData } from '../lib/supabase';

interface PollResults {
  option_id: string;
  option_text: string;
  vote_count: number;
}

interface PollVoteDetails {
  option_id: string;
  option_text: string;
  voters: { name?: string; email?: string; created_at: string }[];
}

const PollPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<PollWithOptions | null>(null);
  const [results, setResults] = useState<PollResults[]>([]);
  const [voteDetails, setVoteDetails] = useState<PollVoteDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [emailAlreadyVoted, setEmailAlreadyVoted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voterName, setVoterName] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [showVoterDetails, setShowVoterDetails] = useState(false);

  useEffect(() => {
    if (id) {
      loadPoll();
      loadResults();
      loadVoteDetails();
      
      // Subscribe to real-time updates
      const subscription = PollService.subscribeToVotes(id, () => {
        loadResults();
        loadVoteDetails();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id]);

  const loadPoll = async () => {
    if (!id) return;
    
    const pollData = await PollService.getPollById(id);
    setPoll(pollData);
    setLoading(false);
  };

  const loadResults = async () => {
    if (!id) return;
    
    const resultsData = await PollService.getPollResults(id);
    setResults(resultsData);
  };

  const loadVoteDetails = async () => {
    if (!id) return;
    
    const voteDetailsData = await PollService.getPollVoteDetails(id);
    setVoteDetails(voteDetailsData);
  };

  const checkEmailVoted = async (email: string) => {
    if (!id || !email.trim()) return;
    
    const hasVoted = await PollService.hasEmailVoted(id, email.trim());
    setEmailAlreadyVoted(hasVoted);
  };

  const handleEmailChange = (email: string) => {
    setVoterEmail(email);
    if (poll?.require_name_email && email.trim()) {
      checkEmailVoted(email.trim());
    } else {
      setEmailAlreadyVoted(false);
    }
  };
  const handleOptionChange = (optionId: string) => {
    if (!poll) return;

    if (poll.allow_multiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poll || !id || selectedOptions.length === 0 || voting || emailAlreadyVoted) return;

    // Validate required fields
    if (poll.require_name_email && !voterEmail.trim()) {
      alert('Please fill in your email address.');
      return;
    }

    setVoting(true);

    try {
      // Submit votes for each selected option
      const votePromises = selectedOptions.map(optionId => {
        const voteData: VoteData = {
          poll_id: id,
          option_id: optionId,
          name: poll.require_name_email && voterName.trim() ? voterName.trim() : undefined,
          email: poll.require_name_email ? voterEmail.trim() : undefined,
        };
        return PollService.submitVote(voteData);
      });

      const results = await Promise.all(votePromises);
      const allSuccessful = results.every(result => result);

      if (allSuccessful) {
        setHasVoted(true);
        setSelectedOptions([]);
        setVoterName('');
        setVoterEmail('');
        loadResults(); // Refresh results
        loadVoteDetails(); // Refresh vote details
      } else {
        alert('Failed to submit vote. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      if (error instanceof Error && error.message.includes('unique_poll_email_vote')) {
        alert('This email address has already voted on this poll.');
        setEmailAlreadyVoted(true);
      } else {
        alert('Failed to submit vote. Please try again.');
      }
    } finally {
      setVoting(false);
    }
  };

  const getTotalVotes = () => {
    return results.reduce((total, result) => total + result.vote_count, 0);
  };

  const getPercentage = (voteCount: number) => {
    const total = getTotalVotes();
    return total > 0 ? Math.round((voteCount / total) * 100) : 0;
  };

  const formatVoterInfo = (voter: { name?: string; email?: string; created_at: string }) => {
    const parts = [];
    if (voter.name) parts.push(voter.name);
    if (voter.email) parts.push(voter.email);
    const voterInfo = parts.length > 0 ? parts.join(' - ') : 'Anonymous';
    const date = new Date(voter.created_at).toLocaleDateString();
    return `${voterInfo} (${date})`;
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Poll Not Found</h1>
          <p className="text-gray-600 mb-6">The poll you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Pollify</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <Home className="w-4 h-4 mr-1" />
            Go Home
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Voting Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {poll.question}
            </h2>

            {poll.active && !hasVoted && !emailAlreadyVoted ? (
              <form onSubmit={handleSubmitVote} className="space-y-6">
                {/* Voter Information */}
                {poll.require_name_email && (
                  <div className="space-y-4 pb-4 border-b border-gray-200">
                    <div>
                      <label htmlFor="voterName" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        id="voterName"
                        value={voterName}
                        onChange={(e) => setVoterName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="voterEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        id="voterEmail"
                        value={voterEmail}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                          emailAlreadyVoted ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {emailAlreadyVoted && (
                        <p className="text-red-600 text-sm mt-1">
                          This email address has already voted on this poll.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    {poll.allow_multiple ? 'Select all that apply:' : 'Select one option:'}
                  </p>
                  {poll.pollify_poll_options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type={poll.allow_multiple ? 'checkbox' : 'radio'}
                        name="pollOption"
                        value={option.id}
                        checked={selectedOptions.includes(option.id)}
                        onChange={() => handleOptionChange(option.id)}
                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-800">{option.option_text}</span>
                    </label>
                  ))}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={selectedOptions.length === 0 || voting || emailAlreadyVoted}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {voting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting Vote...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5 mr-2" />
                      Submit Vote
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                {hasVoted || emailAlreadyVoted ? (
                  <div className="text-green-600">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {hasVoted ? 'Thank you for voting!' : 'Already Voted'}
                    </h3>
                    <p className="text-gray-600">
                      {hasVoted ? 'Your vote has been recorded.' : 'This email has already voted on this poll.'}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Poll Closed</h3>
                    <p>This poll is no longer accepting votes.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">
                Live Results
              </h3>
              {poll.require_name_email && voteDetails.length > 0 && (
                <button
                  onClick={() => setShowVoterDetails(!showVoterDetails)}
                  className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  {showVoterDetails ? 'Hide Details' : 'Show Who Voted'}
                </button>
              )}
            </div>

            {results.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Total votes: {getTotalVotes()}
                </div>
                
                {results.map((result) => (
                  <div key={result.option_id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">
                        {result.option_text}
                      </span>
                      <span className="text-sm text-gray-600">
                        {result.vote_count} votes ({getPercentage(result.vote_count)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getPercentage(result.vote_count)}%` }}
                      ></div>
                    </div>
                    
                    {/* Show voter details if enabled */}
                    {showVoterDetails && poll.require_name_email && (
                      <div className="mt-2 ml-4">
                        {voteDetails
                          .find(detail => detail.option_id === result.option_id)
                          ?.voters.map((voter, index) => (
                            <div key={index} className="text-xs text-gray-500 py-1">
                              • {formatVoterInfo(voter)}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                <p>No votes yet. Be the first to vote!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollPage;