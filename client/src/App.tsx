import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProcessList from './pages/ProcessList';
import ProcessEditor from './pages/ProcessEditor';
import WorkItemList from './pages/WorkItemList';
import TaskList from './pages/TaskList';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="processes" element={<ProcessList />} />
            <Route path="processes/new" element={<ProcessEditor />} />
            <Route path="processes/:id" element={<ProcessEditor />} />
            <Route path="work-items" element={<WorkItemList />} />
            <Route path="tasks" element={<TaskList />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
