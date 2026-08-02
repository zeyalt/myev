import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import EntryPage from './pages/EntryPage'
import InsightsPage from './pages/InsightsPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/add" element={<EntryPage />} />
        <Route path="/insights" element={<InsightsPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
