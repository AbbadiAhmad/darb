# DARB System Architecture

## Overview

DARB is composed of **three interconnected applications** that work together to provide a complete process-driven ticketing system:

```
┌─────────────────────────────────────────────────────────────────┐
│                        DARB System                              │
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐      ┌────────┴────────┐
│  │  1. Process      │      │  2. Ticketing/   │      │  3. Public      │
│  │     Designer     │─────>│     Execution    │<─────│     Portal      │
│  │     (Admin)      │ XML  │     Engine       │ Data │  (End Users)    │
│  └──────────────────┘      └──────────────────┘      └─────────────────┘
│         │                          │                          │
│         │                          │                          │
│         └──────────────────────────┴──────────────────────────┘
│                              │
│                    ┌─────────▼──────────┐
│                    │   PostgreSQL DB    │
│                    │   (Shared State)   │
│                    └────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

## The Three Interconnected Applications

### 1. Process Designer Application (Backend Office)

**Purpose**: Design and model business processes visually

**Users**: Process Designers, Process Owners, Administrators

**Key Functions**:
- Create BPMN process definitions using visual editor
- Define process flows with tasks, gateways, and events
- Configure form fields for each task
- Map process steps to standards and compliance requirements
- Publish process definitions

**Output**: BPMN XML files that describe:
- Process flow and routing logic
- Task definitions and assignments
- Form structures and fields
- Validation rules
- Approval workflows

**Example XML Output**:
```xml
<bpmn:userTask id="task_passport_application" name="Passport Application Form">
  <bpmn:extensionElements>
    <darb:formDefinition>
      <darb:field name="fullName" type="text" required="true" label="Full Name"/>
      <darb:field name="nationalId" type="text" required="true" label="National ID"/>
      <darb:field name="birthDate" type="date" required="true" label="Date of Birth"/>
      <darb:field name="photo" type="file" required="true" label="Photo"/>
    </darb:formDefinition>
    <darb:assignment>
      <darb:candidateRoles>PassportOfficer</darb:candidateRoles>
    </darb:assignment>
  </bpmn:extensionElements>
  <bpmn:outgoing>flow_to_verification</bpmn:outgoing>
</bpmn:userTask>
```

---

### 2. Ticketing/Process Execution Engine (Process Management)

**Purpose**: Execute processes, manage workflow state, assign tasks

**Users**: Agents, Approvers, Managers, Back-office staff

**Key Functions**:
- **Parse BPMN XML** from Process Designer
- **Execute process instances** following the XML flow
- **Generate work items** (tickets) for each process instance
- **Route tasks** to appropriate teams/personas based on XML rules
- **Manage state transitions** according to process flow
- **Handle approvals and rejections**
- **Track SLA and escalations**
- **Record all actions** in immutable audit trail

**Process Execution Flow**:
1. Receives trigger (from Public Portal or API)
2. Loads BPMN XML for requested process
3. Creates process instance with unique ID
4. Parses XML to identify first task
5. Creates task and assigns to appropriate role/person
6. Waits for task completion
7. Evaluates gateways and conditions
8. Routes to next task based on XML flow
9. Repeats until end event

**Example**:
```
Citizen submits passport application (Public Portal)
  ↓
Engine loads "passport_process.xml"
  ↓
Creates Process Instance #12345
  ↓
Parses XML: First task = "Document Collection"
  ↓
Creates Task assigned to "PassportOfficer" role
  ↓
Officer completes task via backend interface
  ↓
Engine evaluates gateway: Documents complete?
  ↓
Routes to next task: "Verification"
  ↓
Continues until passport is issued
```

---

### 3. Public Portal / Data Viewer (Citizen Interface)

**Purpose**: Allow end-users to interact with processes through dynamic forms

**Users**: Citizens, Customers, External users

**Key Functions**:
- **Display service catalog** (available processes)
- **Render dynamic forms** based on BPMN XML form definitions
- **Collect user input** according to form structure
- **Submit data** to trigger process execution
- **Display process status** to applicants
- **Allow document uploads** as specified in XML
- **Show task history** and current state

**User Journey Example** (Passport Application):

1. **User visits public portal**: `https://services.gov.example/`
2. **Selects service**: "Passport Application"
3. **Portal fetches XML**: Loads `passport_process.xml` from Engine
4. **Renders form dynamically**:
   ```
   Based on XML:
   - Full Name: [________]
   - National ID: [________]
   - Date of Birth: [__/__/____]
   - Photo: [Upload File]
   - [Submit Application]
   ```
5. **User fills and submits**
6. **Portal sends data** to Execution Engine API
7. **Engine creates process instance** and work item
8. **User receives**: Ticket #12345 with status "Under Review"
9. **User can track**: Status updates via portal

**Dynamic Form Generation**:
```typescript
// Portal reads BPMN XML
const formFields = parseFormDefinition(bpmnXml);

// Generates form dynamically
formFields.forEach(field => {
  renderFormField(field.name, field.type, field.required, field.label);
});
```

---

## Data Flow Between Applications

### Scenario: Citizen Applies for Passport

```
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Process Designer creates process                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Designer creates "Passport Process" │
            │ - Defines tasks: Application,       │
            │   Verification, Approval, Issuance  │
            │ - Configures forms for each task    │
            │ - Sets assignment rules             │
            │ - Publishes process                 │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ BPMN XML stored in database:        │
            │ "passport_process.xml"              │
            └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Citizen submits application via Public Portal              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Public Portal loads service catalog │
            │ User selects "Passport Application" │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Portal fetches XML from Engine API  │
            │ GET /api/processes/passport/form    │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Portal parses form definition       │
            │ Renders: Name, ID, Photo fields     │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ User fills form and submits         │
            │ POST /api/processes/passport/start  │
            │ {name:"John", id:"123", photo:...}  │
            └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: Execution Engine processes request                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Engine receives submission          │
            │ Loads "passport_process.xml"        │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Creates Process Instance #12345     │
            │ Creates Work Item (Ticket) #12345   │
            │ Stores submitted data in variables  │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Parses first task from XML:         │
            │ "Document Verification"             │
            │ Assignment: PassportOfficer role    │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Creates Task assigned to officer    │
            │ Task appears in officer's queue     │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Returns to citizen:                 │
            │ "Application submitted"             │
            │ "Tracking #: 12345"                 │
            │ "Status: Under Review"              │
            └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: Back-office processes task                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Officer logs into Ticketing System  │
            │ Sees task in queue                  │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Opens Task #12345                   │
            │ Reviews submitted data and photo    │
            │ Marks as "Verified" and completes   │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Engine reads XML for next step      │
            │ Gateway: Documents OK?              │
            │ Condition: verified = true          │
            │ Routes to: "Approval" task          │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Creates approval task               │
            │ Assigned to: PassportManager        │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Manager approves → Passport issued  │
            │ Process instance completes          │
            │ Work item status: "Closed"          │
            └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Step 5: Citizen checks status                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ User visits portal tracking page    │
            │ Enters tracking #: 12345            │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Portal queries Engine API           │
            │ GET /api/work-items/12345/status    │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │ Displays:                           │
            │ ✓ Application submitted             │
            │ ✓ Documents verified                │
            │ ✓ Approved                          │
            │ ✓ Passport issued                   │
            │ Status: Complete                    │
            └─────────────────────────────────────┘
```

---

## XML as the Central Contract

The BPMN XML serves as the **contract** between all three applications:

### What XML Defines

1. **Process Flow** - Which tasks, in what order
2. **Task Properties** - Name, type, description
3. **Form Structures** - Input fields, validation, layout
4. **Assignment Rules** - Who can perform each task
5. **Routing Logic** - Gateways, conditions, branches
6. **Events** - Timers, messages, escalations
7. **Data Requirements** - Variables, documents, attachments

### Example: Complete Task Definition in XML

```xml
<bpmn:process id="passport_application" name="Passport Application Process">

  <!-- Start Event: Citizen submits application -->
  <bpmn:startEvent id="start" name="Application Submitted">
    <bpmn:outgoing>flow1</bpmn:outgoing>
  </bpmn:startEvent>

  <!-- User Task: Collect documents (shown in Public Portal) -->
  <bpmn:userTask id="task_collect_docs" name="Submit Documents">
    <bpmn:incoming>flow1</bpmn:incoming>
    <bpmn:outgoing>flow2</bpmn:outgoing>

    <bpmn:extensionElements>
      <!-- Form shown to citizen in Public Portal -->
      <darb:formDefinition>
        <darb:field name="fullName" type="text" required="true"/>
        <darb:field name="nationalId" type="text" required="true" pattern="[0-9]{10}"/>
        <darb:field name="birthDate" type="date" required="true"/>
        <darb:field name="address" type="textarea" required="true"/>
        <darb:field name="photo" type="file" required="true" accept="image/*"/>
        <darb:field name="idDocument" type="file" required="true" accept="application/pdf"/>
      </darb:formDefinition>

      <!-- Who performs this task -->
      <darb:assignment>
        <darb:assigneeExpression>citizen</darb:assigneeExpression>
      </darb:assignment>
    </bpmn:extensionElements>
  </bpmn:userTask>

  <!-- User Task: Verify documents (shown in Ticketing System) -->
  <bpmn:userTask id="task_verify" name="Verify Documents">
    <bpmn:incoming>flow2</bpmn:incoming>
    <bpmn:outgoing>flow3</bpmn:outgoing>

    <bpmn:extensionElements>
      <!-- Form shown to officer in Ticketing System -->
      <darb:formDefinition>
        <darb:field name="photoVerified" type="checkbox" label="Photo meets requirements"/>
        <darb:field name="idVerified" type="checkbox" label="ID document is valid"/>
        <darb:field name="verificationNotes" type="textarea" label="Notes"/>
      </darb:formDefinition>

      <!-- Assign to back-office role -->
      <darb:assignment>
        <darb:candidateRoles>PassportOfficer</darb:candidateRoles>
      </darb:assignment>

      <!-- SLA: Must complete in 24 hours -->
      <darb:sla durationMinutes="1440">
        <darb:escalation>
          <darb:notifyRole>PassportManager</darb:notifyRole>
        </darb:escalation>
      </darb:sla>
    </bpmn:extensionElements>
  </bpmn:userTask>

  <!-- Gateway: Check verification result -->
  <bpmn:exclusiveGateway id="gateway_check" name="Documents OK?">
    <bpmn:incoming>flow3</bpmn:incoming>
    <bpmn:outgoing>flow_approved</bpmn:outgoing>
    <bpmn:outgoing>flow_rejected</bpmn:outgoing>
  </bpmn:exclusiveGateway>

  <!-- Conditional flows -->
  <bpmn:sequenceFlow id="flow_approved" sourceRef="gateway_check" targetRef="task_approve">
    <bpmn:conditionExpression>photoVerified &amp;&amp; idVerified</bpmn:conditionExpression>
  </bpmn:sequenceFlow>

  <bpmn:sequenceFlow id="flow_rejected" sourceRef="gateway_check" targetRef="task_notify_rejection">
    <bpmn:conditionExpression>!photoVerified || !idVerified</bpmn:conditionExpression>
  </bpmn:sequenceFlow>

  <!-- Additional tasks... -->

</bpmn:process>
```

---

## Technical Implementation

### Current Structure

```
darb/
├── src/                          # Backend (Execution Engine + API)
│   ├── services/
│   │   ├── process.service.ts   # Process definition management
│   │   ├── execution.service.ts # Process execution & XML parsing
│   │   ├── workitem.service.ts  # Ticketing system
│   │   └── audit.service.ts     # Immutable audit trail
│   └── routes/
│       ├── process.routes.ts    # Process Designer API
│       ├── execution.routes.ts  # Execution Engine API
│       └── workitem.routes.ts   # Ticketing API
│
├── client/                       # Frontend (Process Designer + Ticketing UI)
│   └── src/
│       ├── pages/
│       │   ├── ProcessEditor.tsx    # Process Designer interface
│       │   ├── TaskList.tsx         # Ticketing System interface
│       │   └── WorkItemList.tsx     # Work item management
│       └── components/
│           └── BPMNEditor/          # (To be implemented)
│
└── public-portal/                # (To be created)
    └── src/
        ├── pages/
        │   ├── ServiceCatalog.tsx   # List available services
        │   ├── DynamicForm.tsx      # Render forms from XML
        │   └── TrackApplication.tsx # Check status
        └── services/
            └── formRenderer.ts      # Parse XML and generate forms
```

### Recommended Separation

For clarity, consider organizing as separate modules:

```
darb/
├── apps/
│   ├── process-designer/     # App 1: Process Designer
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── execution-engine/     # App 2: Ticketing/Execution Engine
│   │   ├── src/
│   │   └── package.json
│   │
│   └── public-portal/        # App 3: Citizen Portal
│       ├── src/
│       └── package.json
│
├── packages/
│   ├── shared-types/         # Shared TypeScript types
│   ├── bpmn-parser/          # XML parsing library
│   └── form-renderer/        # Dynamic form generation
│
└── database/                 # Shared database
```

---

## Key Integration Points

### 1. Process Designer → Execution Engine

**Contract**: BPMN XML file

**API**:
- `POST /api/v1/processes` - Upload new process definition
- `PUT /api/v1/processes/:id` - Update process
- `POST /api/v1/processes/:id/publish` - Make process active

**Flow**:
```
Designer creates XML → Saves to DB → Engine validates → Marks as published → Available for execution
```

### 2. Public Portal → Execution Engine

**Contract**: Process start request + form data

**API**:
- `GET /api/v1/processes/:key/form` - Get form definition for citizen
- `POST /api/v1/execution/instances` - Start process with submitted data
- `GET /api/v1/work-items/:id/status` - Track application status

**Flow**:
```
Portal fetches form → User fills → Submits to Engine → Engine creates instance → Returns tracking ID
```

### 3. Ticketing System → Execution Engine

**Contract**: Task completion with data

**API**:
- `GET /api/v1/execution/tasks` - Get tasks for current user
- `POST /api/v1/execution/tasks/:id/complete` - Complete task
- `GET /api/v1/execution/instances/:id` - View process instance details

**Flow**:
```
Agent gets task → Reviews data → Completes with decision → Engine routes to next task → Repeats
```

---

## Authentication & User Management

### Flexible Authentication Architecture

The three applications can be configured for **independent** or **shared** authentication:

#### Option 1: Shared Authentication (Single Sign-On)

All three applications share the same authentication service and user database:

```
┌─────────────────────────────────────────────────────────┐
│              Shared Authentication Service              │
│                 (JWT Token Provider)                    │
└─────────────────────────────────────────────────────────┘
           │                │                │
           ▼                ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │ Process   │    │ Ticketing │    │  Public   │
    │ Designer  │    │  System   │    │  Portal   │
    └───────────┘    └───────────┘    └───────────┘
```

**Benefits**:
- Single user account across all systems
- Seamless user experience
- Centralized user management
- Easier permission management

**Use Case**: Government internal systems where all staff use the same identity

**Configuration**:
```env
# .env
AUTH_MODE=shared
JWT_SECRET=shared_secret_key
AUTH_SERVICE_URL=http://auth.darb.local
```

#### Option 2: Independent Authentication

Each application has its own authentication system and user database:

```
┌───────────┐              ┌───────────┐              ┌───────────┐
│ Designer  │              │ Ticketing │              │  Portal   │
│   Auth    │              │   Auth    │              │   Auth    │
└───────────┘              └───────────┘              └───────────┘
     │                          │                          │
     ▼                          ▼                          ▼
┌───────────┐              ┌───────────┐              ┌───────────┐
│ Designer  │              │ Ticketing │              │  Public   │
│   Users   │              │   Users   │              │  Citizens │
└───────────┘              └───────────┘              └───────────┘
```

**Benefits**:
- Complete isolation between systems
- Different security requirements per app
- Independent user management
- Better for external vs internal users

**Use Case**:
- Public Portal for citizens (simple registration)
- Ticketing System for staff (LDAP/Active Directory)
- Process Designer for admins (MFA required)

**Configuration**:
```env
# apps/process-designer/.env
AUTH_MODE=independent
JWT_SECRET=designer_secret
DB_NAME=designer_users

# apps/execution-engine/.env
AUTH_MODE=independent
JWT_SECRET=engine_secret
DB_NAME=engine_users

# apps/public-portal/.env
AUTH_MODE=independent
JWT_SECRET=portal_secret
DB_NAME=portal_users
```

#### Option 3: Hybrid Authentication

Mix of shared and independent authentication:

```
┌─────────────────────────────────────┐
│  Internal Auth Service (SSO)        │
│  - Process Designer users           │
│  - Ticketing System users           │
└─────────────────────────────────────┘
           │                │
           ▼                ▼
    ┌───────────┐    ┌───────────┐
    │ Designer  │    │ Ticketing │
    └───────────┘    └───────────┘


┌─────────────────────────────────────┐
│  Public Auth Service                │
│  - Citizen self-registration        │
│  - OAuth/Social login               │
└─────────────────────────────────────┘
                 │
                 ▼
          ┌───────────┐
          │  Portal   │
          └───────────┘
```

**Benefits**:
- Internal staff uses corporate SSO
- Citizens have simpler registration
- Best security for each user type

**Use Case**: Most common in government/enterprise

**Configuration**:
```env
# Shared for internal apps
INTERNAL_AUTH_URL=ldap://internal.corp
INTERNAL_JWT_SECRET=internal_secret

# Separate for public
PUBLIC_AUTH_MODE=independent
PUBLIC_JWT_SECRET=public_secret
ALLOW_SELF_REGISTRATION=true
ENABLE_OAUTH=google,facebook
```

### User Roles Per Application

Different applications may have different user types:

| Application | User Types | Authentication |
|------------|-----------|----------------|
| **Process Designer** | Process Designers, Process Owners, Admins | Internal SSO / LDAP |
| **Ticketing System** | Agents, Approvers, Managers, Compliance Officers | Internal SSO / LDAP |
| **Public Portal** | Citizens, Customers | Self-registration / OAuth / Email |

### Implementation Example

#### Shared Authentication Flow

```typescript
// Shared auth service
class AuthService {
  async login(username: string, password: string) {
    // Authenticate against shared user database
    const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);

    // Generate shared JWT
    const token = jwt.sign(
      { id: user.id, roles: user.roles, app: 'all' },
      process.env.SHARED_JWT_SECRET
    );

    return { token, user };
  }
}

// All apps verify using same secret
app.use((req, res, next) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, process.env.SHARED_JWT_SECRET);
  req.user = decoded;
  next();
});
```

#### Independent Authentication Flow

```typescript
// Process Designer auth
class DesignerAuthService {
  async login(username: string, password: string) {
    // Authenticate against designer user database
    const user = await db.query('SELECT * FROM designer_users WHERE username = $1', [username]);

    // Generate designer-specific JWT
    const token = jwt.sign(
      { id: user.id, roles: user.roles, app: 'designer' },
      process.env.DESIGNER_JWT_SECRET
    );

    return { token, user };
  }
}

// Public Portal auth (different implementation)
class PublicAuthService {
  async register(email: string, password: string) {
    // Self-registration for citizens
    const user = await db.query(
      'INSERT INTO citizens (email, password_hash) VALUES ($1, $2) RETURNING *',
      [email, await bcrypt.hash(password, 10)]
    );

    // Generate portal-specific JWT
    const token = jwt.sign(
      { id: user.id, type: 'citizen', app: 'portal' },
      process.env.PORTAL_JWT_SECRET
    );

    return { token, user };
  }
}
```

### Configuration Reference

Add to your `.env` file:

```env
# Authentication Mode
# Options: shared | independent | hybrid
AUTH_MODE=shared

# Shared Authentication (when AUTH_MODE=shared)
SHARED_JWT_SECRET=your_shared_secret_key
SHARED_AUTH_DB=darb_users

# Independent Authentication (when AUTH_MODE=independent)
DESIGNER_JWT_SECRET=designer_secret
DESIGNER_AUTH_DB=designer_users

ENGINE_JWT_SECRET=engine_secret
ENGINE_AUTH_DB=engine_users

PORTAL_JWT_SECRET=portal_secret
PORTAL_AUTH_DB=portal_users

# SSO/LDAP Integration (optional)
ENABLE_SSO=true
SSO_PROVIDER=ldap|saml|oauth
LDAP_URL=ldap://internal.corp
LDAP_BIND_DN=cn=admin,dc=corp
LDAP_BIND_PASSWORD=password

# Public Portal Options
ALLOW_SELF_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_OAUTH=google,github
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## Summary

The three applications work together as follows:

1. **Process Designer** creates the blueprint (BPMN XML)
2. **Execution Engine** orchestrates the workflow and manages state
3. **Public Portal** provides the user interface for citizens to interact

The **BPMN XML** is the central contract that defines:
- What forms citizens see
- How data flows through the system
- Who performs each task
- When notifications are sent
- How approvals are handled

This separation allows:
- **Flexibility**: Change processes without coding
- **Scalability**: Each app can scale independently
- **Maintainability**: Clear separation of concerns
- **Reusability**: Same engine can run any process defined in XML
