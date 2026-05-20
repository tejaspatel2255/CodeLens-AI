import { useState } from 'react';

export const useGenerate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async (question, language) => {
    if (!question || !question.trim()) {
      setError('Please provide a question or constraints for code generation.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, language }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'An unexpected server error occurred.');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('UseGenerate Hook Error:', err);
      setError(err.message || 'Failed to generate code. Please check your server connection.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generate,
    setError
  };
};
