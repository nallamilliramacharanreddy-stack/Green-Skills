require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Job = require('./models/Job');
const Quiz = require('./models/Quiz');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills');
    console.log('Connected for seeding...');

    // Clear existing
    await Course.deleteMany({});
    await Job.deleteMany({});
    await Quiz.deleteMany({});

    // Courses
    const courses = [
      {
        title: 'Solar Panel Installation & Maintenance',
        description: 'Learn how to design, install and maintain solar energy systems for rural homes.',
        category: 'Renewable Energy',
        instructor: 'Dr. Sarah Green',
        thumbnail: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1000',
        lessons: [
          {
            moduleTitle: 'Introduction',
            title: 'Introduction to Solar PV',
            videoSource: 'youtube',
            youtubeLink: 'https://www.youtube.com/watch?v=xKxrkht7CpY',
            duration: '10:00'
          },
          {
            moduleTitle: 'Basic Electricals',
            title: 'Wiring Basics',
            videoSource: 'youtube',
            youtubeLink: 'https://www.youtube.com/watch?v=L2G7qS4yYnE',
            duration: '15:30'
          }
        ]
      },
      {
        title: 'Sustainable Organic Farming',
        description: 'Master the art of chemical-free farming and soil health management.',
        category: 'Sustainable Agriculture',
        instructor: 'Prof. Ram Singh',
        thumbnail: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1000',
        lessons: [
          {
            moduleTitle: 'Soil Science',
            title: 'Soil Health Fundamentals',
            videoSource: 'youtube',
            youtubeLink: 'https://www.youtube.com/watch?v=13J66eQ4r-4',
            duration: '12:45'
          }
        ]
      },
      {
        title: 'Water Resource Management',
        description: 'Digital tools for monitoring and conserving water in rural areas.',
        category: 'Eco-Management',
        instructor: 'Ing. Elena Waters',
        thumbnail: 'https://images.unsplash.com/photo-1468476396571-4d6f2a427ee7?auto=format&fit=crop&q=80&w=1000',
        lessons: [
          {
            moduleTitle: 'Conservation',
            title: 'Rainwater Harvesting Techniques',
            videoSource: 'youtube',
            youtubeLink: 'https://www.youtube.com/watch?v=9PqOev4fXoQ',
            duration: '08:20'
          }
        ]
      }
    ];
    await Course.insertMany(courses);

    // Jobs
    const jobs = [
      {
        companyName: 'EcoPower Solutions',
        title: 'Field Solar Technician',
        description: 'Seeking rural talent to maintain solar grids in local communities.',
        requirements: ['Basic electrical knowledge', 'Willingness to travel'],
        location: 'Remote/Rural',
        salary: '₹15,000 - ₹25,000',
        status: 'approved'
      },
      {
        companyName: 'GreenEarth Agri',
        title: 'Organic Farm Supervisor',
        description: 'Manage organic certification processes for local farmers.',
        requirements: ['Knowledge of organic standards', 'Good communication'],
        location: 'Village Hub',
        salary: '₹20,000 - ₹35,000',
        status: 'approved'
      }
    ];
    await Job.insertMany(jobs);

    // Quizzes
    const quizzes = [
      {
        title: 'Basic Environmental Awareness',
        description: 'Test your knowledge on global warming and sustainability.',
        category: 'General',
        questions: [
          {
            questionText: 'Which gas is most responsible for global warming?',
            options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'],
            correctAnswer: 1
          },
          {
            questionText: 'What is a renewable source of energy?',
            options: ['Coal', 'Oil', 'Solar', 'Natural Gas'],
            correctAnswer: 2
          }
        ],
        duration: 10
      }
    ];
    await Quiz.insertMany(quizzes);

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
