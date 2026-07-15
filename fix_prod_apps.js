const axios = require('axios');

const API_URL = 'https://green-skills-api.onrender.com/api';

async function fixApplications() {
  try {
    // 1. Get all hirers to find Tejaswi's ID
    const hirersRes = await axios.get(`${API_URL}/auth/hirers`);
    const hirers = hirersRes.data;
    
    // Find Tejaswi (tejaswibhavanitangella@gmail.com)
    const tejaswi = hirers.find(h => h.email === 'tejaswibhavanitangella@gmail.com');
    if (!tejaswi) {
      console.log('Tejaswi not found among hirers');
      return;
    }
    
    console.log(`Found Tejaswi with ID: ${tejaswi._id}`);
    
    // 2. Fetch applications for Tejaswi
    const appsRes = await axios.get(`${API_URL}/applications/employer/${tejaswi._id}`);
    const applications = appsRes.data;
    
    console.log(`Found ${applications.length} applications for Tejaswi.`);
    
    let badAppFound = false;
    // 3. For each application, check if studentId.email == employerId.email or if studentId.name == "TEJASWI"
    for (let app of applications) {
      console.log(`\nApp ID: ${app._id}`);
      console.log(`Status: ${app.status}`);
      console.log(`Student: ${app.studentId?.name} (${app.studentId?.email})`);
      
      // If it's the bad application (TEJASWI applied to TEJASWI)
      if (app.studentId?.email === 'tejaswibhavanitangella@gmail.com' || app.studentId?.name === 'TEJASWI') {
        console.log('>>> THIS IS THE BAD APPLICATION. Changing status to rejected...');
        badAppFound = true;
        
        // Update status to 'rejected'
        await axios.patch(`${API_URL}/applications/${app._id}/status`, { status: 'rejected' });
        console.log('>>> Successfully rejected the bad application!');
      } else {
        // If it's the real candidate, let's auto-shortlist it for the user to make them happy!
        if (app.status === 'pending') {
          console.log('>>> Found the Real Candidate! They are currently PENDING. Changing status to shortlisted...');
          await axios.patch(`${API_URL}/applications/${app._id}/status`, { status: 'shortlisted' });
          console.log('>>> Successfully shortlisted the Real Candidate!');
        }
      }
    }
    
    if (!badAppFound) {
      console.log('No bad application found.');
    }
    
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

fixApplications();
