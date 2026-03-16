# New Era INC Library - Visitor Log System

A secure, high-performance visitor check-in and administration system for the New Era INC Library.

## Features
- **Visitor Terminal**: Secure check-in for registered students with real-time verification and block-list checks. Supports both Institutional ID (00-00000-000) and NEU Email identification.
- **Admin Console**: Comprehensive dashboard for library administrators.
  - **Real-time Analytics**: Visual data representations including Visitation Trends, College Distribution, and Activity Breakdowns.
  - **Detailed Visitor Logs**: Searchable and filterable logs with specific tracking for Visitor Name, School ID, Purpose, College, and Role.
  - **PDF Report Generation**: Export professional PDF reports for Today, the Last 7 Days, or the Last 30 Days.
  - **Visitor Registry Management**: Register new patrons with auto-formatting ID validation and administratively block/unblock access.
- **Security**: Robust administrative authentication for authorized personnel.
- **Branding**: Institutional alignment with New Era University color schemes and typography.

## User Guide: How to Use the System

### 1. Accessing the Admin Console
Only authorized library staff can access the management dashboard.
1.  From the main landing page, click the **Admin Login** button at the top right, or click the **Admin Console** card.
2.  Enter your authorized institutional email (e.g., `jcesperanza@neu.edu.ph` or `neulibrarian@neu.edu.ph`).
3.  Enter your secure password and click **Verify Credentials**.
4.  Once logged in, you can switch between the **Statistics**, **Visitor Logs**, and **Manage Visitors** tabs.

### 2. Registering a New Student/Patron
Students must be in the library's database before they can use the terminal.
1.  In the Admin Console, go to the **Manage Visitors** tab.
2.  On the right side, fill out the **New Registration** form.
3.  **Note on ID Format**: The system automatically formats the ID for you. Just type the numbers (e.g., `2300001000`) and it will display as `23-00001-000`.
4.  Click **Add to Database**. The student can now immediately check in at any terminal.

### 3. Operating the Visitor Terminal
The terminal is designed for a kiosk or tablet at the library entrance.
1.  Open the **Visitor Terminal** from the landing page.
2.  The student chooses their identification method: **School ID** or **Institutional Email**.
3.  The student enters their ID number or email address and clicks **Verify & Continue**.
4.  If the student is registered and not blocked, they select their **Purpose of Visit** (e.g., Reading Books, Research).
5.  A success screen appears, and the terminal resets automatically for the next visitor.

### 4. Viewing and Exporting Logs
1.  Go to the **Visitor Logs** tab in the Admin Console.
2.  Use the **Search bar** to find a specific student by name or ID.
3.  To download a report for your records, click the **Export PDF** button.
4.  Choose the time period you need (Today, This Week, or Last 30 Days). A professional document will be saved to your device.

### 5. Managing Access (Blocking/Unblocking)
If a student is no longer allowed access to the library:
1.  Go to the **Manage Visitors** tab.
2.  Find the student in the **Registered Patrons** list.
3.  Click **Revoke Access**. The student will be blocked from checking in at the terminal.
4.  To restore access, simply click **Unblock Access** in the same list.

---

## Technical Information (For IT Staff)

### Authorized Administrators
The following emails are pre-authorized for Admin Console access:
- `jcesperanza@neu.edu.ph`
- `lourdallen.amante@neu.edu.ph`
- `neulibrarian@neu.edu.ph`

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database/Auth**: Firebase Firestore & Authentication
- **Styling**: Tailwind CSS & ShadCN UI
- **Charts**: Recharts
- **PDF Generation**: jsPDF & AutoTable
- **Icons**: Lucide React
- **Date Handling**: date-fns
