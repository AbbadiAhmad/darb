-- DARB Database Schema
-- Process-driven ticketing application with BPMN support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- User Management & Access Control
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    scope VARCHAR(255),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    granted_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id, scope)
);

-- =====================================================
-- Process Modeling
-- =====================================================

CREATE TABLE process_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    bpmn_xml TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    state VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, published, deprecated
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID REFERENCES users(id),
    parent_process_id UUID REFERENCES process_definitions(id),
    is_variant BOOLEAN DEFAULT false,
    UNIQUE(key, version)
);

CREATE TABLE process_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID REFERENCES process_definitions(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL,
    annotation_type VARCHAR(50) NOT NULL, -- description, standard, evidence, link
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(50),
    description TEXT,
    sections JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Process Execution
-- =====================================================

CREATE TABLE process_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_definition_id UUID REFERENCES process_definitions(id),
    process_key VARCHAR(255) NOT NULL,
    process_version INTEGER NOT NULL,
    business_key VARCHAR(255),
    state VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, completed, failed, suspended, terminated
    variables JSONB,
    started_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    parent_instance_id UUID REFERENCES process_instances(id),
    variant_id UUID
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_instance_id UUID REFERENCES process_instances(id) ON DELETE CASCADE,
    task_definition_key VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL, -- user_task, service_task, script_task, send_task, receive_task
    state VARCHAR(50) NOT NULL DEFAULT 'created', -- created, assigned, in_progress, completed, failed, cancelled
    assignee UUID REFERENCES users(id),
    candidate_users UUID[],
    candidate_roles UUID[],
    priority INTEGER DEFAULT 50,
    due_date TIMESTAMP WITH TIME ZONE,
    form_data JSONB,
    variables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id)
);

CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Work Item Management (Integrated Ticketing)
-- =====================================================

CREATE TABLE work_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    item_type VARCHAR(100) NOT NULL DEFAULT 'ticket',
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, in_progress, waiting, resolved, closed
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
    process_instance_id UUID REFERENCES process_instances(id),
    task_id UUID REFERENCES tasks(id),
    assignee UUID REFERENCES users(id),
    reporter UUID REFERENCES users(id),
    category VARCHAR(100),
    tags VARCHAR(100)[],
    custom_fields JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE work_item_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_item_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Process-Level Permissions
-- =====================================================

CREATE TABLE process_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requesting_process_id UUID REFERENCES process_definitions(id),
    target_process_id UUID REFERENCES process_definitions(id),
    requested_by UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, denied
    justification TEXT,
    conditions JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER
);

-- =====================================================
-- Immutable Audit Trail
-- =====================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actor_id UUID REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    context JSONB,
    justification TEXT,
    ip_address INET,
    user_agent TEXT
);

-- Prevent updates and deletes on audit log
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- =====================================================
-- SLA & Escalation
-- =====================================================

CREATE TABLE sla_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_definition_id UUID REFERENCES process_definitions(id),
    task_definition_key VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    escalation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sla_breaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id),
    sla_definition_id UUID REFERENCES sla_definitions(id),
    breached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Notifications
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_process_instances_state ON process_instances(state);
CREATE INDEX idx_process_instances_started_at ON process_instances(started_at);
CREATE INDEX idx_tasks_state ON tasks(state);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_process_instance ON tasks(process_instance_id);
CREATE INDEX idx_work_items_status ON work_items(status);
CREATE INDEX idx_work_items_assignee ON work_items(assignee);
CREATE INDEX idx_work_items_created_at ON work_items(created_at);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =====================================================
-- Initial Data
-- =====================================================

-- System Roles
INSERT INTO roles (id, name, description, is_system_role) VALUES
    (uuid_generate_v4(), 'Administrator', 'System administrator with full access', true),
    (uuid_generate_v4(), 'ProcessOwner', 'Governs processes and manages access', true),
    (uuid_generate_v4(), 'ProcessDesigner', 'Creates and manages process models', true),
    (uuid_generate_v4(), 'Agent', 'Executes assigned tasks', true),
    (uuid_generate_v4(), 'Approver', 'Reviews and approves decisions', true),
    (uuid_generate_v4(), 'ComplianceOfficer', 'Manages compliance and audit', true);

-- Basic Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('manage_users', 'user', 'manage', 'Manage user accounts'),
    ('manage_roles', 'role', 'manage', 'Manage roles and permissions'),
    ('create_process', 'process', 'create', 'Create new process definitions'),
    ('edit_process', 'process', 'edit', 'Edit process definitions'),
    ('publish_process', 'process', 'publish', 'Publish process definitions'),
    ('delete_process', 'process', 'delete', 'Delete process definitions'),
    ('start_process', 'process_instance', 'create', 'Start new process instances'),
    ('view_process', 'process_instance', 'view', 'View process instances'),
    ('manage_tasks', 'task', 'manage', 'Manage tasks'),
    ('execute_tasks', 'task', 'execute', 'Execute assigned tasks'),
    ('manage_work_items', 'work_item', 'manage', 'Manage work items'),
    ('view_audit_log', 'audit', 'view', 'View audit logs'),
    ('generate_reports', 'report', 'create', 'Generate compliance reports');
