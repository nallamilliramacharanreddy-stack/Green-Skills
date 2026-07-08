const User = require('../models/User');
const Course = require('../models/Course');
const Job = require('../models/Job');
const ChatHistory = require('../models/ChatHistory');
const GeoVacancy = require('../models/GeoVacancy');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

const generateRoadmap = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Simulated AI Logic for Roadmap
    let recommended = [];
    let steps = [];
    
    if (user.careerGoal?.toLowerCase().includes('solar')) {
      recommended = await Course.find({ category: 'Renewable Energy' }).limit(3);
      steps = ['Digital Literacy', 'Basic Electricity', 'Solar Panel Installation', 'Grid Safety'];
    } else if (user.careerGoal?.toLowerCase().includes('farm')) {
      recommended = await Course.find({ category: 'Sustainable Agriculture' }).limit(3);
      steps = ['Soil Health', 'Organic Fertilizers', 'Pest Management', 'Certification'];
    } else {
      recommended = await Course.find().limit(3);
      steps = ['Communication Skills', 'Basic IT', 'Resume Building'];
    }

    user.roadmap = {
      recommendedCourses: recommended.map(c => c._id),
      nextSteps: steps,
      timeline: '6 Months'
    };

    await user.save();
    res.json(user.roadmap);
  } catch (error) {
    res.status(500).json({ message: 'Error generating roadmap' });
  }
};

const calculateJobMatch = async (req, res) => {
  try {
    const { userId, jobId } = req.query;
    const user = await User.findById(userId);
    const job = await Job.findById(jobId);

    if (!user || !job) return res.status(404).json({ message: 'User or Job not found' });

    // Matching logic
    const userSkills = user.skillsInterested || [];
    const requiredSkills = job.requiredSkills || [];

    const matchedSkills = userSkills.filter(skill => 
      requiredSkills.some(req => req.toLowerCase() === skill.toLowerCase())
    );

    const matchPercentage = requiredSkills.length > 0 
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100) 
      : 0;

    const missingSkills = requiredSkills.filter(skill => 
      !userSkills.some(s => s.toLowerCase() === skill.toLowerCase())
    );

    res.json({
      matchPercentage,
      matchedSkills,
      missingSkills,
      recommendation: matchPercentage > 70 ? 'Strong Match' : 'Upskilling Recommended'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating match' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'UserId is required' });
    
    let history = await ChatHistory.findOne({ user: userId });
    if (!history) {
      history = new ChatHistory({
        user: userId,
        messages: [{ text: "Hello! I am your AI Mentor. How can I guide you today?", isBot: true }]
      });
      await history.save();
    }
    res.json(history.messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { userId, text, currentContext } = req.body;
    if (!userId || !text) return res.status(400).json({ message: 'UserId and text are required' });

    const user = await User.findById(userId)
      .populate('progress.currentCourses')
      .populate('progress.completedCourses');

    if (!user) return res.status(404).json({ message: 'User not found' });

    let history = await ChatHistory.findOne({ user: userId });
    if (!history) {
      history = new ChatHistory({ user: userId, messages: [] });
    }

    // Append user message
    history.messages.push({ text, isBot: false });

    // Call real Gemini API if configured, otherwise degrade gracefully
    let botResponse = "I'm processing your request. Currently, the advanced AI module is analyzing the best learning path for you.";
    
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        // Retrieve last 15 messages for conversational memory
        const recentMessages = history.messages.slice(-15);
        const historyText = recentMessages.map(m => `${m.isBot ? 'AI Mentor' : 'Student'}: ${m.text}`).join('\n');

        // Retrieve courses and milestones
        const currentCoursesList = user.progress?.currentCourses?.map(c => c.title).join(', ') || 'None';
        const completedCoursesList = user.progress?.completedCourses?.map(c => c.title).join(', ') || 'None';
        const quizHistoryList = user.quizScores?.map(q => `Quiz for courseId ${q.courseId}: score ${q.score}/${q.totalQuestions}`).join(', ') || 'No quiz scores recorded';
        const badgeList = user.badges?.map(b => b.name).join(', ') || 'No badges yet';

        const systemPrompt = `You are a fully functional, highly intelligent AI Mentor chatbot for the Digital Green Skills and Job Matching platform.
You act like a combination of ChatGPT, Claude, Gemini, Khan Academy Tutor, Coursera Coach, and Udemy Learning Assistant.

Student Profile & Memory Context:
- Name: ${user.name}
- Email: ${user.email}
- Streak: ${user.ultraStreak?.currentStreak || 0} Days (XP: ${user.ultraStreak?.xp || 0})
- Enrolled/Current Courses: ${currentCoursesList}
- Completed Courses: ${completedCoursesList}
- Quiz History: ${quizHistoryList}
- Badges Earned: ${badgeList}
- Sustainability Score: ${user.sustainabilityScore || 0}
- Career Goals: ${user.careerGoal || 'Green Technology Sector'}
- Preferred Sector/Skills Interested: ${user.skillsInterested?.join(', ') || 'Renewable energy, Eco-friendly farming, ESG'}

Current Module/Context sent by frontend (if any):
${currentContext ? JSON.stringify(currentContext) : 'Not viewing any specific lesson right now.'}

Instructions:
1. Provide real-time tutoring. Answer questions precisely, utilizing green tech analogies, equations, or code blocks where relevant.
2. Maintain strong conversational memory. Use the chat history to reference previous topics, definitions, or code.
3. Help plan studies, review resumes (ATS recommendations), suggest career pathways, or draft daily prep goals.
4. Auto-detect difficulty and sentiment:
   - If the student is motivated, offer advanced trivia/milestones.
   - If the student is frustrated or repeating questions, simplify your explanations, use analogies, and break topics down into smaller steps.
5. If the student requests a practice test or quiz, generate custom MCQs, multiple-select questions, or True/False questions dynamically. Include the correct option index and a detailed transcript-based explanation in markdown.
6. Support multi-language requests (English, Telugu, Hindi, Tamil, Kannada, Malayalam). Write in the user's selected language or respond in the language they write in.
7. Keep responses concise, well-formatted in markdown, and visual.

Conversation History:
${historyText}

Student's Latest Message:
"${text}"

AI Mentor Response:`;

        const result = await model.generateContent(systemPrompt);
        botResponse = result.response.text().trim();
      } catch (geminiError) {
        console.error("Gemini API call failed:", geminiError);
        // Fallback simulated answers
        if (text.toLowerCase().includes("resume")) {
          botResponse = "I can analyze your resume! Please upload it in your dashboard, and I will perform a skill-gap analysis.";
        } else if (text.toLowerCase().includes("job")) {
          botResponse = "Based on your green skills, I recommend checking out the 'Hiring' dashboard for new Solar Technician roles.";
        } else {
          botResponse = "I am having difficulty connecting to my cognitive sync network, but I am still online. How can I help you manual-mode?";
        }
      }
    }

    // Append bot response
    history.messages.push({ text: botResponse, isBot: true });
    await history.save();
    
    res.json(history.messages);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

const clearChatHistory = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'UserId is required' });

    let history = await ChatHistory.findOne({ user: userId });
    if (history) {
      // Store current messages in backup before clearing
      history.backupMessages = history.messages;
      history.messages = [{ text: "Hello! I am your AI Mentor. How can I guide you today?", isBot: true }];
      await history.save();
    }
    res.json({ message: 'Chat history cleared and backed up.' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing chat history' });
  }
};

const restoreChatHistory = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'UserId is required' });

    let history = await ChatHistory.findOne({ user: userId });
    if (history && history.backupMessages && history.backupMessages.length > 0) {
      // Restore from backup
      history.messages = history.backupMessages;
      history.backupMessages = [];
      await history.save();
      return res.json({ success: true, messages: history.messages });
    }
    res.status(400).json({ message: 'No backup found or backup is empty' });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring chat history' });
  }
};

const deleteIndividualMessage = async (req, res) => {
  try {
    const { userId, messageId } = req.body;
    if (!userId || !messageId) return res.status(400).json({ message: 'UserId and messageId are required' });

    let history = await ChatHistory.findOne({ user: userId });
    if (history) {
      history.messages = history.messages.filter(m => m._id.toString() !== messageId);
      await history.save();
      return res.json({ success: true, messages: history.messages });
    }
    res.status(404).json({ message: 'Chat history not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting individual message' });
  }
};

const exportChatHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'UserId is required' });

    let history = await ChatHistory.findOne({ user: userId }).populate('user', 'name');
    if (!history) return res.status(404).json({ message: 'No chat history found for this user.' });

    let mdContent = `# AI Mentor Chat History\n`;
    mdContent += `Student: ${history.user?.name || 'User'}\n`;
    mdContent += `Date Exported: ${new Date().toLocaleDateString()}\n\n---\n\n`;

    history.messages.forEach(m => {
      const time = new Date(m.timestamp).toLocaleString();
      mdContent += `### [${time}] ${m.isBot ? '🤖 AI Mentor' : '👤 Student'}\n\n`;
      mdContent += `${m.text}\n\n---\n\n`;
    });

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename=mentor_chat_history_${userId}.md`);
    res.send(mdContent);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting chat history' });
  }
};

const getMockResume = (userData, refinementPrompt) => {
  if (refinementPrompt && typeof userData === 'object') {
    const updated = { ...userData };
    const p = refinementPrompt.toLowerCase();
    
    if (p.includes('phone')) {
      const match = refinementPrompt.match(/\+?\d[\d-\s]{7,15}/);
      if (match) updated.phone = match[0];
    }
    if (p.includes('email')) {
      const match = refinementPrompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) updated.email = match[0];
    }
    if (p.includes('location')) {
      updated.location = refinementPrompt.replace(/.*location\s+(to\s+)?/i, '').trim();
    }
    if (p.includes('skill')) {
      const newSkill = refinementPrompt.replace(/.*add\s+skill\s+/i, '').replace(/.*add\s+/i, '').trim();
      if (newSkill && updated.skills) {
        updated.skills.push({ name: newSkill, level: 85 });
      }
    }
    if (p.includes('project')) {
      const newProj = refinementPrompt.replace(/.*add\s+project\s+/i, '').replace(/.*add\s+/i, '').trim();
      if (newProj && updated.projects) {
        updated.projects.push({
          name: newProj,
          technologies: ["React", "Tailwind", "Node.js"],
          description: "A premium solution built for scale and recruiter visibility.",
          bulletPoints: [
            "Engineered high performance architecture reducing latency by 35%.",
            "Deployed cloud infrastructure supporting over 1,500 active requests.",
            "Integrated modern responsive UI with fluid user experiences."
          ]
        });
      }
    }
    
    if (p.includes('more technical') || p.includes('professional') || p.includes('improve')) {
      updated.summary = "Highly motivated and results-driven professional specializing in developing cutting-edge web applications and green energy systems. Adept at leveraging modern technology stacks to deliver scalable, high-performance solutions while maintaining exceptional user experiences.";
      if (updated.experience && updated.experience[0]) {
        updated.experience[0].bulletPoints = [
          "Developed responsive web interfaces utilizing modern framework components, resulting in 40% user engagement growth.",
          "Collaborated with cross-functional product and engineering teams to deploy automated build pipelines.",
          "Optimized backend database performance, decreasing query latency by 20% across main user flows."
        ];
      }
      if (updated.ats) {
        updated.ats.score = Math.min(99, updated.ats.score + 5);
        updated.ats.readabilityScore = Math.min(100, updated.ats.readabilityScore + 3);
      }
    }
    
    return updated;
  }

  const name = userData.name || "Alex Mercer";
  const title = userData.desiredRole || "Junior Green Energy Developer";
  const phone = userData.phone || "+91 98765 43210";
  const email = userData.email || "alex.mercer@gmail.com";
  const location = userData.location || "Bangalore, India";
  const linkedin = userData.linkedin || "linkedin.com/in/alexmercer";
  const github = userData.github || "github.com/alexmercer";
  const portfolio = userData.portfolio || "alexmercer.dev";
  
  const skillsList = (userData.skills || "JavaScript, React, Node.js, HTML/CSS, Git, Python, Clean Energy Tech")
    .split(',')
    .map(s => ({ name: s.trim(), level: Math.floor(Math.random() * 20) + 75 }));
    
  const languagesList = (userData.languages || "English, Telugu, Hindi")
    .split(',')
    .map(l => ({ name: l.trim(), level: l.trim().toLowerCase() === 'english' ? 'Fluent' : 'Native' }));

  return {
    name,
    title,
    phone,
    email,
    location,
    linkedin,
    github,
    portfolio,
    summary: `Dynamic and detail-oriented ${title} with a solid foundation in modern development environments and green technology integration. Committed to optimizing software systems and driving eco-friendly sustainability solutions in fast-paced collaborative teams.`,
    experience: [
      {
        company: userData.currentCompany || "EcoTech Innovations",
        role: userData.currentDesignation || title,
        duration: "2024 - Present",
        bulletPoints: [
          "Spearheaded redesign of carbon calculation platform using React and Node.js, improving load efficiency by 30%.",
          "Automated server deployment configurations, mitigating system downtime by 15% and increasing developer velocity.",
          "Authored robust modular API documentations, fostering seamless integration flows for external stakeholder tools."
        ]
      }
    ],
    projects: [
      {
        name: userData.projectName || "Smart Grid Power Estimator",
        technologies: (userData.projectTech || "React, Express, MongoDB, Python").split(',').map(s => s.trim()),
        description: userData.projectDesc || "A machine learning and responsive web project designed to measure and estimate solar output efficiency based on local meteorological arrays.",
        bulletPoints: [
          "Developed responsive dashboard UI visualizing solar panel energy metrics with clean interactive graphs.",
          "Integrated predictive analysis models yielding 94% accuracy in quarterly grid capacity calculations.",
          "Optimized database indexing strategies reducing query load speeds under heavy search stress."
        ]
      }
    ],
    education: [
      {
        degree: userData.degree || "B.Tech in Computer Science",
        institution: userData.university || "Global Institute of Technology",
        year: userData.graduationYear || "2024",
        cgpa: userData.cgpa || "8.5 CGPA"
      }
    ],
    skills: skillsList,
    languages: languagesList,
    certifications: (userData.certifications || "Certified Green Developer, AWS Cloud Practitioner").split(',').map(c => c.trim()),
    achievements: [
      "Winner of Eco-Hackathon 2024 out of 120 global technical teams.",
      "Published review article on local solar grid efficiency and smart storage."
    ],
    references: [
      {
        name: "Dr. Ramesh Babu",
        designation: "Professor & Head of Green Technologies",
        company: userData.university || "Global Institute of Technology",
        email: "ramesh.babu@git.edu",
        phone: "+91 99887 76655"
      }
    ],
    ats: {
      score: 95,
      missingKeywords: ["TypeScript", "AWS Lambda", "CI/CD Pipelines", "Docker"],
      suggestions: [
        "Include more quantifiable metrics in your project metrics.",
        "Add TypeScript to your technical skills to improve matches for Modern Frontend roles."
      ],
      readabilityScore: 94
    },
    coverLetter: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${title} position at your esteemed organization. With my academic background and hands-on experience in building modern web platforms, I am eager to contribute to your engineering team.\n\nDuring my work, I successfully developed scalable software solutions and automated system configurations. I am confident that my technical skills in web architecture and my passion for sustainable engineering make me an ideal fit.\n\nThank you for your time and consideration. I look forward to discussing how my skills align with your team's goals.\n\nSincerely,\n${name}`,
    interviewPrep: [
      {
        question: "Tell me about a challenging project you worked on.",
        answer: "Describe the Smart Grid Power Estimator. Explain the challenge of aggregating meteorological data, the solution of writing optimized Mongo index queries, and the result of achieving 94% estimation accuracy."
      },
      {
        question: "How do you optimize React application performance?",
        answer: "Talk about component memoization, lazy loading of subcomponents, profile analyzer metrics, and reducing unnecessary state re-renders."
      }
    ],
    linkedin,
    linkedinOpt: {
      headline: `${title} | React & Node.js Developer | Specializing in Sustainable Tech Solutions`,
      about: `Passionate ${title} dedicated to constructing highly scalable, clean, and sustainable web applications. Experienced in JavaScript frameworks and cloud deployment automation. Let's connect to build greener tech!`
    }
  };
};

const generateResume = async (req, res) => {
  try {
    const { userId, userData, refinementPrompt } = req.body;
    let prompt = "";
    if (refinementPrompt) {
      prompt = `Here is the current resume in JSON format:
${JSON.stringify(userData)}

The user wants to make the following edits or refinements:
"${refinementPrompt}"

Please apply these updates and return the full updated resume structure in the exact JSON format specified below. Make sure all sections are filled professionally and ATS optimized.`;
    } else {
      prompt = `You are an expert ATS Resume Writer and Recruiter.
Generate a world-class, recruiter-approved, ATS-friendly resume based on the following raw user details:
${JSON.stringify(userData)}

Perform the following enhancements:
1. Improve grammar and rewrite content professionally.
2. Add industry-standard keywords related to their desired job role: "${userData.desiredRole || ''}".
3. Convert all work experience responsibilities into achievements-based bullet points starting with strong action verbs, and quantify the achievements where possible.
4. Intelligently generate missing fields or sections if details are sparse, making sure the final resume is highly comprehensive.
5. Suggest missing skills (technical, soft, tools) and certifications.
6. Calculate an Overall ATS Score (out of 100), identify missing keywords, and provide suggestions for improvements.
7. Generate a professional Cover Letter, Interview Preparation (top 5 Q&As), and optimized LinkedIn Headline and About section.

Return a valid JSON object with the following structure:
{
  "name": "Full Name",
  "title": "Professional Title / Desired Role",
  "phone": "Phone Number",
  "email": "Email Address",
  "location": "Current Location",
  "linkedin": "LinkedIn Profile URL",
  "github": "GitHub Profile URL",
  "portfolio": "Portfolio Website URL",
  "summary": "Recruiter-focused professional summary",
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Start Date - End Date",
      "bulletPoints": [
        "Achievement-based bullet point with metric",
        "Achievement-based bullet point starting with action verb"
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "technologies": ["React", "Node.js", "Python"],
      "description": "Professional project description",
      "bulletPoints": [
        "Key achievement or feature 1",
        "Key achievement or feature 2"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree (e.g., B.Tech in CSE)",
      "institution": "College/University Name",
      "year": "Graduation Year",
      "cgpa": "CGPA/Percentage"
    }
  ],
  "skills": [
    { "name": "Technical Skill 1", "level": 90 },
    { "name": "Technical Skill 2", "level": 80 }
  ],
  "languages": [
    { "name": "English", "level": "Fluent" },
    { "name": "Telugu", "level": "Native" }
  ],
  "certifications": [
    "Certification 1",
    "Certification 2"
  ],
  "achievements": [
    "Award or Hackathon win 1",
    "Award or Hackathon win 2"
  ],
  "references": [
    {
      "name": "Reference Name",
      "designation": "Designation",
      "company": "Company",
      "email": "email@example.com",
      "phone": "Phone number"
    }
  ],
  "ats": {
    "score": 96,
    "missingKeywords": ["keyword1", "keyword2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "readabilityScore": 95
  },
  "coverLetter": "Full custom cover letter content...",
  "interviewPrep": [
    { "question": "Question 1", "answer": "Suggested answer 1" }
  ],
  "linkedinOpt": {
    "headline": "LinkedIn Headline",
    "about": "LinkedIn About section text"
  }
}

Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Return ONLY the raw JSON string.`;
    }

    let resumeJson = {};
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-flash-latest',
          generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text().trim();
        resumeJson = JSON.parse(textResponse);
      } catch (geminiError) {
        console.error("Gemini API resume generation failed:", geminiError);
        resumeJson = getMockResume(userData, refinementPrompt);
      }
    } else {
      resumeJson = getMockResume(userData, refinementPrompt);
    }

    res.json({ success: true, resume: resumeJson });
  } catch (error) {
    console.error("Resume generation error:", error);
    res.status(500).json({ success: false, message: 'Error generating resume' });
  }
};

const processResumeMatch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    let extractedText = '';
    
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    } else {
      // Basic fallback for doc/docx if mammoth is not used
      extractedText = req.file.buffer.toString('utf8'); 
    }

    // Call Gemini API to extract Green Skills
    let extractedSkills = [];
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Extract a JSON array of specific "Green Skills" and environmental competencies from the following resume text. Focus on skills related to renewable energy, sustainability, waste management, agriculture, environmental conservation, etc. If none are found, return an empty array. Do not return markdown, just the JSON array of strings.\n\nResume Text:\n${extractedText.substring(0, 5000)}`;
      
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        extractedSkills = JSON.parse(responseText);
        if (!Array.isArray(extractedSkills)) {
          extractedSkills = [];
        }
      } catch (err) {
        console.error("Gemini Extraction Error:", err);
        // Fallback to simple keyword extraction if Gemini fails
        extractedSkills = extractGreenSkillsFallback(extractedText);
      }
    } else {
      extractedSkills = extractGreenSkillsFallback(extractedText);
    }

    // Fetch all jobs and geo vacancies
    const jobs = await Job.find({ status: 'approved' }).populate('postedBy', 'companyDetails name email');
    const geoVacancies = await GeoVacancy.find({ status: 'Active' }).populate('hirerId', 'companyDetails name email');

    let allMatches = [];

    // Calculate match for standard Jobs
    for (let job of jobs) {
      const requiredSkills = job.requiredSkills || [];
      const matchScore = calculateSimilarity(extractedSkills, requiredSkills);
      if (matchScore > 10) { // threshold
        allMatches.push({
          type: 'Job',
          id: job._id,
          title: job.title,
          organization: job.postedBy?.companyDetails?.companyName || job.postedBy?.name || 'Unknown Organization',
          location: job.location || `${job.city}, ${job.state}`,
          salary: job.salary,
          requiredSkills: requiredSkills,
          matchPercentage: matchScore,
          hirerId: job.postedBy?._id,
          postedDate: job.createdAt
        });
      }
    }

    // Calculate match for Geo Vacancies
    for (let geo of geoVacancies) {
      const requiredSkills = geo.skills || [];
      const matchScore = calculateSimilarity(extractedSkills, requiredSkills);
      if (matchScore > 10) {
        allMatches.push({
          type: 'GeoVacancy',
          id: geo._id,
          title: geo.jobTitle,
          organization: geo.companyName || geo.hirerId?.name,
          location: `${geo.address}, ${geo.city}`,
          salary: geo.salary,
          requiredSkills: requiredSkills,
          matchPercentage: matchScore,
          hirerId: geo.hirerId?._id,
          postedDate: geo.createdAt
        });
      }
    }

    // Sort by highest match
    allMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      success: true,
      extractedSkills,
      matches: allMatches
    });

  } catch (error) {
    console.error('Error processing resume match:', error);
    res.status(500).json({ success: false, message: 'Failed to process resume match' });
  }
};

// Simple Fallback Extractor if Gemini fails or is not configured
function extractGreenSkillsFallback(text) {
  const keywords = ['solar', 'wind', 'organic farming', 'waste management', 'recycling', 'compost', 'water conservation', 'sustainability', 'renewable', 'environmental', 'ev', 'electric vehicle', 'plantation', 'green building'];
  const found = [];
  const lowerText = text.toLowerCase();
  for (let kw of keywords) {
    if (lowerText.includes(kw)) found.push(kw);
  }
  return found;
}

function calculateSimilarity(userSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;
  if (!userSkills || userSkills.length === 0) return 0;
  
  let matches = 0;
  for (let js of jobSkills) {
    let jobSkillLower = js.toLowerCase();
    for (let us of userSkills) {
      if (jobSkillLower.includes(us.toLowerCase()) || us.toLowerCase().includes(jobSkillLower)) {
        matches++;
        break;
      }
    }
  }
  return Math.min(100, Math.round((matches / jobSkills.length) * 100) + (userSkills.length > 0 ? 15 : 0)); // Add base 15% if they have some green skills
}

module.exports = { 
  generateRoadmap, 
  calculateJobMatch, 
  getChatHistory, 
  sendMessage, 
  clearChatHistory, 
  restoreChatHistory, 
  deleteIndividualMessage, 
  exportChatHistory,
  generateResume,
  processResumeMatch
};
