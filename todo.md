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

## Real Product Data Update
- [x] Browse matsumatcha.com for product information
- [x] Update database with real Matsu Matcha products
- [x] Replace sample data with actual product catalog

## Bug Fixes
- [x] Fix duplicate header/toolbar on User Management page

## Comprehensive Data Field Implementation (Completed)

### A. Client & Product Information
- [x] Client Name (text, required, unique)
- [x] Matcha Powder Name/SKU (text, required)
- [x] Supplier Name (text, required)
- [x] Matcha Quality Tier dropdown (Standard/Premium/Seasonal)

### B. Cost & Pricing Inputs
- [x] Cost Price per kg (JPY) - required
- [x] Currency Exchange Rate (JPY → SGD) - editable with default
- [x] Shipping Fee per kg (SGD) - default $15
- [x] Import Tax Rate (%) - default 9%
- [x] Import Tax Amount (SGD) - calculated
- [x] Total Landed Cost per kg (SGD) - calculated
- [x] Selling Price per kg (SGD) - editable
- [x] Special Client Discount (%) - optional
- [x] Profit per kg (SGD) - calculated

### C. Volume & Profitability
- [x] Monthly Purchase Quantity (kg) - required
- [x] Total Profit per Month (SGD) - calculated
- [x] Annualized Profit (SGD) - calculated

### D. Inventory Status
- [x] Existing Inventory in Stock (kg)
- [x] Allocated Inventory (kg)
- [x] Unallocated Inventory (kg) - calculated

### E. Ordering & Logistics Timeline
- [x] Last Order Date
- [x] Last Stock Arrival Date
- [x] Days Until Next Order - calculated
- [x] Quantity Required to Fulfill (kg) - calculated
- [x] Ordering Cadence dropdown (1 month/2 months)
- [x] Next Delivery Date (Client)

### F. Data Behavior & Validation
- [x] Numeric field validation (reject invalid values)
- [x] Real-time calculated field updates
- [x] Warning: Negative profit per kg
- [x] Warning: Insufficient inventory to meet demand
- [x] Warning: Missed reorder windows
- [x] Version control for all edits
- [x] Audit trail for data changes

## UI Changes (Jan 31) - Completed
- [x] Delete AI Assistant page from navigation and routes
- [x] Add comprehensive profit calculator to Pricing Management page
  - [x] Cost price in JPY
  - [x] Shipping fee ($15/kg)
  - [x] Currency exchange rate (JPY→SGD)
  - [x] 9% import tax calculation
  - [x] Total cost price per kg
  - [x] Selling price per kg
  - [x] Special client discount
  - [x] Profit per kg
  - [x] Monthly purchase quantity (kg)
  - [x] Total monthly profit from client
  - [x] Existing inventory in stock (kg)
  - [x] Last order date
  - [x] Last stock arrival date
  - [x] Days to next order
  - [x] Quantity required to fulfill (kg)
  - [x] Next delivery date for client
  - [x] AI recommendation for higher profitability matcha swaps (same/better quality)
- [x] Add revert button for each product to restore previous versions

## Updates (Jan 31 - Batch 2)
- [x] Replace all products with real matsumatcha.com products (grade, price, quality)
- [x] Add note: Matsu Matcha can edit/improve this engine by interacting with Manus
- [x] Change Analytics revenue trend to line graph (already implemented)
- [x] Remove AI Predictions page
- [x] Remove duplicate clients and products in Pricing page
- [x] Remove Simulation Mode feature
- [x] Fix product revert function in Product Catalog (already working)
- [x] Remove duplicate suppliers in Supplier Management page


## Inventory & Orders Enhancement (Jan 31)
- [x] Add "Add Inventory" button/dialog to Inventory Management page
- [x] Allow users to add stock for products (quantity, threshold, notes)
- [x] Generate sample inventory data for all 11 products (315.5 kg total stock)
- [x] Add "Create Order" button/dialog to Orders page (already existed)
- [x] Allow users to create new client orders (already existed)
- [x] Generate sample orders data for clients (14 orders with various statuses)
