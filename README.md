# DARB - Process-Driven Ticketing System

A comprehensive web-based platform combining BPMN workflow automation with integrated work item management, immutable audit trails, and compliance-driven process orchestration.

## Overview

DARB (Dynamic Automated Resource & Business workflow) is a process-driven ticketing application that unifies:

- **Visual Process Modeling** - BPMN 2.0-based workflow design
- **Native Ticketing Integration** - Work items as first-class citizens
- **Compliance by Design** - Immutable audit trails and standards mapping
- **Role-Based Access Control** - Fine-grained permissions for process governance
- **Process Execution Engine** - Task management and workflow automation

## Key Features

### ✅ Process Management
- BPMN process definition storage and versioning
- Draft and published process states
- Process categories and metadata
- Multi-version support with active version tracking

### ✅ Workflow Execution
- Process instance lifecycle management
- Task creation, assignment, and completion
- Process variables and context propagation
- State machine for process and task states

### ✅ Work Item System
- Integrated ticketing with status tracking
- Priority management (low, medium, high, critical)
- Comments and collaboration
- Filtering, searching, and categorization

### ✅ Security & Compliance
- JWT-based authentication
- Role-based access control (6 system roles)
- Immutable audit trail (append-only)
- Comprehensive event logging

### ✅ REST API
- Complete RESTful API
- Request validation and error handling
- Authentication and authorization middleware
- Pagination and filtering support

### ✅ Modern UI
- React-based single-page application
- Responsive design
- Dashboard with quick access
- Process, task, and work item management

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/AbbadiAhmad/darb.git
cd darb

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

Access the application:
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001

### Manual Setup

**Prerequisites:**
- Node.js 20+
- PostgreSQL 15+

**Backend:**
```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

See [SETUP.md](SETUP.md) for detailed setup instructions.

## System Roles

1. **Administrator** - Full system access
2. **Process Owner** - Governs processes and manages access
3. **Process Designer** - Creates and manages process models
4. **Agent** - Executes assigned tasks
5. **Approver** - Reviews and approves decisions
6. **Compliance Officer** - Manages compliance and audit

## API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

### Quick API Examples

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Create Process:**
```bash
curl -X POST http://localhost:3000/api/v1/processes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Process",
    "key": "sample-process",
    "bpmnXml": "<?xml version=\"1.0\"?>..."
  }'
```

## Architecture

### Technology Stack
- **Backend**: Node.js, TypeScript, Express
- **Database**: PostgreSQL 15+
- **Frontend**: React, TypeScript, Vite
- **Authentication**: JWT with bcrypt
- **Process Engine**: Custom lightweight engine

### Directory Structure
```
darb/
├── src/                    # Backend source
│   ├── config/            # Configuration
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── types/             # TypeScript definitions
├── client/                 # Frontend source
│   └── src/
│       ├── components/    # React components
│       ├── pages/         # Page components
│       └── context/       # State management
├── database/               # Database schema
│   └── schema.sql
└── docker-compose.yml      # Docker configuration
```

## Implementation Status

This is a **first draft implementation** providing core MVP features. See [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for details on what's implemented and planned enhancements.

### Implemented (v1.0)
- ✅ User authentication and RBAC
- ✅ Process definition management
- ✅ Basic execution engine
- ✅ Work item management
- ✅ Immutable audit trail
- ✅ REST API
- ✅ React frontend

### Planned Enhancements
- 🔶 Full BPMN 2.0 execution engine
- 🔶 Visual BPMN editor
- 🔶 Process analytics and dashboards
- 🔶 Standards mapping and compliance reporting
- 🔶 Advanced approval workflows
- 🔶 SLA management and escalation
- 🔶 Webhook integrations
- 🔶 Multi-factor authentication

## Database Schema

The system uses PostgreSQL with a normalized schema including:

- **Users & Access Control**: users, roles, permissions, user_roles
- **Process Modeling**: process_definitions, process_annotations, standards
- **Execution**: process_instances, tasks, task_comments
- **Work Items**: work_items, work_item_comments, work_item_attachments
- **Audit**: audit_log (immutable with PostgreSQL rules)
- **Compliance**: sla_definitions, sla_breaches, notifications

## Security

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- SQL injection prevention via parameterized queries
- XSS protection with helmet.js
- CORS configuration
- Immutable audit trail

**Production Security Checklist:**
- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Regular security audits

## Contributing

Contributions welcome! Key areas:
1. BPMN engine enhancement
2. Test coverage
3. Visual editor integration
4. Performance optimization
5. Documentation improvements

## License

See [LICENSE](LICENSE) file for details.

## Requirements

Based on the [Comprehensive Requirements Specification (CRS)](CRS-Comprehensive-Requirements.md) v2.0.

## Support

- Documentation: See SETUP.md and API_DOCUMENTATION.md
- Issues: [GitHub Issues](https://github.com/AbbadiAhmad/darb/issues)

---

**Status:** First Draft Implementation - Core MVP Features Complete
