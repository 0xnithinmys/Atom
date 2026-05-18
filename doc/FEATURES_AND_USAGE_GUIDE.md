# Atom Portal - Complete Feature Documentation

## 1. Product Overview
Atom is an internal performance management portal for:
- Defining yearly goals
- Assigning weightage (total 100%)
- Manager approval and rework loops
- Quarterly achievement check-ins
- Shared goals/KPI cascades
- Escalation tracking and admin controls
- Reporting and exports
- AI-assisted goal drafting and quality checks

## 2. User Roles and Access

### EMPLOYEE
Primary capabilities:
- Dashboard summary for own goals
- Create goals (up to 8)
- Edit/submit own draft/rework goals
- Track goal details and achievement history
- Log quarterly achievements (when check-in window is open)
- Use AI tools while creating goals
- Receive/view notifications

Sidebar (Employee):
- Dashboard
- New Goal
- My Goals
- Check-ins
- Notifications

### MANAGER
Primary capabilities:
- Everything needed to monitor team performance
- Approve/rework submitted goals
- Add check-in comments on achievements
- Push shared goals to recipients
- View reports and exports
- Team indicators on dashboard

Sidebar (Manager):
- Dashboard
- Approve Goals
- Shared Goals
- Team Goals
- Check-ins
- Notifications
- Reports

### ADMIN
Primary capabilities:
- All manager-level visibility + system controls
- Configure performance cycles
- Open/close goal and check-in windows
- Unlock goals to draft for exceptions
- Configure escalation rules
- Run escalation evaluation manually
- Resolve escalation events with comments
- View admin analytics and audit trails

Sidebar (Admin):
- Dashboard
- Approve Goals
- Shared Goals
- Check-ins
- Notifications
- Reports
- Escalations
- Admin Panel

## 3. Authentication
Login page: `/login`
- Credentials login using email/password
- Session stored using NextAuth JWT strategy
- On successful login, user redirected into app shell

Default seeded users (if seed run):
- Admin: `admin@atom.com` / `admin123`
- Manager: `manager@atom.com` / `manager123`
- Employee: `employee@atom.com` / `employee123`

## 4. Main App Screens and How to Use

### 4.1 Dashboard (`/dashboard`)
Purpose:
- One-stop summary view

What it shows:
- My goals count, status split, weightage status
- Role-based quick actions
- Recent activity (audit log)
- For manager/admin: team metrics, pending/delayed approvals, check-in risk
- AI manager summary block (derived summary text)
- Org hierarchy and shared-goal dependency map (when data exists)

How to use:
1. Review stat cards for current cycle health.
2. Use quick actions to jump into creation, approvals, check-ins, reports, or admin tools.
3. For manager/admin, monitor delays and check-in risk before quarter deadlines.

### 4.2 New Goal (`/goals/new`) - Employee
Purpose:
- Create a new performance goal

Fields:
- Thrust area
- Title
- Description
- UoM type (MIN, MAX, TIMELINE, ZERO)
- Target or target date
- Weightage

Validation rules:
- Minimum goal weightage: 10%
- Total weightage across goals cannot exceed 100%

AI tools:
- AI Goal Suggestion: proposes a SMART-format goal draft
- Goal Quality Check: scores and improves existing draft

How to use:
1. Select thrust area and UoM type first.
2. Enter measurable target and weightage.
3. Ensure projected total stays <= 100%.
4. Optionally run AI suggestion/checker.
5. Save goal.

### 4.3 My Goals (`/goals`) - Employee / Team view for manager route
Purpose:
- View own + shared goals for current cycle

Capabilities:
- See status badges (DRAFT, SUBMITTED, APPROVED, REWORK)
- Track total weightage and goal count
- Submit all draft goals when total weightage == 100%
- Open detail pages

How to use:
1. Confirm total weightage exactly 100%.
2. Submit draft goals for approval.
3. Open individual goals for detailed lifecycle actions.

### 4.4 Goal Detail (`/goals/[id]`)
Purpose:
- Full lifecycle management of a specific goal

Employee actions:
- Submit draft
- Resubmit from rework
- Log quarterly achievements on approved goals

Manager/Admin actions:
- Approve or mark rework for submitted goals
- Add check-in comments on achievements

Shared-goal recipient behavior:
- Can update only assigned weightage for shared instance

How to use:
1. Review goal metadata and achievement trend.
2. Use status actions based on role.
3. Log or comment on quarter achievements as needed.

### 4.5 Approve Goals (`/goals/approve`) - Manager/Admin
Purpose:
- Bulk review queue for submitted goals

Capabilities:
- Approve or send to rework
- Override target and/or weightage during approval
- Jump to goal detail
- Queue stats: pending count, employees impacted, avg goal weight, thrust area spread

How to use:
1. Open submitted item.
2. Optional override target/weight.
3. Approve if acceptable; otherwise rework.

### 4.6 Shared Goals (`/goals/shared`) - Manager/Admin
Purpose:
- Push one KPI/goal to multiple employees

Capabilities:
- Select source goal
- Select recipients
- Set recipient-specific weightage
- Push shared goal links

How to use:
1. Pick source goal.
2. Select recipients.
3. Adjust recipient weightage.
4. Push shared goal.

### 4.7 Check-ins (`/checkin`)
Purpose:
- Quarterly achievement tracking and manager commentary

What it supports:
- Shows active cycle quarter window (Q1/Q2/Q3/Q4)
- Employee: log achievements only in active quarter window
- Manager/Admin: add check-in comments per achievement

How to use:
1. Select goal from left panel.
2. Review prior quarters and comments.
3. Employee logs actual + status for active quarter.
4. Manager adds comment against selected achievement.

### 4.8 Notifications (`/notifications`)
Purpose:
- Personal escalation delivery log

Shows:
- Timestamp
- Rule type
- Escalation level
- Event status
- Channel and delivery status
- Notification message

How to use:
1. Open page.
2. Click Refresh to fetch latest notifications.
3. Use as evidence trail for escalations sent to your account.

### 4.9 Reports & Analytics (`/reports`) - Manager/Admin
Purpose:
- Cross-user performance analytics + exports

Features:
- Summary metrics (goals, approvals, avg score, employees)
- QoQ trend cards and momentum deltas
- Thrust-area heatmap cards
- Search + status + thrust filters
- Detailed tabular score view (Q1..Q4)
- Export CSV
- Export Excel

How to use:
1. Filter by status/thrust/search.
2. Validate quarter trend signals.
3. Export filtered data for review meetings.

## 5. Admin Modules

### 5.1 Admin Panel (`/admin`)
Purpose:
- Organization and audit overview dashboard

Features:
- User list + role + goal count
- Recent goals status table
- Audit trail table
- Top-level admin quick actions

### 5.2 Configure Cycles (`/admin/cycles`)
Purpose:
- Manage performance cycle years and window toggles

Features:
- Create cycle by year
- Set active cycle
- Toggle goals window open/locked
- Toggle check-ins open/closed

How to use:
1. Create future FY cycle.
2. Set exactly one cycle active.
3. Open/close windows according to process timeline.

### 5.3 Unlock Goals (`/admin/unlock-goals`)
Purpose:
- Exception handling for previously submitted/approved goals

Features:
- Unlock target goal back to draft
- Mandatory unlock reason
- Unlock history table (who unlocked what and when)

### 5.4 Escalation Center (`/admin/escalations`)
Purpose:
- Full escalation operations console

Features:
- Rule config (`GOAL_NOT_SUBMITTED`, `GOAL_PENDING_APPROVAL`, `CHECKIN_NOT_COMPLETED`)
- Enable/disable and threshold days per rule
- Manual “Run Escalation Check” execution
- Event filter by status/rule/search
- Inline resolve workflow with resolution comment UI
- Time-to-resolution and dispatch history visibility

How to use:
1. Set thresholds and save rules.
2. Run evaluation when needed.
3. Resolve open events with a concrete comment.

## 6. Goal Lifecycle and Statuses
Goal status values:
- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REWORK`

Typical flow:
1. Employee creates draft goals.
2. Employee ensures 100% total and submits.
3. Manager approves or reworks.
4. Approved goals progress through quarterly achievements.
5. Managers add check-in commentary.

Achievement status values:
- `NOT_STARTED`
- `ON_TRACK`
- `COMPLETED`

## 7. Escalation Lifecycle
Escalation event status:
- `OPEN`
- `RESOLVED`

Escalation level semantics:
- `1`: Employee level
- `2`: Manager level
- `3`: Skip-level/Admin path

Dispatch channels:
- `IN_APP`
- `EMAIL`

Delivery statuses:
- `SENT`
- `FAILED`
- `SKIPPED`

## 8. AI Features

### 8.1 Goal Suggestion and Quality Checker
Location: New Goal page
- Uses `/api/chat`
- Helps draft better SMART goals and assess quality

### 8.2 Copilot Widget
Global floating assistant in app shell
- Quick prompts for SMART goals, weightage strategy, achievement logging, feedback writing
- Streams response text

## 9. API Reference (Functional Map)

Auth:
- `GET/POST ...` `/api/auth/[...nextauth]`

Cycle:
- `GET` `/api/cycle`

Goals:
- `GET` `/api/goals`
- `POST` `/api/goals`
- `GET` `/api/goals/[id]`
- `PATCH` `/api/goals/[id]`

Achievements / Check-ins:
- `POST` `/api/achievements`
- `POST` `/api/checkins`

Shared goals:
- `GET` `/api/shared-goals`
- `POST` `/api/shared-goals`
- `PATCH` `/api/shared-goals/[id]`

Reports:
- `GET` `/api/reports`

Notifications:
- `GET` `/api/notifications`

AI Chat:
- `POST` `/api/chat`

Admin cycles:
- `GET` `/api/admin/cycles`
- `POST` `/api/admin/cycles`
- `PATCH` `/api/admin/cycles/[id]`

Admin unlocks:
- `GET` `/api/admin/unlocks`
- `POST` `/api/admin/unlocks`

Admin escalation rules:
- `GET` `/api/admin/escalation-rules`
- `PATCH` `/api/admin/escalation-rules`

Admin escalations:
- `GET` `/api/admin/escalations`
- `POST` `/api/admin/escalations` (manual evaluate)
- `PATCH` `/api/admin/escalations/[id]` (resolve/open update)

## 10. Operational Notes
- All authenticated pages are under `(app)` layout.
- Sidebar is role-aware and collapsible.
- Goal and check-in behavior is cycle-aware.
- Escalation evaluation can run scheduler-driven and manually.
- Exports support manager/admin reporting workflows.

## 11. Onboarding Checklist for New Users
1. Login with assigned role credentials.
2. Open Dashboard and verify current cycle state.
3. If employee: create goals, hit 100% weightage, submit.
4. If manager: review approvals queue and check-ins.
5. If admin: verify cycle windows, escalation rules, and unlock governance.
6. Use Notifications page for escalation delivery traceability.
7. Use Reports for periodic review and export.

## 12. Troubleshooting
- If login fails with DB timeout, verify DB URL formatting and connectivity.
- If goals cannot be submitted, check total weightage and cycle goal window state.
- If check-in logging is disabled, verify active check-in quarter window.
- If escalation list is empty unexpectedly, run manual escalation evaluation from admin escalations page.


