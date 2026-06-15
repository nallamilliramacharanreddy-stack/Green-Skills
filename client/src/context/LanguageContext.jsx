import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
  English: {
    welcome: "Welcome",
    courses: "Courses",
    jobs: "Jobs",
    guidance: "Guidance",
    roadmap: "Smart Career Roadmap",
    readiness: "Job Readiness",
  },
  Hindi: {
    welcome: "स्वागत है",
    courses: "पाठ्यक्रम",
    jobs: "नौकरियां",
    guidance: "मार्गदर्शन",
    roadmap: "स्मार्ट करियर रोडमैप",
    readiness: "नौकरी की तैयारी",
  },
  Telugu: {
    welcome: "స్వాగతం",
    courses: "కోర్సులు",
    jobs: "ఉద్యోగాలు",
    guidance: "మార్గదర్శకత్వం",
    roadmap: "స్మార్ట్ కెరీర్ రోడ్‌మ్యాప్",
    readiness: "ఉద్యోగ సంసిద్ధత",
  },
  Tamil: {
    welcome: "வரவேற்பு",
    courses: "பாடப்பிரிவுகள்",
    jobs: "வேலைகள்",
    guidance: "வழிகாட்டுதல்",
    roadmap: "ஸ்மார்ட் தொழில் பாதை",
    readiness: "வேலை தயார் நிலை",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('English');

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
