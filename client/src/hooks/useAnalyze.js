import { useState } from 'react';
import { useApp } from '../context/AppContext';

export const useAnalyze = () => {
  const { sessionId, setCurrentAnalysis, fetchHistory } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async (code, language) => {
    if (!code || !code.trim()) {
      setError('Please provide code to analyze.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, sessionId, language }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'An unexpected server error occurred.');
      }

      const data = await response.json();
      
      // Inject original_code into the response since server returns parsed JSON from Groq,
      // and having original_code is useful for editor restores
      const enrichedData = {
        original_code: code,
        ...data
      };

      setCurrentAnalysis(enrichedData);
      
      // Refresh the session history
      if (sessionId) {
        fetchHistory(sessionId);
      }
      
      return enrichedData;
    } catch (err) {
      console.error('UseAnalyze Hook Error:', err);
      setError(err.message || 'Failed to analyze code. Please check your server connection.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    analyze,
    setError
  };
};
