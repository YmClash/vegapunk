import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ChatProvider } from './contexts/ChatContext';

// Pages
import { HomePage } from './pages/HomePage';
import { DebugOverviewPage } from './pages/DebugOverviewPage';
import { OllamaMonitorPage } from './pages/OllamaMonitorPage';
import { ChatLogsPage } from './pages/ChatLogsPage';
import { WebSocketMonitorPage } from './pages/WebSocketMonitorPage';
import { ErrorMonitorPage } from './pages/ErrorMonitorPage';
import { PerformanceMetricsPage } from './pages/PerformanceMetricsPage';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <ChatProvider>
      <Router>
        <Layout 
          darkMode={darkMode} 
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/debug" element={<DebugOverviewPage />} />
            <Route path="/ollama" element={<OllamaMonitorPage />} />
            <Route path="/chat-logs" element={<ChatLogsPage />} />
            <Route path="/websockets" element={<WebSocketMonitorPage />} />
            <Route path="/errors" element={<ErrorMonitorPage />} />
            <Route path="/performance" element={<PerformanceMetricsPage />} />
          </Routes>
        </Layout>
      </Router>
    </ChatProvider>
  );
}

export default App;