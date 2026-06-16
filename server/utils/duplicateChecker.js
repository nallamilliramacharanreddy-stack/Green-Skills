const mongoose = require('mongoose');

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "") // remove punctuation
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();
};

const getWordRearrangedFingerprint = (text) => {
  const normalized = normalizeText(text);
  return normalized.split(' ').filter(Boolean).sort().join(' ');
};

const getWordSet = (text) => {
  const normalized = normalizeText(text);
  return new Set(normalized.split(' ').filter(Boolean));
};

const calculateSimilarity = (text1, text2) => {
  const set1 = getWordSet(text1);
  const set2 = getWordSet(text2);
  
  if (set1.size === 0 || set2.size === 0) return 0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

const validateOptions = (options, questionText) => {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return null;
  }
  
  const seen = new Set();
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (opt === undefined || opt === null || String(opt).trim() === '') {
      return `Question "${questionText}" has a blank option at index ${i + 1}.`;
    }
    const normalized = String(opt).trim().toLowerCase();
    if (seen.has(normalized)) {
      return `Question "${questionText}" has a duplicate option: "${opt}".`;
    }
    
    // Check nearly identical options
    for (const existing of seen) {
      if (calculateSimilarity(normalized, existing) >= 0.85) {
        return `Question "${questionText}" has nearly identical options: "${opt}" and "${existing}".`;
      }
    }
    
    seen.add(normalized);
  }
  return null;
};

const checkForDuplicates = async (newQuestions, currentDocId, docType) => {
  const Quiz = mongoose.model('Quiz');
  const Course = mongoose.model('Course');
  
  // 1. Load all questions from DB (excluding current doc)
  const allDbQuestions = [];
  
  // Fetch quizzes
  const quizzes = await Quiz.find({ _id: { $ne: currentDocId } });
  for (const q of quizzes) {
    if (q.questions) {
      allDbQuestions.push(...q.questions.map(item => item.questionText || item.question));
    }
  }
  
  // Fetch courses
  const courses = await Course.find({ _id: { $ne: currentDocId } });
  for (const c of courses) {
    if (c.quiz) {
      allDbQuestions.push(...c.quiz.map(item => item.question || item.questionText));
    }
    if (c.lessons) {
      for (const l of c.lessons) {
        if (l.quiz) {
          allDbQuestions.push(...l.quiz.map(item => item.question || item.questionText));
        }
      }
    }
  }

  // Pre-calculate fingerprints for DB questions
  const dbFingerprints = allDbQuestions.map(text => ({
    text,
    fingerprint: getWordRearrangedFingerprint(text)
  }));

  // 2. Check each new question
  for (let i = 0; i < newQuestions.length; i++) {
    const q = newQuestions[i];
    const qText = q.question || q.questionText;
    if (!qText) continue;
    
    // Validate options
    const optError = validateOptions(q.options, qText);
    if (optError) {
      throw new Error(optError);
    }

    const qFingerprint = getWordRearrangedFingerprint(qText);
    
    // Check against DB
    for (const dbQ of dbFingerprints) {
      if (dbQ.fingerprint === qFingerprint) {
        throw new Error(`Similar question already exists in the database. Duplicate detected: "${qText}" matches "${dbQ.text}".`);
      }
      
      const similarity = calculateSimilarity(qText, dbQ.text);
      if (similarity >= 0.85) {
        throw new Error(`Similar question already exists in the database. Match score ${(similarity*100).toFixed(1)}% between "${qText}" and "${dbQ.text}".`);
      }
    }

    // Check against same batch (self-duplication check)
    for (let j = 0; j < i; j++) {
      const otherQ = newQuestions[j];
      const otherQText = otherQ.question || otherQ.questionText;
      if (!otherQText) continue;
      
      if (getWordRearrangedFingerprint(qText) === getWordRearrangedFingerprint(otherQText)) {
        throw new Error(`Duplicate question found in the same batch: "${qText}".`);
      }
      const similarity = calculateSimilarity(qText, otherQText);
      if (similarity >= 0.85) {
        throw new Error(`Highly similar questions found in the same batch: "${qText}" and "${otherQText}".`);
      }
    }

    // Check for duplicate correct answers
    const cAns = q.correctAnswer;
    if (Array.isArray(cAns)) {
      const seenCAns = new Set();
      for (const ans of cAns) {
        const normalizedAns = String(ans).trim().toLowerCase();
        if (seenCAns.has(normalizedAns)) {
          throw new Error(`Question "${qText}" has repeated correct answers.`);
        }
        seenCAns.add(normalizedAns);
      }
    }
  }
};

const generateIntegrityReport = async () => {
  const Quiz = mongoose.model('Quiz');
  const Course = mongoose.model('Course');

  const allQuestions = [];
  
  const addQuestions = (questions, sourceName, sourceId, type, lessonIndex = null) => {
    if (!questions) return;
    questions.forEach((q, index) => {
      const qText = q.question || q.questionText;
      if (!qText) return;
      allQuestions.push({
        id: q._id || `${sourceId}-${type}-${index}`,
        text: qText,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        sourceName,
        sourceId: sourceId.toString(),
        sourceType: type,
        lessonIndex,
        questionIndex: index
      });
    });
  };

  // Load from quizzes
  const quizzes = await Quiz.find();
  quizzes.forEach(q => {
    addQuestions(q.questions, q.title, q._id, 'Quiz');
  });

  // Load from courses
  const courses = await Course.find();
  courses.forEach(c => {
    addQuestions(c.quiz, c.title, c._id, 'Course');
    if (c.lessons) {
      c.lessons.forEach((l, lIdx) => {
        addQuestions(l.quiz, `${c.title} - Lesson ${lIdx + 1}: ${l.title}`, c._id, 'CourseLesson', lIdx);
      });
    }
  });

  const exactDuplicates = [];
  const similarQuestions = [];
  const duplicateAnswers = [];
  const fingerprints = new Map();

  allQuestions.forEach(q => {
    const fp = getWordRearrangedFingerprint(q.text);
    if (!fingerprints.has(fp)) {
      fingerprints.set(fp, []);
    }
    fingerprints.get(fp).push(q);
  });

  fingerprints.forEach((qs, fp) => {
    if (qs.length > 1) {
      exactDuplicates.push({
        fingerprint: fp,
        questions: qs.map(q => ({
          text: q.text,
          sourceName: q.sourceName,
          sourceId: q.sourceId,
          sourceType: q.sourceType,
          lessonIndex: q.lessonIndex,
          questionIndex: q.questionIndex
        }))
      });
    }
  });

  for (let i = 0; i < allQuestions.length; i++) {
    const q1 = allQuestions[i];
    const fp1 = getWordRearrangedFingerprint(q1.text);
    for (let j = i + 1; j < allQuestions.length; j++) {
      const q2 = allQuestions[j];
      const fp2 = getWordRearrangedFingerprint(q2.text);
      
      if (fp1 === fp2) continue; // Already counted as exact duplicate
      
      const similarity = calculateSimilarity(q1.text, q2.text);
      if (similarity >= 0.85) {
        similarQuestions.push({
          similarity: (similarity * 100).toFixed(1) + '%',
          q1: {
            text: q1.text,
            sourceName: q1.sourceName,
            sourceId: q1.sourceId,
            sourceType: q1.sourceType
          },
          q2: {
            text: q2.text,
            sourceName: q2.sourceName,
            sourceId: q2.sourceId,
            sourceType: q2.sourceType
          }
        });
      }
    }
  }

  allQuestions.forEach(q => {
    const optError = validateOptions(q.options, q.text);
    if (optError) {
      duplicateAnswers.push({
        questionText: q.text,
        options: q.options,
        sourceName: q.sourceName,
        sourceId: q.sourceId,
        sourceType: q.sourceType,
        error: optError
      });
    } else {
      // Check for repeated correct answers
      const cAns = q.correctAnswer;
      if (Array.isArray(cAns)) {
        const seenCAns = new Set();
        let hasRepeated = false;
        for (const ans of cAns) {
          const normalizedAns = String(ans).trim().toLowerCase();
          if (seenCAns.has(normalizedAns)) {
            hasRepeated = true;
            break;
          }
          seenCAns.add(normalizedAns);
        }
        if (hasRepeated) {
          duplicateAnswers.push({
            questionText: q.text,
            options: q.options,
            sourceName: q.sourceName,
            sourceId: q.sourceId,
            sourceType: q.sourceType,
            error: `Question "${q.text}" has repeated correct answers.`
          });
        }
      }
    }
  });

  const totalQuestionsCount = allQuestions.length;
  
  const duplicateQuestionTexts = new Set();
  exactDuplicates.forEach(group => {
    group.questions.forEach(q => duplicateQuestionTexts.add(q.text.toLowerCase().trim()));
  });

  const similarQuestionTexts = new Set();
  similarQuestions.forEach(pair => {
    similarQuestionTexts.add(pair.q1.text.toLowerCase().trim());
    similarQuestionTexts.add(pair.q2.text.toLowerCase().trim());
  });

  const optionsIssueTexts = new Set();
  duplicateAnswers.forEach(issue => {
    optionsIssueTexts.add(issue.questionText.toLowerCase().trim());
  });

  let uniqueCount = 0;
  allQuestions.forEach(q => {
    const txt = q.text.toLowerCase().trim();
    if (!duplicateQuestionTexts.has(txt) && !similarQuestionTexts.has(txt)) {
      uniqueCount++;
    }
  });

  let qualityDeduction = 0;
  qualityDeduction += duplicateQuestionTexts.size * 2.5;
  qualityDeduction += similarQuestionTexts.size * 1.5;
  qualityDeduction += optionsIssueTexts.size * 2.0;

  const qualityScore = Math.max(0, Math.min(100, Math.round(100 - qualityDeduction)));

  return {
    totalQuestions: totalQuestionsCount,
    uniqueQuestions: uniqueCount,
    exactDuplicatesCount: exactDuplicates.length,
    similarQuestionsCount: similarQuestions.length,
    duplicateAnswersCount: duplicateAnswers.length,
    qualityScore,
    exactDuplicates,
    similarQuestions,
    duplicateAnswers
  };
};

module.exports = {
  normalizeText,
  getWordRearrangedFingerprint,
  calculateSimilarity,
  validateOptions,
  checkForDuplicates,
  generateIntegrityReport
};
