import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Plus, Trash2, Users, Mail } from 'lucide-react';
import { PollService } from '../services/pollService';

interface PollOption {
  id: string;
  text: string;
}

const LandingPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [requireNameEmail, setRequireNameEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const addOption = () => {
    const newOption: PollOption = {
      id: Date.now().toString(),
      text: ''
    };
    setOptions([...options, newOption]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const validOptions = options.filter(opt => opt.text.trim()).map(opt => opt.text.trim());
      
      const result = await PollService.createPoll(
        question.trim(),
        validOptions,
        allowMultiple,
        requireNameEmail
      );
      
      if (result) {
        // Navigate to the poll page
        navigate(`/poll/${result.pollId}`);
      } else {
        alert('Failed to create poll. Please try again.');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = question.trim() && options.filter(opt => opt.text.trim()).length >= 2;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <BarChart3 className="w-12 h-12 text-indigo-600 mr-3" />
          <h1 className="text-5xl font-bold text-gray-800">Pollify</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create beautiful, shareable polls in seconds. Get real-time results and engage your audience instantly.
        </p>
      </div>

      {/* Create Poll Form */}
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Create Your Poll
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poll Question */}
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Poll Question
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your favorite programming language?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          {/* Poll Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Poll Options
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {index + 1}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addOption}
              className="mt-3 flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option
            </button>
          </div>

          {/* Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Poll Settings</h3>
            
            {/* Allow Multiple Selections */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-500 mr-2" />
                <div>
                  <label htmlFor="allowMultiple" className="text-sm font-medium text-gray-700">
                    Allow Multiple Selections
                  </label>
                  <p className="text-xs text-gray-500">
                    Let users choose more than one option
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="allowMultiple"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Require Name/Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-500 mr-2" />
                <div>
                  <label htmlFor="requireNameEmail" className="text-sm font-medium text-gray-700">
                    Require Name/Email
                  </label>
                  <p className="text-xs text-gray-500">
                    Collect voter information for better insights
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="requireNameEmail"
                  checked={requireNameEmail}
                  onChange={(e) => setRequireNameEmail(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Poll...
              </>
            ) : (
              'Create Poll'
            )}
          </button>
        </form>
      </div>

      {/* Features Section */}
      <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Real-time Results</h3>
          <p className="text-gray-600">Watch votes come in live with beautiful, interactive charts</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Easy Sharing</h3>
          <p className="text-gray-600">Share your polls instantly with a simple link</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Sign-up Required</h3>
          <p className="text-gray-600">Create and participate in polls without any registration</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;