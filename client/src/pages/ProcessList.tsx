import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Process {
  id: string;
  name: string;
  key: string;
  version: number;
  state: string;
  createdAt: string;
}

const ProcessList: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const response = await axios.get('/api/v1/processes');
      setProcesses(response.data.processes);
    } catch (error) {
      console.error('Failed to load processes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading processes...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Processes</h1>
        <Link to="/processes/new" className="btn btn-primary">
          Create New Process
        </Link>
      </div>

      <div className="card">
        {processes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No processes found. Create your first process to get started.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Version</th>
                <th>State</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process) => (
                <tr key={process.id}>
                  <td>{process.name}</td>
                  <td><code>{process.key}</code></td>
                  <td>v{process.version}</td>
                  <td>
                    <span className={`badge badge-${process.state === 'published' ? 'success' : 'warning'}`}>
                      {process.state}
                    </span>
                  </td>
                  <td>{new Date(process.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/processes/${process.id}`} style={{ marginRight: '10px' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProcessList;
