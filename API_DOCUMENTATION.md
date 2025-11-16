# DARB API Documentation

## Overview

DARB provides a RESTful API for managing processes, tasks, and work items. All endpoints are prefixed with `/api/v1`.

## Authentication

Most endpoints require authentication using JWT tokens.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@darb.local",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Using Authentication

Include the token in the Authorization header:

```http
Authorization: Bearer <token>
```

## Process Management

### Create Process

```http
POST /api/v1/processes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Customer Onboarding",
  "key": "customer-onboarding",
  "description": "Process for onboarding new customers",
  "category": "sales",
  "bpmnXml": "<?xml version=\"1.0\"?>..."
}
```

### List Processes

```http
GET /api/v1/processes?category=sales&state=published
Authorization: Bearer <token>
```

### Get Process

```http
GET /api/v1/processes/{id}
Authorization: Bearer <token>
```

### Update Process

```http
PUT /api/v1/processes/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Process Name",
  "description": "Updated description"
}
```

### Publish Process

```http
POST /api/v1/processes/{id}/publish
Authorization: Bearer <token>
```

## Process Execution

### Start Process Instance

```http
POST /api/v1/execution/instances
Authorization: Bearer <token>
Content-Type: application/json

{
  "processKey": "customer-onboarding",
  "businessKey": "CUST-12345",
  "variables": {
    "customerName": "Acme Corp",
    "amount": 50000
  }
}
```

### List Process Instances

```http
GET /api/v1/execution/instances?processKey=customer-onboarding&state=active&limit=20&offset=0
Authorization: Bearer <token>
```

### Get Process Instance

```http
GET /api/v1/execution/instances/{id}
Authorization: Bearer <token>
```

## Task Management

### List Tasks

```http
GET /api/v1/execution/tasks?state=created&limit=20
Authorization: Bearer <token>
```

Query parameters:
- `processInstanceId` - Filter by process instance
- `assignee` - Filter by assignee (defaults to current user)
- `state` - Filter by state (created, assigned, in_progress, completed)
- `limit` - Pagination limit
- `offset` - Pagination offset

### Get Task

```http
GET /api/v1/execution/tasks/{id}
Authorization: Bearer <token>
```

### Assign Task

```http
POST /api/v1/execution/tasks/{id}/assign
Authorization: Bearer <token>
```

Assigns the task to the current user.

### Complete Task

```http
POST /api/v1/execution/tasks/{id}/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "variables": {
    "approved": true,
    "comments": "Looks good"
  },
  "formData": {
    "field1": "value1"
  }
}
```

## Work Item Management

### Create Work Item

```http
POST /api/v1/work-items
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Fix login issue",
  "description": "Users unable to login on mobile",
  "priority": "high",
  "category": "bug",
  "tags": ["login", "mobile"],
  "assignee": "user-uuid",
  "dueDate": "2025-12-31T23:59:59Z"
}
```

### List Work Items

```http
GET /api/v1/work-items?status=open&priority=high&limit=20
Authorization: Bearer <token>
```

Query parameters:
- `status` - Filter by status (open, in_progress, waiting, resolved, closed)
- `assignee` - Filter by assignee
- `reporter` - Filter by reporter
- `priority` - Filter by priority (low, medium, high, critical)
- `category` - Filter by category
- `limit` - Pagination limit
- `offset` - Pagination offset

### Get Work Item

```http
GET /api/v1/work-items/{id}
Authorization: Bearer <token>
```

### Update Work Item

```http
PUT /api/v1/work-items/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "assignee": "new-user-uuid",
  "priority": "critical"
}
```

### Add Comment

```http
POST /api/v1/work-items/{id}/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "Working on this now"
}
```

### Get Comments

```http
GET /api/v1/work-items/{id}/comments
Authorization: Bearer <token>
```

## Audit Trail

### Query Audit Log

```http
GET /api/v1/audit?resourceType=process&startDate=2025-01-01&limit=100
Authorization: Bearer <token>
```

Query parameters:
- `resourceType` - Filter by resource type
- `resourceId` - Filter by specific resource
- `actorId` - Filter by actor (user)
- `startDate` - Filter from date (ISO 8601)
- `endDate` - Filter to date (ISO 8601)
- `limit` - Pagination limit (default: 100)
- `offset` - Pagination offset

**Note:** Requires ComplianceOfficer or Administrator role.

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

## Rate Limiting

- Rate limiting is not currently implemented
- Consider implementing rate limiting in production

## Webhooks

Webhook support is planned for future releases.

## Data Types

### Process States
- `draft` - Editable, not executable
- `published` - Published and executable
- `deprecated` - No longer active

### Task States
- `created` - Task created, not assigned
- `assigned` - Task assigned to user
- `in_progress` - User working on task
- `completed` - Task finished
- `failed` - Task failed
- `cancelled` - Task cancelled

### Work Item Status
- `open` - New work item
- `in_progress` - Being worked on
- `waiting` - Waiting for external input
- `resolved` - Issue resolved
- `closed` - Work item closed

### Priority Levels
- `low`
- `medium`
- `high`
- `critical`

## Best Practices

1. **Always validate input** before making API calls
2. **Handle errors gracefully** with proper error messages
3. **Use pagination** for list endpoints to avoid large responses
4. **Store tokens securely** (never in version control)
5. **Implement retry logic** for transient failures
6. **Log API interactions** for debugging
7. **Use business keys** for process instances to improve traceability

## Examples

See the client implementation in `/client/src` for complete examples of API usage.
