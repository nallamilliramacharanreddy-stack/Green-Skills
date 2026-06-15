import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Users, BookOpen, Briefcase, Globe, 
  TrendingUp, Activity, Settings, Zap,
  Server, ShieldCheck, Database, Cpu
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SuperAdmin = () => {
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Network Nodes Active',
      data: [1200, 1900, 3000, 5000, 8500, 12000],
      borderColor: '#10B981',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#10B981',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 10, family: 'Inter', weight: 'bold' },
        bodyFont: { size: 12, family: 'Inter', weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94A3B8' }, border: { display: false } },
      y: { grid: { color: '#F1F5F9', borderDash: [4, 4] }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94A3B8' }, border: { display: false } }
    }
  };

  const pieData = {
    labels: ['Students', 'Employers', 'Guides', 'Support'],
    datasets: [{
      data: [70, 15, 10, 5],
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#6366F1'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
              Nexus<br/><span className="text-primary">Core.</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Super Admin Topology Overview</p>
          </div>
          <button className="group px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-primary transition-colors shadow-2xl hover:shadow-primary/30">
            Generate Systems Report <Database size={16} className="group-hover:animate-pulse" />
          </button>
        </div>

        {/* Core Stats Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Active Synced Users', value: '12,450', icon: Users, change: '+12%', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Knowledge Nodes', value: '156', icon: BookOpen, change: '+5', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Market Vectors', value: '890', icon: Briefcase, change: '+18%', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Grid Expansion', value: '42', icon: Globe, change: '+2', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 md:p-8 rounded-[2.5rem] bg-white border ${stat.border} shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}
            >
              <div className="absolute top-4 right-4 px-2 py-1 bg-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-slate-100 text-slate-600">
                {stat.change}
              </div>
              <div className={`w-14 h-14 ${stat.bg} rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-white`}>
                <stat.icon className={`${stat.color}`} size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Growth Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-2 bg-white rounded-[3rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-[1rem] flex items-center justify-center text-primary shadow-sm">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Network Growth Vector</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform Trajectory Analysis</p>
                </div>
              </div>
              <select className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20">
                <option>Q1-Q2 Trajectory</option>
                <option>Annual Scan</option>
              </select>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
              <Line data={lineData} options={lineOptions} />
            </div>
          </motion.div>

          {/* User Distribution */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="w-12 h-12 bg-white/10 border border-white/5 rounded-[1rem] flex items-center justify-center text-primary backdrop-blur-md">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Entity Scan</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distribution Matrix</p>
              </div>
            </div>

            <div className="relative z-10 h-[220px] flex items-center justify-center mb-8">
              <Doughnut 
                data={pieData} 
                options={{ 
                  maintainAspectRatio: false, 
                  cutout: '75%',
                  plugins: { legend: { display: false }, tooltip: { enabled: false } }
                }} 
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black tracking-tighter text-white">100%</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Capacity</span>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {[
                { label: 'Student Operatives', value: '70%', color: 'bg-emerald-500' },
                { label: 'Corporate Entities', value: '15%', color: 'bg-blue-500' },
                { label: 'Mentorship Guides', value: '10%', color: 'bg-amber-500' },
                { label: 'Overwatch Support', value: '5%', color: 'bg-indigo-500' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_10px_currentColor]`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdmin;
