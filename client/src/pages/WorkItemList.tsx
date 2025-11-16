import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface WorkItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

const WorkItemList: React.FC = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkItems();
  }, []);

  const loadWorkItems = async () => {
    try {
      const response = await axios.get('/api/v1/work-items');
      setWorkItems(response.data.items);
    } catch (error) {
      console.error('Failed to load work items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading work items...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Work Items</h1>

      <div className="card">
        {workItems.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No work items found.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {workItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>
                    <span className={`badge badge-${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'resolved':
    case 'closed':
      return 'success';
    default:
      return 'info';
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
};

export default WorkItemList;
