# NGO Connect Platform

> **Internship Project | ZYNVEX Solutions**
> 
> Developed by **Esha Eman** (Internship ID: ZYNVEX-CERT-0354)  
> Program: Frontend Development | Duration: 6 Weeks

---

## Project Overview

NGO Connect is a full-stack web application built to bridge the gap between NGOs and volunteers. The platform provides a centralized system where NGOs can register, post volunteer opportunities, and manage incoming applications, while volunteers can discover opportunities, apply seamlessly, and track their application status in real-time. An administrator oversees the entire ecosystem — approving NGO registrations, managing complaints, and ensuring platform integrity.

This project was developed as the final deliverable for the ZYNVEX Solutions Frontend Development Internship Program.

---

## Live Demo

**Deployed URL**: https://ngo-connect-platform.vercel.app?_vercel_share=qoy5yEtGMwRz3eBu7bJxVclfZBmzIhaS

**GitHub Repository**: [https://github.com/eshaeman003/ngo-connect-platform](https://github.com/eshaeman003/ngo-connect-platform)

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React.js + JavaScript | UI components and state management |
| **Styling** | Custom CSS (per-page stylesheets) | Responsive, aesthetic UI design |
| **Routing** | React Router DOM v6 | Client-side navigation |
| **Build Tool** | Vite | Fast development and optimized production builds |
| **Backend / Database** | Supabase | Authentication, PostgreSQL database, realtime subscriptions |
| **Icons** | Native Emojis | Lightweight, dependency-free iconography |
| **Deployment** | Vercel | CI/CD and production hosting |
| **Version Control** | Git + GitHub | Source code management |

> **Note**: This project uses **custom CSS** for styling rather than Tailwind CSS, as per the design requirements for granular control over the aesthetic and animations.

---

## Architecture & Project Structure

```
go-connect-platform/
├── public/
│   └── index.html
├── src/
│   ├── Pages/                    # All route-level pages
│   │   ├── Home.jsx              # Landing page
│   │   ├── Login.jsx             # Unified login (Volunteer / NGO / Admin)
│   │   ├── Register.jsx          # Registration page
│   │   ├── NGODashboard.jsx      # NGO control panel
│   │   ├── VolunteerDashboard.jsx# Volunteer control panel
│   │   ├── AdminDashboard.jsx    # Admin NGO approval panel
│   │   ├── AdminComplaints.jsx   # Admin complaint management
│   │   ├── Opportunities.jsx     # Browse all opportunities
│   │   ├── ApplyPage.jsx         # Volunteer application form
│   │   ├── OpportunityCreate.jsx # NGO post new opportunity
│   │   ├── OpportunityEdit.jsx   # NGO edit opportunity
│   │   ├── NGOProfile.jsx        # NGO profile settings
│   │   └── VolunteerProfile.jsx  # Volunteer profile settings
│   ├── Components/               # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx    # Role-based route guards
│   ├── utils/
│   │   └── supabase.js           # Supabase client configuration
│   ├── App.jsx                   # Root component with routes
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── .env                          # Environment variables (not committed)
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## Key Features Implemented

### Volunteer Experience
- Secure registration and login with role-based routing
- Browse and search volunteer opportunities by NGO, location, or keywords
- One-click application with cover letter submission
- Real-time application status tracking (Pending → Approved → Rejected)
- Personalized dashboard with application history

### NGO Experience
- Registration workflow with admin approval gate
- Complete profile management (category, location, contact details)
- CRUD operations for volunteer opportunities
- Incoming applications viewer with applicant details
- Complaint monitoring against their organization
- Real-time notification bell for new applications and alerts

### Admin Experience
- Centralized NGO approval / rejection system
- Full complaint management with status workflow (Pending → Reviewed → Resolved)
- Legal notice and warning letter dispatch to NGOs
- Visual statistics dashboard (donut charts, activity feeds, stat cards)
- Search and filter across all complaints

### System-Wide
- Fully responsive design (desktop, tablet, mobile)
- Real-time updates via Supabase subscriptions
- Toast notifications for user feedback
- Protected routes with authentication guards
- Clean aesthetic UI with gradient accents and smooth animations

---

### Test Credentials

To evaluate the platform, please use the following pre-registered accounts or you can create your own accounts:

| Role | Email | Password | What to Test |
|------|-------|----------|--------------|
| **Administrator** | `admin@ngoconnect.com` | `admin123!` | NGO approvals, complaint management, legal notices, dashboard stats |
| **NGO** | `eshango2027@test.com` | `ESHA123` | Post opportunities, view applications, check complaints, edit profile |
| **Volunteer** | `eshatest13@test.com` | `test123` | Browse opportunities, apply, track applications, view dashboard |

> **Note**: These accounts are seeded in the Supabase authentication system and linked to corresponding profiles in the database.

---

## Local Setup (For Code Review)

If you wish to run this project locally:

```bash
# 1. Clone the repository
git clone https://github.com/eshaeman003/ngo-connect-platform.git

# 2. Navigate to the project
cd ngo-connect-platform

# 3. Install dependencies
npm install

# 4. Configure environment variables
# Create a .env file in the root directory with:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# 5. Start the development server
npm run dev

# 6. Build for production
npm run build
```

**Prerequisites**: Node.js v18+, npm, and a modern web browser.

---

## Acknowledgements

This project was developed under the guidance and mentorship of the **ZYNVEX Solutions** team as part of the Frontend Development Internship Program. Special thanks to my mentor "Muhammad Usman"  for their continuous support, feedback, and technical guidance throughout the 6-week development cycle.

- **Organization**: ZYNVEX Solutions
- **Intern**: Esha Eman
- **Internship ID**: ZYNVEX-CERT-0354
- **Program**: Frontend Development
