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

## Setup Note
Administrators must be manually added to the Firebase Authentication users list with the "Email/Password" provider enabled.