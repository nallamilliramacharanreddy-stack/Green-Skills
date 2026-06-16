// robust helper function for parsing correct answers and candidate answers
const parseAnswersToOptions = (value, options) => {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  
  const normalizedOptions = (options || []).map(opt => String(opt).trim().toLowerCase());
  
  let rawItems = [];
  if (Array.isArray(value)) {
    rawItems = value;
  } else if (typeof value === 'string') {
    const trimmedVal = value.trim();
    if (trimmedVal.startsWith('[') && trimmedVal.endsWith(']')) {
      try {
        rawItems = JSON.parse(trimmedVal);
        if (!Array.isArray(rawItems)) {
          rawItems = [rawItems];
        }
      } catch (e) {
        rawItems = trimmedVal.split(',').map(s => s.trim());
      }
    } else {
      rawItems = trimmedVal.split(',').map(s => s.trim());
    }
  } else {
    rawItems = [value];
  }
  
  const result = [];
  for (const item of rawItems) {
    if (item === undefined || item === null || String(item).trim() === '') {
      continue;
    }
    const strItem = String(item).trim();
    
    // Check if it matches an option exactly (case-insensitive)
    const lowerItem = strItem.toLowerCase();
    const optIdx = normalizedOptions.indexOf(lowerItem);
    if (optIdx >= 0) {
      result.push(lowerItem);
      continue;
    }
    
    // Check if it is a valid index
    const idx = Number(strItem);
    if (!isNaN(idx) && idx >= 0 && idx < normalizedOptions.length) {
      result.push(normalizedOptions[idx]);
      continue;
    }
    
    // Otherwise, just treat it as a string answer
    result.push(lowerItem);
  }
  
  return result;
};

// Simulation grader
const gradeQuiz = (dbQuestions, answers) => {
  let correctCount = 0;
  let wrongCount = 0;
  let notAttemptedCount = 0;
  const gradedAnswers = [];

  for (let i = 0; i < dbQuestions.length; i++) {
    const q = dbQuestions[i];
    const type = q.questionType || 'single';
    
    const userAns = answers.find(a => a.questionIndex === i);
    const candidateAnswer = userAns ? userAns.candidateAnswer : undefined;
    
    const qText = q.question || q.questionText || '';
    const qOptions = q.options || [];

    const parsedCorrect = parseAnswersToOptions(q.correctAnswer, qOptions);
    const parsedUser = parseAnswersToOptions(candidateAnswer, qOptions);

    let correctOptionText = '';
    if (qOptions && qOptions.length > 0) {
      const correctOptionsCased = parsedCorrect.map(lowerOpt => {
        const idx = qOptions.map(o => String(o).trim().toLowerCase()).indexOf(lowerOpt);
        return idx >= 0 ? qOptions[idx] : lowerOpt;
      });
      correctOptionText = correctOptionsCased.join(', ');
    } else {
      correctOptionText = parsedCorrect.join(', ');
    }

    let userOptionText = '';
    if (qOptions && qOptions.length > 0) {
      const userOptionsCased = parsedUser.map(lowerOpt => {
        const idx = qOptions.map(o => String(o).trim().toLowerCase()).indexOf(lowerOpt);
        return idx >= 0 ? qOptions[idx] : lowerOpt;
      });
      userOptionText = userOptionsCased.join(', ');
    } else {
      userOptionText = parsedUser.join(', ');
    }

    const isAttempted = parsedUser.length > 0;

    if (!isAttempted) {
      notAttemptedCount++;
      gradedAnswers.push({
        questionIndex: i,
        isCorrect: false
      });
      console.log(`Question ID: ${q.id}
User Answer: (UNANSWERED)
Correct Answer: ${JSON.stringify(correctOptionText)}
Match Result: FAIL (INCORRECT)
`);
      continue;
    }

    let isCorrect = false;

    if (type === 'single' || type === 'boolean') {
      isCorrect = (parsedCorrect.length > 0 && parsedUser[0] === parsedCorrect[0]);
    } else if (type === 'multiple') {
      if (parsedCorrect.length === parsedUser.length) {
        const sortedCorrect = [...parsedCorrect].sort();
        const sortedUser = [...parsedUser].sort();
        isCorrect = sortedCorrect.every((val, index) => val === sortedUser[index]);
      }
    } else if (type === 'text') {
      isCorrect = parsedCorrect.includes(parsedUser[0]);
    }

    if (isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
    }

    console.log(`Question ID: ${q.id}
User Answer: ${JSON.stringify(userOptionText)}
Correct Answer: ${JSON.stringify(correctOptionText)}
Match Result: ${isCorrect ? 'SUCCESS (CORRECT)' : 'FAIL (INCORRECT)'}
`);

    gradedAnswers.push({
      questionIndex: i,
      isCorrect: isCorrect
    });
  }

  const percentage = (correctCount / dbQuestions.length) * 100;
  return { correctCount, wrongCount, notAttemptedCount, percentage };
};

// Define test database questions
const questions = [
  {
    id: "Q1",
    questionText: "Which EV batteries are most common?",
    options: ["Lead-acid", "Lithium-ion", "Nickel-cadmium", "Sodium-ion"],
    questionType: "single",
    correctAnswer: 1 // index for Lithium-ion
  },
  {
    id: "Q2",
    questionText: "Select all renewable energy sources.",
    options: ["Solar", "Coal", "Wind", "Natural Gas"],
    questionType: "multiple",
    correctAnswer: [0, 2] // indices for Solar and Wind
  },
  {
    id: "Q3",
    questionText: "Global warming is primarily caused by greenhouse gases.",
    options: ["True", "False"],
    questionType: "boolean",
    correctAnswer: "True" // option string
  },
  {
    id: "Q4",
    questionText: "What is the full form of PV in solar PV panels?",
    options: [],
    questionType: "text",
    correctAnswer: "Photovoltaic" // text answer
  }
];

console.log("=== Running Case 1: All answers correct ===");
const answers1 = [
  { questionIndex: 0, candidateAnswer: "Lithium-ion" }, // option string matching
  { questionIndex: 1, candidateAnswer: [0, 2] }, // indices matching
  { questionIndex: 2, candidateAnswer: "True" }, // boolean matching
  { questionIndex: 3, candidateAnswer: "photovoltaic" } // case-insensitive text matching
];
const result1 = gradeQuiz(questions, answers1);
console.log("Result 1:", result1);
if (result1.correctCount !== 4 || result1.percentage !== 100) {
  throw new Error("Case 1 Failed!");
}

console.log("\n=== Running Case 2: All answers wrong ===");
const answers2 = [
  { questionIndex: 0, candidateAnswer: "Lead-acid" },
  { questionIndex: 1, candidateAnswer: [1, 3] },
  { questionIndex: 2, candidateAnswer: "False" },
  { questionIndex: 3, candidateAnswer: "Coal" }
];
const result2 = gradeQuiz(questions, answers2);
console.log("Result 2:", result2);
if (result2.correctCount !== 0 || result2.percentage !== 0) {
  throw new Error("Case 2 Failed!");
}

console.log("\n=== Running Case 3: 50% correct ===");
const answers3 = [
  { questionIndex: 0, candidateAnswer: "Lithium-ion" }, // correct
  { questionIndex: 1, candidateAnswer: [0, 2] }, // correct
  { questionIndex: 2, candidateAnswer: "False" }, // wrong
  { questionIndex: 3, candidateAnswer: "Gasoline" } // wrong
];
const result3 = gradeQuiz(questions, answers3);
console.log("Result 3:", result3);
if (result3.correctCount !== 2 || result3.percentage !== 50) {
  throw new Error("Case 3 Failed!");
}

console.log("\n=== Running Case 4: Mixed answers with unattempted ===");
const answers4 = [
  { questionIndex: 0, candidateAnswer: "Lithium-ion" }, // correct
  { questionIndex: 2, candidateAnswer: "True" } // correct
  // Q2 and Q4 are unanswered
];
const result4 = gradeQuiz(questions, answers4);
console.log("Result 4:", result4);
if (result4.correctCount !== 2 || result4.wrongCount !== 0 || result4.notAttemptedCount !== 2) {
  throw new Error("Case 4 Failed!");
}

console.log("\n=== Running Case 5: Single correct answer ===");
const answers5 = [
  { questionIndex: 0, candidateAnswer: "Lithium-ion" } // correct
];
const result5 = gradeQuiz(questions, answers5);
console.log("Result 5:", result5);
if (result5.correctCount !== 1) {
  throw new Error("Case 5 Failed!");
}

console.log("\nALL TESTS PASSED SUCCESSFULLY!");
