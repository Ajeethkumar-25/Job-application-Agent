import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Auth
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout and Pages
import Layout from './components/Layout';
import Launchpad from './pages/Launchpad';
import LiveLogs from './pages/LiveLogs';
import Tracker from './pages/Tracker';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

const API_BASE_URL = 'http://localhost:8000/api';

function AppRoutes() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Shared State
  const [availablePortals, setAvailablePortals] = useState([]);
  const [selectedPortals, setSelectedPortals] = useState([]);
  const [targetTitles, setJobTitles] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [experience, setExperience] = useState('Any');
  const [recency, setRecency] = useState('Any');
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [atsThreshold, setAtsThreshold] = useState(85);
  const [autoApply, setAutoApply] = useState(false);
  const [maxJobs, setMaxJobs] = useState(20);

  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchPortals = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/available-portals`);
        setAvailablePortals(res.data);
      } catch (err) {
        console.error('Failed to fetch portals:', err);
      }
    };

    const fetchResumes = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/resumes`);
        setResumes(res.data.resumes);
        if (res.data.resumes.length > 0) setSelectedResume(res.data.resumes[0]);
      } catch (err) {
        console.error('Failed to fetch resumes:', err);
      }
    };

    fetchPortals();
    fetchResumes();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedResume) {
      setAnalysisData(null);
      return;
    }
    const analyzeResume = async () => {
      setIsAnalyzing(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/analyze-resume/${selectedResume}`);
        setAnalysisData(res.data);
        if (res.data && res.data.target_job_titles && res.data.target_job_titles.length > 0) {
          // Pre-fill targetRoles if it's currently empty
          setJobTitles(prev => prev ? prev : res.data.target_job_titles.join(', '));
        }
      } catch (err) {
        console.error('Failed to analyze resume:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    analyzeResume();
  }, [selectedResume, isAuthenticated]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/logs`);
      setLogs(res.data.logs);
      setIsRunning(res.data.running);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleStartAgent = async () => {
    if (selectedPortals.length === 0 || !targetTitles) {
      alert('Please select at least one portal and enter job titles.');
      return;
    }
    if (!selectedResume) {
      alert('Please upload and select a Knowledge Base (Resume PDF).');
      return;
    }

    setLogs([]);
    setIsRunning(true);
    await axios.post(`${API_BASE_URL}/logs/clear`);

    const formData = new FormData();
    formData.append('portals', selectedPortals.join(','));
    formData.append('target_titles', targetTitles);
    formData.append('location', selectedLocations.length > 0 ? selectedLocations.join(',') : 'Remote');
    formData.append('experience', experience);
    formData.append('recency', recency);
    formData.append('auto_apply', autoApply);
    formData.append('ats_threshold', atsThreshold);
    formData.append('max_jobs', maxJobs);
    if (selectedResume) formData.append('resume_filename', selectedResume);

    try {
      await axios.post(`${API_BASE_URL}/run-multi-agent`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/logs');
    } catch (err) {
      console.error('Failed to start agent:', err);
      alert('Error starting the agent. Check console.');
      setIsRunning(false);
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={
          <Launchpad
            availablePortals={availablePortals}
            selectedPortals={selectedPortals} setSelectedPortals={setSelectedPortals}
            targetTitles={targetTitles} setJobTitles={setJobTitles}
            experience={experience} setExperience={setExperience}
            recency={recency} setRecency={setRecency}
            resumes={resumes} setResumes={setResumes}
            selectedResume={selectedResume} setSelectedResume={setSelectedResume}
            atsThreshold={atsThreshold} setAtsThreshold={setAtsThreshold}
            autoApply={autoApply} setAutoApply={setAutoApply}
            selectedLocations={selectedLocations} setSelectedLocations={setSelectedLocations}
            handleStartAgent={handleStartAgent} isRunning={isRunning} logs={logs}
            analysisData={analysisData}
            isAnalyzing={isAnalyzing}
            maxJobs={maxJobs}
            setMaxJobs={setMaxJobs}
          />
        } />
        <Route path="logs" element={<LiveLogs logs={logs} isRunning={isRunning} fetchLogs={fetchLogs} />} />
        <Route path="tracker" element={<Tracker />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
