# NGO Connect Platform

A web-based platform that connects NGOs with volunteers through a centralized and user-friendly system. NGOs can register, post volunteer opportunities, and manage applications. Volunteers can discover opportunities, apply, and track their application status.

##  Features

- **NGO Discovery**: Browse and search NGOs by name and category
- **Volunteer Opportunities**: Find and apply for volunteer positions
- **Application Tracking**: Track application status (Pending/Approved/Rejected)
- **User Authentication**: Login/Register as Volunteer or NGO
- **Responsive Design**: Works on desktop, tablet, and mobile

##  Tech Stack

- **Frontend**: React.js, JavaScript, Tailwind CSS
- **Routing**: React Router DOM
- **Backend**: Supabase (Authentication, Database)
- **Deployment**: Vercel

##  Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/eshaeman003/ngo-connect-platform.git

# Navigate to project
cd ngo-connect-platform

# Install dependencies
npm install

# Create .env file
# Add your Supabase credentials:
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key

# Start development server
npm run dev
npm run build

# Database Schema
profiles: User profiles (volunteers & NGOs)
ngos: NGO organizations
opportunities: Volunteer opportunity listings
applications: Volunteer applications

#UI/UX Design
Wireframes and layout designs are available in src/data/wireframes.md

 #Intern Profile
Name: Esha Eman
Internship ID: ZYNVEX-CERT-0354
Role: Frontend Developer Intern
Organization: ZYNVEX Solutions
Duration: 6 Weeks

#License
This project is part of ZYNVEX Solutions Internship Program.
