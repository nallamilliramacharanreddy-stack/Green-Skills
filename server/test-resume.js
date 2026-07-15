const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function run() {
  const form = new FormData();
  form.append('resume', Buffer.from('My resume text with solar, wind, and sustainability'), { filename: 'resume.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

  try {
    const response = await axios.post('https://green-skills-api.onrender.com/api/ai/resume-match', form, {
      headers: form.getHeaders()
    });
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch(e) {
    console.log('Error status:', e.response?.status);
    console.log('Error data:', e.response?.data);
  }
}

run();
