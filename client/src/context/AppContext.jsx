import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize Session ID
  useEffect(() => {
    let session = localStorage.getItem('codelens_session');
    if (!session) {
      session = crypto.randomUUID();
      localStorage.setItem('codelens_session', session);
    }
    setSessionId(session);
  }, []);

  // Fetch History from API
  const fetchHistory = async (customSessionId) => {
    const activeSession = customSessionId || sessionId;
    if (!activeSession) return;

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/history/${activeSession}`);
      
      if (!response.ok) {
        throw new Error('Failed to retrieve history logs');
      }
      
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('Fetch History Error:', err);
      setHistoryError(err.message || 'Unable to load history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch a shared analysis by its DB row ID
  const fetchAnalysisById = async (analysisId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/history/detail/${analysisId}`);
      
      if (!response.ok) {
        throw new Error('Shared analysis not found or server is offline');
      }
      
      const data = await response.json();
      
      // Parse JSONB structures if they come as strings, but supabase-js generally returns parsed objects
      const formattedAnalysis = {
        id: data.id,
        language: data.language,
        summary: data.summary,
        steps: typeof data.steps === 'string' ? JSON.parse(data.steps) : data.steps,
        bugs: typeof data.bugs === 'string' ? JSON.parse(data.bugs) : data.bugs,
        optimizations: typeof data.optimizations === 'string' ? JSON.parse(data.optimizations) : data.optimizations,
        concepts: typeof data.concepts === 'string' ? JSON.parse(data.concepts) : data.concepts,
        flow: data.flow,
        original_code: data.original_code,
        created_at: data.created_at
      };

      return formattedAnalysis;
    } catch (err) {
      console.error('Fetch Shared Analysis Error:', err);
      throw err;
    }
  };

  // Trigger history fetch when session becomes active
  useEffect(() => {
    if (sessionId) {
      fetchHistory(sessionId);
    }
  }, [sessionId]);

  return (
    <AppContext.Provider
      value={{
        sessionId,
        currentAnalysis,
        setCurrentAnalysis,
        history,
        setHistory,
        historyLoading,
        historyError,
        fetchHistory,
        fetchAnalysisById,
        sidebarOpen,
        setSidebarOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
