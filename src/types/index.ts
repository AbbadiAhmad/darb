// Core type definitions for DARB

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface ProcessDefinition {
  id: string;
  name: string;
  key: string;
  description?: string;
  category?: string;
  bpmnXml: string;
  version: number;
  state: 'draft' | 'published' | 'deprecated';
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  publishedAt?: Date;
  publishedBy?: string;
  parentProcessId?: string;
  isVariant: boolean;
}

export interface ProcessInstance {
  id: string;
  processDefinitionId: string;
  processKey: string;
  processVersion: number;
  businessKey?: string;
  state: 'pending' | 'active' | 'completed' | 'failed' | 'suspended' | 'terminated';
  variables?: Record<string, any>;
  startedBy?: string;
  startedAt: Date;
  completedAt?: Date;
  parentInstanceId?: string;
  variantId?: string;
}

export interface Task {
  id: string;
  processInstanceId: string;
  taskDefinitionKey: string;
  name: string;
  description?: string;
  taskType: 'user_task' | 'service_task' | 'script_task' | 'send_task' | 'receive_task';
  state: 'created' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assignee?: string;
  candidateUsers?: string[];
  candidateRoles?: string[];
  priority: number;
  dueDate?: Date;
  formData?: Record<string, any>;
  variables?: Record<string, any>;
  createdAt: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
}

export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  itemType: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  processInstanceId?: string;
  taskId?: string;
  assignee?: string;
  reporter?: string;
  category?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  dueDate?: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actorId?: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  context?: Record<string, any>;
  justification?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Standard {
  id: string;
  name: string;
  code: string;
  version?: string;
  description?: string;
  sections?: Record<string, any>;
  createdAt: Date;
}

export interface SLADefinition {
  id: string;
  processDefinitionId?: string;
  taskDefinitionKey?: string;
  name: string;
  durationMinutes: number;
  escalationRules?: Record<string, any>;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

// API Request/Response types

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

export interface CreateProcessRequest {
  name: string;
  key: string;
  description?: string;
  category?: string;
  bpmnXml: string;
}

export interface StartProcessRequest {
  processKey: string;
  businessKey?: string;
  variables?: Record<string, any>;
}

export interface CompleteTaskRequest {
  variables?: Record<string, any>;
  formData?: Record<string, any>;
}

export interface CreateWorkItemRequest {
  title: string;
  description?: string;
  itemType?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  category?: string;
  tags?: string[];
  dueDate?: Date;
}

export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  category?: string;
  tags?: string[];
  dueDate?: Date;
}

// Express Request extension for authenticated user
export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    username: string;
    roles: string[];
  };
}
