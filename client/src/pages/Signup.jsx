import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  User, Mail, Lock, Phone, BookOpen, Users, Building,
  Briefcase, Globe, Calendar, Target, GraduationCap,
  Zap, ArrowRight, Cpu, ShieldCheck,
  Eye, EyeOff
} from 'lucide-react';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'student',
    age: '', education: '', mobile: '', 
    skillsInterested: '', preferredLanguage: '', 
    currentWork: '', careerGoal: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = React.useRef(null);

  // Face enrollment state variables
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState('loading');
  const [blinkCount, setBlinkCount] = useState(0);
  const [enrollmentSamples, setEnrollmentSamples] = useState([]);
  const [facialEmbedding, setFacialEmbedding] = useState(null);
  const [webcamStream, setWebcamStream] = useState(null);

  // Liveness metric live readouts
  const [currentEAR, setCurrentEAR] = useState(0);
  const [currentNoseRatio, setCurrentNoseRatio] = useState(1);
  const [currentSmileRatio, setCurrentSmileRatio] = useState(0);

  // Dynamic random challenges state and refs
  const [challenges, setChallenges] = useState([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const challengesRef = useRef([]);
  const challengeIndexRef = useRef(0);

  const videoRef = useRef(null);
  const stepRef = useRef('loading');
  const eyeClosedRef = useRef(false);
  const blinkCountRef = useRef(0);
  const trackingLoopRef = useRef(null);

  // 3D Parallax Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const roles = [
    { id: 'student', title: 'USER', icon: Users, color: '#10B981' }, // Emerald
    { id: 'employer', title: 'HIRING TEAM', icon: Building, color: '#3B82F6' }, // Blue
    { id: 'admin', title: 'Admin', icon: ShieldCheck, color: '#EF4444' }, // Red
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Liveness Challenge Definition Pool
  const challengePool = [
    { type: 'blink', label: 'Blink Eyes Twice', instruction: 'Blink your eyes twice' },
    { type: 'turnLeft', label: 'Turn Head Left', instruction: 'Slowly turn your head to the left' },
    { type: 'turnRight', label: 'Turn Head Right', instruction: 'Slowly turn your head to the right' },
    { type: 'smile', label: 'Show a Big Smile', instruction: 'Smile wide for the camera' }
  ];

  const generateRandomChallenges = () => {
    const shuffled = [...challengePool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    setChallenges(selected);
    challengesRef.current = selected;
    setCurrentChallengeIndex(0);
    challengeIndexRef.current = 0;
    setBlinkCount(0);
    blinkCountRef.current = 0;
  };

  // Face enrollment tracking engine & webcam access
  const setStepState = (newStep) => {
    stepRef.current = newStep;
    setEnrollmentStep(newStep);
  };

  const startEnrollment = async () => {
    setStepState('loading');
    try {
      if (!window.faceapi) {
        throw new Error('Face-API library not loaded yet');
      }
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      await window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.error("Webcam play failed in Signup:", e));
        };
      }
      setStepState('position');
    } catch (err) {
      console.error(err);
      toast.error('Webcam access or model loading failed. Please check permissions.');
      setIsEnrolling(false);
    }
  };

  const completeEnrollmentAndSubmit = async (avgEmbed) => {
    setFacialEmbedding(avgEmbed);
    setIsEnrolling(false);
    
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'skillsInterested') {
        data.append(key, formData[key].split(',').map(s => s.trim()));
      } else {
        data.append(key, formData[key]);
      }
    });
    
    if (profilePicture) {
      data.append('profilePicture', profilePicture);
    }
    data.append('facialEmbedding', JSON.stringify(avgEmbed));

    const loadingToast = toast.loading('Registering account with biometric profile...');
    const res = await signup(data);
    toast.dismiss(loadingToast);

    if (res.success) {
      toast.success('Core Identity Initialized');
      navigate('/dashboard');
    } else {
      toast.error(res.message || 'Registration Failed');
    }
  };

  const startCapturingSamples = (firstDescriptor) => {
    const samples = [firstDescriptor];
    let count = 1;
    setEnrollmentSamples([...samples]);
    
    const captureInterval = setInterval(async () => {
      if (!videoRef.current || stepRef.current !== 'capturing') {
        clearInterval(captureInterval);
        return;
      }
      try {
        const faceapi = window.faceapi;
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
        ).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
          samples.push(detection.descriptor);
          count++;
          setEnrollmentSamples([...samples]);
          if (count >= 10) {
            clearInterval(captureInterval);
            const avg = new Float32Array(128);
            for (let i = 0; i < 128; i++) {
              let sum = 0;
              for (let j = 0; j < 10; j++) {
                sum += samples[j][i];
              }
              avg[i] = sum / 10;
            }
            setStepState('success');
            setTimeout(() => {
              completeEnrollmentAndSubmit(Array.from(avg));
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Error capturing sample:', err);
      }
    }, 200);
  };

  const runTracking = async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || stepRef.current === 'success') {
      return;
    }

    try {
      const faceapi = window.faceapi;
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

      if (detection) {
        const landmarks = detection.landmarks.positions;
        const jaw = landmarks.slice(0, 17);
        const leftEye = landmarks.slice(36, 42);
        const rightEye = landmarks.slice(42, 48);
        const mouth = landmarks.slice(48, 60);
        const noseTip = landmarks[30];

        const dist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

        // EAR calculation
        const leftEAR = (dist(leftEye[1], leftEye[5]) + dist(leftEye[2], leftEye[4])) / (2 * dist(leftEye[0], leftEye[3]));
        const rightEAR = (dist(rightEye[1], rightEye[5]) + dist(rightEye[2], rightEye[4])) / (2 * dist(rightEye[0], rightEye[3]));
        const averageEAR = (leftEAR + rightEAR) / 2;

        // Turn horizontal bias check
        const noseRatio = (noseTip.x - jaw[0].x) / (jaw[16].x - noseTip.x);

        // Smile mouth ratio check
        const mouthWidth = dist(mouth[0], mouth[6]);
        const jawWidth = dist(jaw[0], jaw[16]);
        const smileRatio = mouthWidth / jawWidth;

        setCurrentEAR(Number(averageEAR.toFixed(3)));
        setCurrentNoseRatio(Number(noseRatio.toFixed(3)));
        setCurrentSmileRatio(Number(smileRatio.toFixed(3)));

        const currentStep = stepRef.current;
        const currentIdx = challengeIndexRef.current;
        const currentChallenges = challengesRef.current;
        const currentChallenge = currentChallenges[currentIdx];

        if (currentStep === 'position') {
          if (noseRatio > 0.7 && noseRatio < 1.4) {
            if (currentChallenges.length > 0) {
              const firstChallenge = currentChallenges[0];
              setStepState(firstChallenge.type);
              toast.success(`Face positioned. Challenge 1: ${firstChallenge.instruction}`);
            } else {
              setStepState('capturing');
              startCapturingSamples(detection.descriptor);
            }
          }
        } else if (currentChallenge && currentStep === currentChallenge.type) {
          let passed = false;
          
          if (currentStep === 'blink') {
            if (averageEAR < 0.20 && !eyeClosedRef.current) {
              eyeClosedRef.current = true;
            } else if (averageEAR > 0.24 && eyeClosedRef.current) {
              eyeClosedRef.current = false;
              blinkCountRef.current += 1;
              setBlinkCount(blinkCountRef.current);
              if (blinkCountRef.current >= 2) {
                passed = true;
              } else {
                toast.success('Blink detected! One more time.');
              }
            }
          } else if (currentStep === 'turnLeft') {
            if (noseRatio < 0.65) {
              passed = true;
            }
          } else if (currentStep === 'turnRight') {
            if (noseRatio > 1.5) {
              passed = true;
            }
          } else if (currentStep === 'smile') {
            if (smileRatio > 0.35) {
              passed = true;
            }
          }

          if (passed) {
            const nextIdx = currentIdx + 1;
            if (nextIdx < currentChallenges.length) {
              challengeIndexRef.current = nextIdx;
              setCurrentChallengeIndex(nextIdx);
              setStepState(currentChallenges[nextIdx].type);
              toast.success(`Passed! Challenge ${nextIdx + 1}: ${currentChallenges[nextIdx].instruction}`);
            } else {
              setStepState('capturing');
              toast.success('Liveness confirmed. Capturing biometric samples...');
              startCapturingSamples(detection.descriptor);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error in facial tracking loop:', e);
    }

    if (stepRef.current !== 'success' && stepRef.current !== 'capturing') {
      trackingLoopRef.current = requestAnimationFrame(runTracking);
    }
  };

  const handleVideoPlay = () => {
    trackingLoopRef.current = requestAnimationFrame(runTracking);
  };

  useEffect(() => {
    if (isEnrolling) {
      stepRef.current = 'loading';
      setEnrollmentStep('loading');
      eyeClosedRef.current = false;
      blinkCountRef.current = 0;
      setBlinkCount(0);
      setEnrollmentSamples([]);
      generateRandomChallenges();
      startEnrollment();
    } else {
      if (trackingLoopRef.current) {
        cancelAnimationFrame(trackingLoopRef.current);
      }
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
      }
    }
    return () => {
      if (trackingLoopRef.current) {
        cancelAnimationFrame(trackingLoopRef.current);
      }
    };
  }, [isEnrolling]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Strict Email Validation
    const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      return toast.error('Email must be in small letters and end with @gmail.com');
    }

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return toast.error('Password must contain uppercase, lowercase, number, and special character.');
    }

    if (formData.role === 'student' && !facialEmbedding) {
      setIsEnrolling(true);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'skillsInterested') {
        data.append(key, formData[key].split(',').map(s => s.trim()));
      } else {
        data.append(key, formData[key]);
      }
    });
    
    if (profilePicture) {
      data.append('profilePicture', profilePicture);
    }

    if (facialEmbedding) {
      data.append('facialEmbedding', JSON.stringify(facialEmbedding));
    }

    const loadingToast = toast.loading('Registering account...');
    const res = await signup(data);
    toast.dismiss(loadingToast);

    if (res.success) {
      if (res.needsApproval) {
        toast.success('Registration successful. Awaiting Admin approval.');
        navigate('/login');
      } else {
        toast.success('Core Identity Initialized');
        navigate('/dashboard');
      }
    } else {
      toast.error(res.message || 'Registration Failed');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const inputStyle = "w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-sm placeholder:text-slate-400";
  const labelStyle = "text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1 mb-2 block";
  const iconStyle = "absolute left-4 top-[42px] text-slate-400 group-focus-within/input:text-primary transition-colors w-4 h-4";

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <div className="min-h-screen bg-white flex justify-center items-start p-6 relative font-sans py-24 w-full" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        
        {/* Cinematic 3D Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-blue-50 via-white to-emerald-50 opacity-80"></div>
          <motion.div 
            animate={{ y: [0, -50, 0], opacity: [0.1, 0.2, 0.1] }} 
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"
          ></motion.div>
        </div>

        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-start justify-between gap-16 relative z-10">
          
          {/* Left Side: Identity Selection */}
          <div className="flex-1 lg:sticky lg:top-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_30px_rgba(22,163,74,0.3)]">
                    <Zap size={28} />
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Register <span className="text-primary">here</span></h2>
                </div>
                <p className="text-slate-500 text-lg font-medium max-w-md">
                  Initialize your core identity within the Nexus. Choose your role and establish your digital presence.
                </p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Nexus Identity Initialization v4.0</p>
              </div>

              {/* The Bento Nexus: Modern Grid Identity Matrix */}
              <div className="grid grid-cols-2 gap-4 relative w-full">
                {roles.map((r) => (
                  <motion.div
                    key={r.id}
                    onClick={() => {
                    if (r.id === 'employer') {
                      navigate('/hirer/signup');
                    } else {
                      setFormData({ ...formData, role: r.id });
                    }
                  }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative p-6 rounded-[32px] border-2 cursor-pointer transition-all duration-500 overflow-hidden group bg-white"
                    style={{ 
                      borderColor: formData.role === r.id ? r.color : '#F1F5F9',
                      boxShadow: formData.role === r.id ? `0 20px 40px ${r.color}20` : 'none'
                    }}
                  >
                    {/* Background Pattern */}
                    <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${
                      formData.role === r.id ? 'opacity-[0.08]' : ''
                    }`}>
                      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '12px 12px' }}></div>
                    </div>

                    {/* Active Indicator */}
                    {formData.role === r.id && (
                      <motion.div 
                        layoutId="bento-signup-accent"
                        className={`absolute top-0 right-0 w-12 h-12 rounded-bl-[32px] ${
                          r.color === 'emerald' ? 'bg-emerald-500/10' :
                          r.color === 'blue' ? 'bg-blue-500/10' :
                          r.color === 'purple' ? 'bg-purple-500/10' :
                          r.color === 'orange' ? 'bg-orange-500/10' :
                          'bg-red-500/10'
                        }`}
                      />
                    )}

                    <div className="relative z-10 flex flex-col gap-4">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm"
                        style={{ 
                          backgroundColor: formData.role === r.id ? r.color : '#FFFFFF',
                          color: formData.role === r.id ? '#FFFFFF' : '#94A3B8'
                        }}
                      >
                        <r.icon size={20} strokeWidth={2.5} />
                      </div>
                      
                      <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] block transition-colors ${
                          formData.role === r.id ? 'text-slate-900' : 'text-slate-500'
                        }`}>
                          {r.title}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Registration Form Card */}
          <motion.div 
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-[1.8] w-full relative"
          >
            {/* Traveling Multi-Color Border Light */}
            <div className="absolute inset-0 p-[2px] rounded-[42px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 via-purple-500 via-orange-500 to-red-500 w-[300%] animate-border-travel shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
            </div>

            <div className="relative group p-[2px] rounded-[40px] bg-slate-100 overflow-hidden shadow-2xl">
              <div className="bg-white/95 backdrop-blur-3xl p-10 md:p-16 rounded-[38px] relative overflow-hidden border border-slate-200">
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Register</h3>
                      <p className="text-slate-600 text-[10px] font-black tracking-[0.4em] uppercase">ACCOUNT REGISTRATION</p>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                      <Cpu className="text-primary animate-pulse" />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center gap-4 mb-8">
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden group relative"
                      >
                        {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <User className="text-slate-300" size={32} />
                            <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Add Photo</span>
                          </div>
                        )}
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Optional Identity Asset</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                      {[
                        { name: 'name', label: 'Full Name', icon: User, placeholder: 'YOUR NAME' },
                        { name: 'email', label: 'Email Address', icon: Mail, placeholder: 'EMAIL ADDRESS' },
                        { name: 'password', label: 'Password', icon: Lock, placeholder: '••••••••', type: 'password' },
                        { name: 'mobile', label: 'Mobile Number', icon: Phone, placeholder: '+91-CONTACT' },
                        { name: 'age', label: 'Age', icon: Calendar, placeholder: '24' },
                        { name: 'education', label: 'Education', icon: GraduationCap, placeholder: 'GRADUATE' },
                        { name: 'skillsInterested', label: 'Skills Interested', icon: Zap, placeholder: 'SOLAR, TECH...' },
                        { name: 'currentWork', label: 'Current Occupation', icon: Briefcase, placeholder: 'STUDENT / ACTIVE' },
                        { name: 'careerGoal', label: 'Career Goal', icon: Target, placeholder: 'ENGINEER / LEAD' },
                        { name: 'preferredLanguage', label: 'Language', icon: Globe, isSelect: true, options: ['ENGLISH', 'HINDI', 'TELUGU', 'TAMIL'] }
                      ].map((f) => (
                        <div key={f.name} className="space-y-2 group/input">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">{f.label}</label>
                          <div className="relative">
                            <f.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-primary transition-colors" size={18} />
                            {f.isSelect ? (
                              <select
                                name={f.name}
                                value={formData[f.name]}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-xs appearance-none"
                                required
                              >
                                <option value="">SELECT LANG</option>
                                {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <div className="relative">
                                <input
                                  type={f.type === 'password' ? (showPassword ? 'text' : 'password') : (f.type || 'text')}
                                  name={f.name}
                                  placeholder={f.placeholder}
                                  value={formData[f.name]}
                                  onChange={handleChange}
                                  className={`w-full pl-12 pr-${f.type === 'password' ? '12' : '4'} py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-xs placeholder:text-slate-400`}
                                  required
                                />
                                {f.type === 'password' && (
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                  >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl hover:bg-primary transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 uppercase tracking-tighter"
                      >
                        REGISTER <ArrowRight size={24} />
                      </button>
                      <p className="text-center mt-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        Registered? <Link to="/login" className="text-slate-900 hover:text-primary underline transition-all underline-offset-4 font-bold">Bypass to Login</Link>
                      </p>
                      <Link to="/hirer/signup" className="text-primary text-[9px] font-black uppercase tracking-[0.2em] hover:text-emerald transition-all italic mt-4 block text-center">Recruiting for a company? Register as Hirer</Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes border-travel {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-border-travel {
            animation: border-travel 3s linear infinite;
          }
          @keyframes scanner {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .animate-scanner {
            animation: scanner 2s ease-in-out infinite;
          }
        `}} />

        {/* Biometric Face Enrollment Modal */}
        {isEnrolling && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl p-8 relative flex flex-col items-center">
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight italic">Biometric Face Enrollment</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">LIVENESS CHECKS REQUIREMENT</p>
              </div>

              {/* Webcam viewport */}
              <div className="w-full max-w-sm aspect-video bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center mb-6">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  onPlay={handleVideoPlay}
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Neon scanner animation overlay */}
                <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                  
                  {/* Scanner line */}
                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent absolute top-0 animate-scanner"></div>
                </div>
              </div>

              {/* Steps Checklist */}
              <div className="w-full space-y-3 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 font-mono text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className={enrollmentStep === 'loading' ? 'text-primary animate-pulse' : (enrollmentStep !== 'position' ? 'text-emerald-500 font-bold' : 'text-slate-400')}>
                    {enrollmentStep === 'loading' ? '⏳ Loading Face Recognition Engine...' : (enrollmentStep !== 'position' ? '✓ Initial Face Position' : `▶ Position Face in Center (Nose Ratio: ${currentNoseRatio} / Target: 0.7 - 1.4)`)}
                  </span>
                </div>
                
                {challenges.map((c, idx) => {
                  const isActive = enrollmentStep === c.type;
                  const isCompleted = currentChallengeIndex > idx || ['capturing', 'success'].includes(enrollmentStep);
                  
                  let readout = '';
                  if (isActive) {
                    if (c.type === 'blink') readout = ` (${blinkCount}/2) (EAR: ${currentEAR} / Target: < 0.20)`;
                    if (c.type === 'turnLeft' || c.type === 'turnRight') readout = ` (Nose Ratio: ${currentNoseRatio})`;
                    if (c.type === 'smile') readout = ` (Smile Ratio: ${currentSmileRatio} / Target: > 0.35)`;
                  }

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={isActive ? 'text-primary font-bold animate-pulse' : (isCompleted ? 'text-emerald-500 font-bold' : 'text-slate-400')}>
                        {isCompleted ? `✓ ${c.label} Checked` : `▶ ${c.label}${readout}`}
                      </span>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2">
                  <span className={enrollmentStep === 'capturing' ? 'text-primary font-bold animate-pulse' : (enrollmentStep === 'success' ? 'text-emerald-500 font-bold' : 'text-slate-400')}>
                    {enrollmentStep === 'success' ? '✓ Biometrics Registered' : `▶ Capturing Biometric Footprint (${enrollmentSamples.length}/10)`}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              {enrollmentStep === 'capturing' && (
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
                  <div 
                    className="bg-primary h-full transition-all duration-300" 
                    style={{ width: `${enrollmentSamples.length * 10}%` }}
                  />
                </div>
              )}

              {enrollmentStep === 'success' && (
                <div className="text-center font-bold text-emerald-500 text-sm mb-6 animate-bounce">
                  ✨ BIOMETRIC ID MATCH SUCCESSFUL! PROCEEDING TO REGISTRATION...
                </div>
              )}

              <button 
                type="button" 
                onClick={() => setIsEnrolling(false)} 
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-red-600 transition-all shadow-md"
              >
                Cancel Enrollment
              </button>
            </div>
          </div>
        )}

        {/* Cinematic Particles */}
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -1000],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 5 + Math.random() * 10, 
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              className="absolute w-px h-10 bg-primary"
              style={{ left: `${Math.random() * 98 + 1}%`, bottom: "-10%" }}
            ></motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Signup;
