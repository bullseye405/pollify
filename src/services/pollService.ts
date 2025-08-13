import { supabase, Poll, PollOption, Vote, PollWithOptions, VoteData } from '../lib/supabase';

export class PollService {
  // Create a new poll with options
  static async createPoll(
    question: string,
    options: string[],
    allowMultiple: boolean = false,
    requireNameEmail: boolean = true
  ): Promise<{ poll: Poll; pollId: string } | null> {
    try {
      // Insert poll
      const { data: pollData, error: pollError } = await supabase
        .from('pollify_polls')
        .insert({
          question,
          allow_multiple: allowMultiple,
          require_name_email: requireNameEmail,
          active: true
        })
        .select()
        .single();

      if (pollError) {
        console.error('Error creating poll:', pollError);
        return null;
      }

      // Insert poll options
      const optionsData = options.map(option => ({
        poll_id: pollData.id,
        option_text: option
      }));

      const { error: optionsError } = await supabase
        .from('pollify_poll_options')
        .insert(optionsData);

      if (optionsError) {
        console.error('Error creating poll options:', optionsError);
        return null;
      }

      return { poll: pollData, pollId: pollData.id };
    } catch (error) {
      console.error('Error in createPoll:', error);
      return null;
    }
  }

  // Get poll by ID with options
  static async getPollById(pollId: string): Promise<PollWithOptions | null> {
    try {
      const { data, error } = await supabase
        .from('pollify_polls')
        .select(`
          *,
          pollify_poll_options (*)
        `)
        .eq('id', pollId)
        .single();

      if (error) {
        console.error('Error fetching poll:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPollById:', error);
      return null;
    }
  }

  // Get all polls
  static async getAllPolls(): Promise<Poll[]> {
    try {
      const { data, error } = await supabase
        .from('pollify_polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching polls:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllPolls:', error);
      return [];
    }
  }

  // Submit a vote
  static async submitVote(voteData: VoteData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pollify_votes')
        .insert(voteData);

      if (error) {
        console.error('Error submitting vote:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in submitVote:', error);
      return false;
    }
  }

  // Get votes for a poll with aggregated results
  static async getPollResults(pollId: string): Promise<{ option_id: string; option_text: string; vote_count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('pollify_votes')
        .select(`
          option_id,
          pollify_poll_options!inner (
            option_text
          )
        `)
        .eq('poll_id', pollId);

      if (error) {
        console.error('Error fetching poll results:', error);
        return [];
      }

      // Aggregate vote counts
      const voteCounts: { [key: string]: { option_text: string; count: number } } = {};
      
      data?.forEach(vote => {
        const optionId = vote.option_id;
        const optionText = (vote.pollify_poll_options as any).option_text;
        
        if (!voteCounts[optionId]) {
          voteCounts[optionId] = { option_text: optionText, count: 0 };
        }
        voteCounts[optionId].count++;
      });

      return Object.entries(voteCounts).map(([option_id, data]) => ({
        option_id,
        option_text: data.option_text,
        vote_count: data.count
      }));
    } catch (error) {
      console.error('Error in getPollResults:', error);
      return [];
    }
  }

  // Toggle poll active status
  static async togglePollStatus(pollId: string, active: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pollify_polls')
        .update({ active })
        .eq('id', pollId);

      if (error) {
        console.error('Error toggling poll status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in togglePollStatus:', error);
      return false;
    }
  }

  // Subscribe to real-time vote updates
  static subscribeToVotes(pollId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`votes-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pollify_votes',
          filter: `poll_id=eq.${pollId}`
        },
        callback
      )
      .subscribe();
  }
}