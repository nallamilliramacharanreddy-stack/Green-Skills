import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, BookOpen, HelpCircle, Save, 
  Trash2, ChevronRight, FileText,
  CheckCircle2, Clock, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const ExamCreator = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    category: 'General',
    duration: 15,
    questions: [],
    draftId: null
  });

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  const fetchExams = async () => {
    try {
      const res = await axios.get(`${API_URL}/quizzes/employer/${user._id}`);
      setExams(res.data);
    } catch (error) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`);
      setCourses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchExams();
      fetchCourses();
    }
  }, [user]);

  const handleGenerateAIQuiz = async () => {
    if (!youtubeUrl) return toast.error('Please paste a YouTube URL');
    if (!selectedCourseId) return toast.error('Please select a Course to attach this to');
    
    setIsGenerating(true);
    const loadingToast = toast.loading('AI is extracting transcript and analyzing video...');
    
    try {
      const res = await axios.post(`${API_URL}/quizzes/generate-from-youtube`, {
        youtubeUrl,
        courseId: selectedCourseId,
        lessonId: selectedLessonId || null,
        adminId: user._id
      });
      
      const aiQuiz = res.data;
      setExamData({
        ...examData,
        title: aiQuiz.title,
        description: aiQuiz.description,
        duration: aiQuiz.duration,
        questions: aiQuiz.questions,
        draftId: aiQuiz._id
      });
      
      toast.success('Assessment generated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to generate assessment', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText) return toast.error('Question text is required');
    if (currentQuestion.options.some(opt => !opt)) return toast.error('All 4 options must be filled');
    
    setExamData({
      ...examData,
      questions: [...examData.questions, currentQuestion]
    });
    setCurrentQuestion({
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
    toast.success('Question added to exam blueprint');
  };

  const removeQuestion = (index) => {
    const newQuestions = examData.questions.filter((_, i) => i !== index);
    setExamData({ ...examData, questions: newQuestions });
  };

  const handleSaveExam = async () => {
    if (examData.questions.length === 0) return toast.error('Add at least one question');
    
    const invalidQuestionIndex = examData.questions.findIndex(q => {
      const qText = q.question || q.questionText || q.text || q.title || q.content;
      return !qText || String(qText).trim() === '';
    });
    
    if (invalidQuestionIndex !== -1) {
      return toast.error(`Cannot publish: Question ${invalidQuestionIndex + 1} is missing text.`);
    }

    try {
      if (examData.draftId) {
        // Publish the AI generated draft
        await axios.post(`${API_URL}/quizzes/${examData.draftId}/publish`);
        toast.success('AI Exam Published and Attached to Course!');
      } else {
        // Create manual exam
        const res = await axios.post(`${API_URL}/quizzes`, {
          ...examData,
          courseId: selectedCourseId || undefined,
          lessonId: selectedLessonId || undefined,
          createdBy: user._id
        });
        
        // Publish manual exam immediately to trigger backend course mapping logic
        const createdQuiz = res.data;
        await axios.post(`${API_URL}/quizzes/${createdQuiz._id}/publish`);
        toast.success('Exam Published and Attached to Course!');
      }
      setShowForm(false);
      fetchExams();
      setExamData({ title: '', description: '', category: 'General', duration: 15, questions: [], draftId: null });
      setYoutubeUrl('');
      setSelectedCourseId('');
      setSelectedLessonId('');
    } catch (error) {
      toast.error('Failed to save exam');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Exam Creator</h2>
          <p className="text-slate-500 text-sm font-medium">Design custom MCQ assessments and study notes for candidates.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform"
        >
          {showForm ? <ChevronRight className="rotate-90" /> : <Plus />}
          {showForm ? 'Cancel Blueprint' : 'Build New Exam'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left Column: Form */}
            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <FileText className="text-primary" /> Exam Identity
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exam Title</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold"
                      placeholder="e.g. Solar Engineering Fundamentals"
                      value={examData.title}
                      onChange={(e) => setExamData({...examData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Min)</label>
                    <input 
                      type="number"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold"
                      value={examData.duration}
                      onChange={(e) => setExamData({...examData, duration: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold appearance-none"
                      value={examData.category}
                      onChange={(e) => setExamData({...examData, category: e.target.value})}
                    >
                      <option>Solar</option>
                      <option>Wind</option>
                      <option>EV Tech</option>
                      <option>General</option>
                    </select>
                  </div>
                  
                  {/* Link to Course */}
                  <div className="space-y-3 col-span-2 pt-6 border-t border-slate-100 mt-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen size={12} className="text-primary" /> Target Course & Lesson
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                      >
                        <option value="">Select Course...</option>
                        {courses.map(c => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>

                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-bold"
                        value={selectedLessonId}
                        onChange={(e) => setSelectedLessonId(e.target.value)}
                        disabled={!selectedCourseId}
                      >
                        <option value="">Select Video/Lesson (Optional)...</option>
                        {selectedCourseId && courses.find(c => c._id === selectedCourseId)?.lessons?.map(l => (
                          <option key={l._id} value={l._id}>{l.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AI Generation from YouTube */}
                  <div className="space-y-3 col-span-2 pt-6 border-t border-slate-100 mt-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={12} className="text-primary" /> AI Generator (Unstop Style)
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text"
                        className="flex-1 px-5 py-4 bg-primary/5 border border-primary/20 rounded-2xl outline-none focus:bg-primary/10 transition-all font-medium text-primary placeholder:text-primary/50"
                        placeholder="Paste YouTube Video URL here..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={handleGenerateAIQuiz}
                        disabled={isGenerating}
                        className={`px-8 py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-colors shrink-0 ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-slate-900'}`}
                      >
                        {isGenerating ? 'Analyzing...' : 'Generate Assessment'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <HelpCircle className="text-primary" /> Add MCQ Question
                </h3>
                <div className="space-y-4">
                  <textarea 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary/50 transition-all font-medium"
                    placeholder="Enter the question here..."
                    value={currentQuestion.questionText}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, questionText: e.target.value})}
                  />
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <button 
                          onClick={() => setCurrentQuestion({...currentQuestion, correctAnswer: i})}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            currentQuestion.correctAnswer === i ? 'border-primary bg-primary text-white' : 'border-slate-300'
                          }`}
                        >
                          {currentQuestion.correctAnswer === i && <CheckCircle2 size={14} />}
                        </button>
                        <input 
                          type="text"
                          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary/50 transition-all text-sm"
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...currentQuestion.options];
                            newOpts[i] = e.target.value;
                            setCurrentQuestion({...currentQuestion, options: newOpts});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={addQuestion}
                    className="w-full py-4 bg-primary/10 text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Add to Exam
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Blueprint Preview */}
            <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Exam Blueprint</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Real-time Visualization</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/5">
                    <Clock size={14} className="text-primary" />
                    <span className="text-xs font-bold">{examData.duration}m</span>
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {examData.questions.map((q, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      className="p-6 bg-white/5 border border-white/10 rounded-[28px] group hover:border-primary/50 transition-all"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-2">Question {i + 1}</span>
                          <p className="font-medium text-slate-200 text-sm mb-4 leading-relaxed">
                            {q.question || q.questionText || q.text || q.title || q.content || <span className="text-red-500 font-bold">Question text missing</span>}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className={`px-3 py-2 rounded-xl text-[10px] font-bold ${
                                q.correctAnswer === oi ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-slate-400'
                              }`}>
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeQuestion(i)}
                          className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {examData.questions.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-[32px]">
                      <Zap className="mx-auto text-slate-700 mb-4" size={40} />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Add questions to populate blueprint</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSaveExam}
                  disabled={examData.questions.length === 0}
                  className="w-full mt-8 py-5 bg-primary text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-tighter disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <Save size={20} /> Finalize & Save Exam
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <motion.div 
            key={exam._id}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
              <BookOpen className="text-slate-400 group-hover:text-primary transition-colors" size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2 leading-tight">{exam.title}</h3>
            <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration}m</span>
              <span className="flex items-center gap-1"><HelpCircle size={12} /> {exam.questions.length} Qs</span>
              <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-100">{exam.category}</span>
            </div>
            <button className="w-full py-4 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
              Edit Blueprint <ChevronRight size={14} />
            </button>
          </motion.div>
        ))}
        {!loading && exams.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <HelpCircle className="mx-auto w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Exams Built</h3>
            <p className="text-slate-400 text-sm mt-2">Start creating assessments for your recruitment pipeline.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }
      `}} />
    </div>
  );
};

export default ExamCreator;
