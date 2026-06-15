# Empowering Rural Communities through Digital Green Skill Development and Job Matching

A full-stack platform designed to bridge the gap between rural communities and the green economy.

## Features
- **Multi-role Dashboards**: Students, Admins, Guides, and Support Team.
- **Green Skill Courses**: Specialized learning modules for sustainability.
- **Job Matching**: Connect with verified companies looking for rural talent.
- **AI Career Guide**: 24/7 AI-powered mentorship and doubt solving.
- **Analytics**: Visual progress tracking and learning statistics.
- **Quiz System**: Interactive MCQs with leaderboard and timers.
- **Responsive Design**: Modern, glassmorphic UI optimized for all devices.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT, Google Login (Placeholder)

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running locally

### Quick Start (Workspace Commands)
You can install and run the entire project from the root folder:

1. **Install all dependencies** (installs root, client, and server in one go):
   ```bash
   npm run install-all
   ```

2. **Configure environment variables**:
   Create a `.env` file inside the `server` folder (a template or active `.env` is already configured for localhost).

3. **Seed the database and admin account**:
   ```bash
   # Seed course data
   npm run seed:server
   
   # Seed/update the master admin user (nallamilliramacharanreddy@gmail.com / AdminPassword123!)
   npm run seed-admin
   ```

4. **Start both Backend & Frontend concurrently**:
   ```bash
   npm run dev
   ```
   - Frontend will run on `http://localhost:5173`
   - Backend will run on `http://localhost:5001`

### Helper Scripts (Run from Root)
- `npm run check-db`: Verifies the database connection and lists registered users.
- `npm run purge-jobs`: Purges default employer jobs.


## Folder Structure
- `client/`: React frontend source code.
- `server/`: Express backend source code.
- `server/models/`: Mongoose schemas.
- `server/controllers/`: Business logic for API endpoints.
- `server/routes/`: API endpoint definitions.

## License
MIT License
