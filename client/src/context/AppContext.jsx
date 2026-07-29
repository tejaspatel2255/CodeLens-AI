import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState('');
  const [user, setUser] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper: Get active API URL
  const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Initialize Session ID and Custom JWT Auth Listening
  useEffect(() => {
    // 1. Fetch initial local storage guest session as fallback
    let guestSession = localStorage.getItem('codelens_session');
    if (!guestSession) {
      guestSession = crypto.randomUUID();
      localStorage.setItem('codelens_session', guestSession);
    }
    setSessionId(guestSession);

    // 2. Verify active JWT token session on start
    const token = localStorage.getItem('codelens_auth_token');
    if (token) {
      fetch(`${getApiUrl()}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error("Session expired or invalid");
        return res.json();
      })
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setSessionId(data.user.id);
        }
      })
      .catch(err => {
        console.warn("Auth Auto-login Check failed:", err.message);
        localStorage.removeItem('codelens_auth_token');
      });
    }
  }, []);

  // Fetch History from API
  const fetchHistory = async (customSessionId) => {
    const activeSession = customSessionId || sessionId;
    if (!activeSession) return;

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const token = localStorage.getItem('codelens_auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiUrl()}/api/history/${activeSession}`, {
        headers
      });
      
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

  // Delete History Item
  const deleteHistoryItem = async (analysisId) => {
    try {
      const token = localStorage.getItem('codelens_auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${getApiUrl()}/api/history/${analysisId}?sessionId=${encodeURIComponent(sessionId || '')}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete history item');
      }

      // Filter out of local memory state to update UI instantly!
      setHistory(prev => prev.filter(item => item.id !== analysisId));

      // If the currently viewed analysis is the deleted one, clear it from view!
      setCurrentAnalysis(prev => prev && prev.id === analysisId ? null : prev);
      
      return true;
    } catch (err) {
      console.error('Delete History Item Error:', err);
      throw err;
    }
  };

  // Fetch a shared analysis by its DB row ID
  const fetchAnalysisById = async (analysisId) => {
    try {
      const token = localStorage.getItem('codelens_auth_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiUrl()}/api/history/detail/${analysisId}`, { headers });

      
      if (!response.ok) {
        throw new Error('Shared analysis not found or server is offline');
      }
      
      const data = await response.json();
      
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

  // Set active user session
  const authenticateUser = (token, userData) => {
    localStorage.setItem('codelens_auth_token', token);
    setUser(userData);
    setSessionId(userData.id);
  };

  // Sign out user cleanly
  const logout = () => {
    localStorage.removeItem('codelens_auth_token');
    setUser(null);
    // Revert to local storage guest session on sign out
    let localGuest = localStorage.getItem('codelens_session');
    if (!localGuest) {
      localGuest = crypto.randomUUID();
      localStorage.setItem('codelens_session', localGuest);
    }
    setSessionId(localGuest);
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
        user,
        logout,
        authenticateUser,
        currentAnalysis,
        setCurrentAnalysis,
        history,
        setHistory,
        historyLoading,
        historyError,
        fetchHistory,
        fetchAnalysisById,
        deleteHistoryItem,
        sidebarOpen,
        setSidebarOpen,
        getApiUrl
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
