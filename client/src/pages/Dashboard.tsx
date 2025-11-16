import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="card">
          <h3>Processes</h3>
          <p style={{ color: '#666', margin: '10px 0' }}>
            Create and manage BPMN process definitions
          </p>
          <Link to="/processes" className="btn btn-primary">
            View Processes
          </Link>
        </div>
        <div className="card">
          <h3>My Tasks</h3>
          <p style={{ color: '#666', margin: '10px 0' }}>
            View and complete assigned tasks
          </p>
          <Link to="/tasks" className="btn btn-primary">
            View Tasks
          </Link>
        </div>
        <div className="card">
          <h3>Work Items</h3>
          <p style={{ color: '#666', margin: '10px 0' }}>
            Manage tickets and work items
          </p>
          <Link to="/work-items" className="btn btn-primary">
            View Work Items
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Welcome to DARB</h3>
        <p style={{ lineHeight: '1.6', color: '#666' }}>
          DARB is a process-driven ticketing application that combines BPMN workflow
          automation with integrated work item management. Key features include:
        </p>
        <ul style={{ marginTop: '10px', marginLeft: '20px', lineHeight: '1.8' }}>
          <li>Visual BPMN process modeling</li>
          <li>Process execution and task management</li>
          <li>Integrated ticketing system</li>
          <li>Immutable audit trails</li>
          <li>Compliance and standards mapping</li>
          <li>Role-based access control</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
