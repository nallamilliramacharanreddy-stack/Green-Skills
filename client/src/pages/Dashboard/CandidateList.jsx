import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, Filter, Mail, GraduationCap, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/api';

const CandidateList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/users`);
      setCandidates(res.data);
    } catch (error) {
      toast.error('Failed to load candidate nexus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.skillsInterested && c.skillsInterested.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter ">Candidate Nexus</h2>
          <p className="text-slate-500 text-sm font-medium">Analyze and shortlist prospective green talent from the community.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="SEARCH TALENT..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary/50 transition-all font-mono text-[10px] w-64"
            />
          </div>
          <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Nexus...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Skill</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Education</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black uppercase shadow-inner">
                        {candidate.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{candidate.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{candidate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2">
                      {(candidate.skillsInterested && candidate.skillsInterested.length > 0) ? (
                        candidate.skillsInterested.slice(0, 2).map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-300 text-[10px] font-bold ">No skills listed</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <GraduationCap size={14} className="text-slate-400" />
                      {candidate.education || 'B.Tech Mechanical'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                      <div className={`w-1.5 h-1.5 ${candidate.isSuspended ? 'bg-red-500' : 'bg-emerald-500'} rounded-full animate-pulse`}></div>
                      {candidate.isSuspended ? 'Restricted' : 'Verified Talent'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4 flex items-center gap-2 ml-auto">
                      View Profile <Mail size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredCandidates.length === 0 && (
          <div className="text-center py-20 bg-slate-50">
            <Users className="mx-auto w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Talent Found</h3>
            <p className="text-slate-400 text-sm mt-2">Adjust your filters or search terms to explore the nexus.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default CandidateList;
