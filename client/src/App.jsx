import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import HistorySidebar from './components/HistorySidebar';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import History from './pages/History';
import Generate from './pages/Generate';
import Auth from './pages/Auth';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="relative min-h-screen bg-background text-textMain flex flex-col overflow-x-hidden max-w-full">
          {/* Global Navigation Header Bar */}
          <Navbar />
          
          {/* Global History Sliding Drawer */}
          <HistorySidebar />

          {/* Content container mounting active routes */}
          <main className="flex-grow w-full max-w-full flex flex-col overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/history" element={<History />} />
              <Route path="/auth" element={<Auth />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}
