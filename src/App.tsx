import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import InsightsPage from './pages/InsightsPage'
import RecordsPage from './pages/RecordsPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        {/* Add Entry folded into Records; redirect old bookmarks/links. */}
        <Route path="/add" element={<Navigate to="/records" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
