import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Task {
  id: string;
  name: string;
  state: string;
  priority: number;
  createdAt: string;
  dueDate?: string;
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get('/api/v1/execution/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      await axios.post(`/api/v1/execution/tasks/${taskId}/complete`);
      loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>My Tasks</h1>

      <div className="card">
        {tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No tasks assigned to you.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>State</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.name}</td>
                  <td>
                    <span className={`badge badge-info`}>
                      {task.state}
                    </span>
                  </td>
                  <td>{task.priority}</td>
                  <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                  <td>
                    {task.state !== 'completed' && (
                      <button
                        onClick={() => completeTask(task.id)}
                        className="btn btn-primary"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Complete
                      </button>
                    )}
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

export default TaskList;
