const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const models = [
  'Analytics', 'Application', 'ChatHistory', 'Contest', 'Course', 
  'Job', 'MentorSession', 'Notification', 'Quiz', 'Result', 
  'Review', 'Roadmap', 'Ticket', 'User'
];

async function auditDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    let report = '# Database Inventory Report\n\n';
    report += '| Collection | Record Count |\n';
    report += '|---|---|\n';

    for (const modelName of models) {
      try {
        const Model = require('./models/' + modelName);
        const count = await Model.countDocuments();
        report += `| ${modelName} | ${count} |\n`;
      } catch (err) {
         report += `| ${modelName} | ERROR: ${err.message} |\n`;
      }
    }

    fs.writeFileSync('../brain_audit_db.md', report);
    console.log('Audit complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to DB', error);
    process.exit(1);
  }
}

auditDb();
