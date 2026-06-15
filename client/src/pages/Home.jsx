import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, GraduationCap, Briefcase, Users, MessageSquare, ArrowRight, Building } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import Footer from '../components/layout/Footer';

const Home = () => {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'employer') return <Navigate to="/employer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.6 }}
      className="flex-1 w-full flex flex-col min-h-screen"
    >

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-white via-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center md:text-left"
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-darkslate leading-tight">
              Empowering Rural Communities through <span className="text-primary">Digital Green Skills</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl">
              Unlock sustainable career opportunities. Learn modern green technologies, get certified, and connect with global employers looking for rural talent.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4 w-full">
              <Link to="/login" className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
                Start Your Journey <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-1 relative"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-8 border-white/50">
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000"
                alt="Green Technology"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-darkslate">Why Choose Our Platform?</h2>
            <p className="mt-4 text-gray-600">Tailored resources for the next generation of rural professionals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: GraduationCap, title: "Green Skills Courses", desc: "Expert-led modules on sustainability, renewable energy, and eco-friendly farming." },
              { icon: Briefcase, title: "Job Matching", desc: "Connect directly with companies actively seeking talent from rural backgrounds." },
              { icon: Users, title: "Expert Mentorship", desc: "Get one-on-one guidance from industry leaders and career counselors." },
              { icon: MessageSquare, title: "AI Assistant", desc: "24/7 doubt solving and career advice powered by advanced AI." },
              { icon: Leaf, title: "Sustainability Focus", desc: "Everything we teach is aimed at creating a greener, more sustainable future." },
              { icon: ArrowRight, title: "Progress Tracking", desc: "Visual analytics to track your learning milestones and achievements." }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl border border-gray-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all card-hover"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <f.icon className="text-primary w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-darkslate mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      <Footer />
    </motion.div>
  );
};

export default Home;
