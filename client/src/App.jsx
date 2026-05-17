import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import HistorySidebar from './components/HistorySidebar';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import History from './pages/History';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="relative min-h-screen bg-background text-textMain flex flex-col">
          {/* Global Navigation Header Bar */}
          <Navbar />
          
          {/* Global History Sliding Drawer */}
          <HistorySidebar />

          {/* Content container mounting active routes */}
          <main className="flex-grow w-full flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}
