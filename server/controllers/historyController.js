import { supabase } from '../lib/supabase.js';

export const getHistory = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('code_analyses')
      .select('*')
      .eq('user_session', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('History Controller Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while fetching analysis history.' });
  }
};

export const getAnalysisById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Analysis ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('code_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Fetch Analysis by ID Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while fetching the shared analysis.' });
  }
};
