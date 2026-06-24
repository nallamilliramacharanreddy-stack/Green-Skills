import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Printer, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import { API_URL, API_BASE_URL } from '../../utils/api';

const CertificateGenerator = ({ course, isOpen, onClose, user, onGenerated }) => {
  const [studentName, setStudentName] = useState(user?.name || '');
  const [courseName, setCourseName] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [savedCertificate, setSavedCertificate] = useState(null);
  const certificateRef = useRef(null);

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (course) {
      setCourseName(course.title || '');
    }
  }, [course]);

  useEffect(() => {
    if (user?.name) {
      setStudentName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (isGenerated && containerRef.current) {
      const updateScale = () => {
        const containerWidth = containerRef.current.offsetWidth;
        if (containerWidth < 1000) {
          setScale((containerWidth - 40) / 1000);
        } else {
          setScale(1);
        }
      };
      
      setTimeout(updateScale, 50);
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [isGenerated]);

  useEffect(() => {
    const saveCertificate = async () => {
      if (isGenerated && isGenerating) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!certificateRef.current) {
          setIsGenerating(false);
          setIsGenerated(false);
          alert("Error: Certificate element not found.");
          return;
        }
        
        const originalTransform = certificateRef.current.style.transform;
        certificateRef.current.style.transform = 'none';
        
        try {
          const canvas = await html2canvas(certificateRef.current, { 
            scale: 2,
            useCORS: true,
            logging: false
          });
          
          const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.8);
          
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
          });
          pdf.addImage(thumbnailBase64, 'JPEG', 0, 0, canvas.width, canvas.height);
          const pdfBase64 = pdf.output('datauristring');
          
          const generatedId = `CERT-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          setCertificateId(generatedId);
          
          const res = await axios.post(`${API_URL}/certificates`, {
            certificateId: generatedId,
            userId: user?._id || user?.id,
            candidateName: studentName,
            courseName: courseName,
            issueDate: completionDate,
            pdfBase64,
            thumbnailBase64
          });
          
          setSavedCertificate(res.data.certificate);
          if (onGenerated) {
            onGenerated();
          }
        } catch (error) {
          console.error("Error saving certificate:", error);
          alert(error.response?.data?.message || error.message || "Failed to generate and save certificate. Please try again.");
          setIsGenerated(false);
        } finally {
          if (certificateRef.current) {
            certificateRef.current.style.transform = originalTransform;
          }
          setIsGenerating(false);
        }
      }
    };
    
    saveCertificate();
  }, [isGenerated]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!studentName || !courseName || !completionDate) return;
    
    const expectedName = "NALLAMILLI RAMA CHARAN REDDY";
    const inputName = studentName.trim();
    if (inputName.toUpperCase() === expectedName) {
      if (inputName !== expectedName) {
        alert(`Name must match exactly: ${expectedName}`);
        return;
      }
    }

    setIsGenerating(true);
    setIsGenerated(true);
  };

  const handleDownloadPDF = async () => {
    if (savedCertificate?.pdfUrl) {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}${savedCertificate.pdfUrl}`;
      link.download = `${studentName.replace(/\s+/g, '_')}_Certificate.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!certificateRef.current) return;
    
    const originalTransform = certificateRef.current.style.transform;
    certificateRef.current.style.transform = 'none';
    
    try {
      const canvas = await html2canvas(certificateRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${studentName.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      certificateRef.current.style.transform = originalTransform;
    }
  };


  const handlePrint = async () => {
    if (!certificateRef.current) return;
    
    // Temporarily remove transform for accurate high-res capture
    const originalTransform = certificateRef.current.style.transform;
    certificateRef.current.style.transform = 'none';
    
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Certificate</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #333; }
              img { max-width: 100%; max-height: 100vh; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
              @media print {
                @page { size: landscape; margin: 0; }
                body { background: white; }
                img { width: 100vw; height: 100vh; object-fit: contain; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="setTimeout(() => { window.print(); window.close(); }, 500);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Error printing:", err);
    } finally {
      certificateRef.current.style.transform = originalTransform;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-10">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic mb-8">
              Course Completion Certificate
            </h2>

            {!isGenerated ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Student Name *</label>
                    <input 
                      type="text" 
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter your full name exactly as you want it on the certificate"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Course Name *</label>
                    <input 
                      type="text" 
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Completion Date *</label>
                    <input 
                      type="date" 
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button 
                      onClick={onClose}
                      className="w-1/3 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleGenerate}
                      disabled={!studentName || !courseName || !completionDate || isGenerating}
                      className="w-2/3 py-4 bg-primary text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGenerating ? 'Generating...' : 'Yes, Continue'}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <CheckCircle size={48} className="text-primary mb-4 opacity-50" />
                  <p className="text-slate-500 font-medium mb-2">
                    Verify your details carefully. 
                  </p>
                  <p className="text-slate-400 text-sm">
                    This information will be permanently embedded in your digitally generated completion certificate.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                {/* Certificate Preview Container */}
                <div 
                  ref={containerRef}
                  className="w-full flex justify-center overflow-hidden pb-6"
                  style={{ height: `${707 * scale}px` }}
                >
                  <div 
                    ref={certificateRef}
                    className="relative bg-white shadow-sm flex-shrink-0 origin-top"
                    style={{ 
                      width: '1000px', 
                      height: '707px',
                      transform: `scale(${scale})`
                    }} 
                  >
                    <img 
                      src="/certificate-template.jpg" 
                      alt="Certificate Background" 
                      className="absolute inset-0 w-full h-full object-cover z-0" 
                      crossOrigin="anonymous" 
                    />
                    
                    {/* Certificate Content Overlay */}
                    <div className="relative z-10 w-full h-full flex flex-col items-center pt-[310px]">
                      
                      <p className="text-slate-600 text-[14px] tracking-[0.2em] mb-2 font-serif font-medium">
                        {new Date(completionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      
                      <h1 className="text-[36px] font-serif text-[#2C3E2D] uppercase tracking-[0.1em] mb-2 max-w-[85%] text-center leading-tight drop-shadow-sm font-bold">
                        {studentName}
                      </h1>
                      
                      <p className="text-slate-600 text-[16px] mb-2 font-serif italic">
                        has successfully completed
                      </p>
                      
                      <h2 className="text-[26px] font-serif text-[#2C3E2D] max-w-[65%] text-center font-bold leading-snug">
                        {courseName}
                      </h2>

                      {/* Unique ID Generator */}
                      <p className="absolute bottom-12 left-12 text-slate-500 text-[11px] font-mono opacity-70">
                        ID: {certificateId || 'GENERATING...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <button 
                    onClick={handleDownloadPDF}
                    style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                    className="px-10 py-4 rounded-xl font-bold uppercase text-sm tracking-widest flex items-center gap-3 transition-colors shadow-lg hover:opacity-90"
                  >
                    <Download size={18} /> Download
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase text-sm tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-colors shadow-lg"
                  >
                    <Printer size={18} /> Print
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CertificateGenerator;
