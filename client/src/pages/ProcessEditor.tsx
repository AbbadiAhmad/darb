import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProcessEditor: React.FC = () => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [bpmnXml, setBpmnXml] = useState(DEFAULT_BPMN_XML);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/v1/processes', {
        name,
        key,
        description,
        bpmnXml,
      });

      navigate('/processes');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Create New Process</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Process Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Customer Onboarding"
            />
          </div>

          <div className="form-group">
            <label>Process Key *</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              placeholder="e.g., customer-onboarding"
            />
            <small style={{ color: '#666' }}>
              Unique identifier for the process (lowercase, no spaces)
            </small>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the purpose of this process..."
            />
          </div>

          <div className="form-group">
            <label>BPMN XML *</label>
            <textarea
              value={bpmnXml}
              onChange={(e) => setBpmnXml(e.target.value)}
              rows={10}
              required
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <small style={{ color: '#666' }}>
              BPMN 2.0 XML definition (use a BPMN modeler to create complex processes)
            </small>
          </div>

          {error && <div className="error">{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Process'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/processes')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="159" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export default ProcessEditor;
