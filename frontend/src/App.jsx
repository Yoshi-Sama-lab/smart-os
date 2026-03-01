import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Dashboard from "./pages/Dashboard";
import StudyLog from "./pages/Studylog";
import Schedule from "./pages/Schedule";
import Goals from "./pages/Goals";
import NotFound from "./pages/NotFound";

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <button
          onClick={login}
          className="bg-blue-600 px-6 py-3 rounded-lg text-lg hover:bg-blue-700"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-800 p-4 space-y-4">
        <div className="font-bold text-lg mb-4">Student OS</div>
        <nav className="flex flex-col gap-2">
          <Link to="/" className="hover:text-blue-400">Dashboard</Link>
          <Link to="/study" className="hover:text-blue-400">Study Log</Link>
          <Link to="/schedule" className="hover:text-blue-400">Schedule</Link>
          <Link to="/goals" className="hover:text-blue-400">Goals</Link>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-700">
          <div className="text-sm opacity-80">{user.email}</div>
          <button
            onClick={logout}
            className="mt-2 bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/study" element={<StudyLog />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}