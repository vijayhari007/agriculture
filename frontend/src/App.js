import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Recommendation from './pages/Recommendation';
import SoilAnalysis from './pages/SoilAnalysis';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Advisor from './pages/Advisor';
import { I18nProvider } from './i18n';
import AnimatedBackground from './components/AnimatedBackground';

function App() {
  return (
    <I18nProvider>
      <Router>
        <div className="min-h-screen relative">
          <AnimatedBackground />
          <Navbar />
          <main className="relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/recommendation" element={<Recommendation />} />
              <Route path="/advisor" element={<Advisor />} />
              <Route path="/soil-analysis" element={<SoilAnalysis />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </I18nProvider>
  );
}

export default App;
