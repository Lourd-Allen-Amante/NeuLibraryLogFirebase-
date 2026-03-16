# New Era INC Library - Visitor Log System

A secure, high-performance visitor check-in and administration system for the New Era INC Library.

## Features
- **Visitor Terminal**: Secure check-in for registered students with real-time verification and block-list checks. Supports both Institutional ID (00-00000-000) and NEU Email identification.
- **Admin Console**: Comprehensive dashboard for library administrators.
  - **Real-time Analytics**: Visual data representations including Visitation Trends (Line Chart), College Distribution (Bar Chart), and Activity Breakdowns (Pie Chart).
  - **Detailed Visitor Logs**: Searchable and filterable logs with specific tracking for Visitor Name, School ID, Purpose, College, and Role.
  - **PDF Report Generation**: Export professional PDF reports for Today, the Last 7 Days, or the Last 30 Days using `jsPDF`.
  - **Visitor Registry Management**: Register new patrons with auto-formatting ID validation and administratively block/unblock access.
- **Security**: Robust Firebase Security Rules and Email/Password authentication for authorized personnel.
- **Branding**: Institutional alignment with New Era University color schemes and typography.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database/Auth**: Firebase Firestore & Authentication
- **Styling**: Tailwind CSS & ShadCN UI
- **Charts**: Recharts
- **PDF Generation**: jsPDF & AutoTable
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Authorized Administrators
The following emails are authorized for Admin Console access:
- `jcesperanza@neu.edu.ph`
- `lourdallen.amante@neu.edu.ph`
- `neulibrarian@neu.edu.ph`

## How to Use

### 1. Initial Firebase Setup
To get the system running, you must configure your Firebase project:
1.  **Enable Authentication**: Go to the Firebase Console > Authentication > Sign-in method. Enable the **Email/Password** provider.
2.  **Create Admin Accounts**: In the Users tab of Authentication, manually add the authorized emails listed above. Set a secure password for each (e.g., `Admin123`).
3.  **Firestore Database**: Create a Firestore database in "Production Mode". The security rules provided in the project will automatically secure it.
4.  **Authorized Domains**: If running on a cloud workstation, add your workstation's domain to the "Authorized domains" list in Authentication > Settings.

### 2. Registering Patrons
Before students can check in at the terminal, they must be in the registry:
1.  Log in to the **Admin Console**.
2.  Navigate to the **Manage Visitors** tab.
3.  Use the **New Registration** form to add a student. The Institutional ID will auto-format to `00-00000-000`.
4.  Once added, the student is immediately eligible to use the terminal.

### 3. Visitor Terminal Operation
The terminal is intended for a public-facing tablet or kiosk:
1.  Launch the **Visitor Terminal** from the landing page.
2.  The student chooses their identification method (School ID or Email).
3.  Upon successful verification, they select their **Purpose of Visit**.
4.  A success screen appears, and the terminal resets automatically after 5 seconds.

### 4. Administration & Reporting
1.  Access the **Admin Console** using your admin credentials.
2.  **Statistics**: View real-time trends and college distributions. Use the filters to drill down into specific dates or departments.
3.  **Logs**: View the master list of all library entries.
4.  **Export**: Click "Export PDF" in the logs tab to generate a professional report for the selected period.

## Security Note
Administrators must be manually added to the Firebase Authentication users list with the "Email/Password" provider enabled. Access to the `/admin` route is strictly enforced via both client-side checks and server-side Firebase Security Rules.
