# Matsu Matcha B2B Dashboard - Project TODO

## Authentication & Security
- [x] Role-based access control (Admin, Operations, Finance, View-Only)
- [x] Audit logging for all user actions
- [x] Confidential data warnings and labels
- [x] Secure session management

## Data Entry Forms
- [x] Client management (name, contact, details)
- [x] Supplier management (Japanese suppliers)
- [x] Matcha SKU management (grade, quality tier)
- [x] Cost pricing inputs (JPY, exchange rate, shipping, tax)
- [x] Auto-calculated landed costs and profit margins
- [x] Editable pricing and discount fields

## Inventory Management
- [x] Central inventory table (Supplier → SKU → Stock)
- [x] Allocated vs unallocated stock tracking
- [x] Visual low-stock indicators
- [x] Real-time status updates
- [x] Supplier-level stock overview

## Profitability Engine
- [x] Margin calculation per SKU, supplier, client
- [x] Profitability ranking system
- [x] Low-margin detection and alerts
- [x] Cost breakdown analysis

## AI Recommendations
- [x] Higher-profitability matcha suggestions
- [x] Quality-matching recommendations
- [x] Margin improvement explanations
- [x] Alternative product suggestions

## Demand Forecasting
- [x] Monthly demand projections per client/SKU
- [x] Reorder suggestions based on inventory
- [x] Lead time considerations
- [x] Historical pattern analysis

## Version Control
- [x] Change versioning for all data
- [x] Rollback to previous versions
- [x] Side-by-side comparison view
- [x] Timestamp and editor tracking

## Analytics Dashboard
- [x] Monthly profit trend charts
- [x] Supplier comparison charts
- [x] Inventory burn-down visualization
- [x] Client contribution analysis
- [x] Forecast vs actual tracking

## AI Chat Interface
- [x] Natural language query support
- [x] Pricing scenario analysis
- [x] Formula modification requests
- [x] Business model improvements

## Notifications
- [x] Low inventory alerts
- [x] Pricing change notifications
- [x] Profitability anomaly detection

## UI/UX
- [x] Elegant professional design
- [x] Dark theme with matcha accents
- [x] Dashboard layout with sidebar
- [x] Responsive desktop-first design
- [x] Confidential system warnings


## Bug Fixes
- [x] Fix AI chat functionality

## AI Chat Enhancements
- [x] Real-time scenario analysis engine
- [x] Interactive data visualizations in chat responses
- [x] What-if pricing scenario charts
- [x] Margin impact analysis with visual feedback
- [x] Dynamic calculation displays
- [x] Comparison tables for scenarios

## Security Enhancements

### Access Control
- [x] Enforce RBAC with Admin, Operations, Finance, Read-only roles
- [x] Restrict sensitive views (costs, margins, supplier terms) by role
- [x] Block all anonymous/public access

### Data Protection
- [x] Secure storage indicators for sensitive data
- [x] Prevent data leakage across roles and sessions
- [x] Role-based data filtering in API responses

### Session & Interface Security
- [x] Automatic session timeout after inactivity
- [x] Manual panic/lock screen mode to blur sensitive values
- [x] User identity watermark on dashboard
- [x] Prevent browser caching of sensitive pages

### Versioning & Audit Trail
- [x] Log all pricing, inventory, forecast changes
- [x] Record user, timestamp, previous/new values
- [x] Enable rollback while preserving audit history

### Environment Separation
- [x] Separate simulation mode from live data
- [x] Require explicit confirmation for simulation-to-live changes

### AI Safety & Data Boundaries
- [x] AI agents respect user role permissions
- [x] AI outputs filtered by user authorization level
- [x] No external data sharing without consent

### Confidentiality Signaling
- [x] CONFIDENTIAL label on all pages
- [x] Visual cues for sensitive data (icons, warnings)
- [x] Confirm before exporting/downloading data

### Final Security Rule
- [x] Block/warn features that risk data leakage or unauthorized access

## Sample Data
- [x] Add sample suppliers (Japanese matcha farms)
- [x] Add sample matcha SKUs with grades
- [x] Add sample B2B clients (cafes, restaurants)
- [x] Add sample inventory data
- [x] Add sample pricing with margins
- [x] Add sample orders

## RBAC System Implementation (Completed)
### Database & Schema
- [x] Update User model with new role field (super_admin, manager, employee, business_client)
- [x] Create role permissions mapping table

### Backend Middleware
- [x] Create role verification middleware/guards
- [x] Implement Super Admin: unrestricted access, user management, system settings
- [x] Implement Manager: operational data, financial reports, staff management (no system config)
- [x] Implement Employee: inventory view/update, orders create/process (no financial, user mgmt, AI)
- [x] Implement Business Client: view-only dashboard, AI predictions for their account only

### Frontend UI
- [x] Dynamic sidebar navigation based on role
- [x] Hide/show buttons and actions based on permissions
- [x] Role-specific dashboard views
- [x] AI Prediction route locked to Business Client and Admin only

### Testing
- [x] Test all role permissions (53 tests passing)
- [x] Verify API guards work correctly

## User Management UI (Completed)
- [x] Create User Management page for Super Admins
- [x] Display all users with their current roles
- [x] Add role assignment dropdown for each user
- [x] Link Business Client users to client accounts
- [x] Add user search and filtering
