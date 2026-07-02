import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Film, Play, Eye, X, ChevronLeft, ChevronRight, 
  Clock, Sparkles, Loader2, BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/api';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [playingVideo, setPlayingVideo] = useState(null);
  const limit = 6;

  const fetchVideos = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/videos?page=${p}&limit=${limit}`);
      setVideos(res.data.videos || []);
      setPage(res.data.pagination.page);
      setTotalPages(res.data.pagination.pages || 1);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load video library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(page);
  }, [page]);

  return (
    <DashboardLayout role="student">
      <div className="max-w-[1400px] mx-auto py-6 px-4 space-y-12">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 tracking-[0.2em] uppercase drop-shadow-sm mb-0.5">
            Knowledge Vault
          </span>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
            <Film className="text-emerald-500" size={48} /> Video Library
          </h2>
          <p className="text-slate-500 font-medium tracking-tight text-lg">
            Stream high-definition tutorials and lectures directly from our secure cloud storage.
          </p>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-emerald-500 animate-spin" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Connecting to Media Vault...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-white p-8">
            <Film className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold text-lg">No educational videos available.</p>
            <p className="text-slate-400 text-sm mt-1">Please check back later or check with your instructor.</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
                >
                  {/* Poster / Overlay play button */}
                  <div className="aspect-video bg-slate-950 relative overflow-hidden shrink-0">
                    <img 
                      src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640'} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640';
                      }}
                    />
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <button
                        onClick={() => setPlayingVideo(video)}
                        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg scale-90 group-hover:scale-100 cursor-pointer"
                      >
                        <Play size={24} className="ml-1" fill="currentColor" />
                      </button>
                    </div>

                    {video.duration > 0 && (
                      <span className="absolute bottom-4 right-4 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 border border-white/10">
                        <Clock size={10} />
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="p-8 flex-1 flex flex-col justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-slate-400 font-semibold text-xs mt-2 leading-relaxed line-clamp-3">
                        {video.description || 'No description available for this video tutorial.'}
                      </p>
                    </div>

                    <button
                      onClick={() => setPlayingVideo(video)}
                      className="w-full py-4.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 font-black tracking-wider text-xs uppercase rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Play size={14} fill="currentColor" /> Play Tutorial
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-8 border-t border-slate-100">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600 cursor-pointer shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/50 px-4 py-2 rounded-full">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600 cursor-pointer shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Playback Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4">
          <button
            onClick={() => setPlayingVideo(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all cursor-pointer border border-white/10"
          >
            <X size={24} />
          </button>
          
          <div className="max-w-5xl w-full flex flex-col gap-6">
            <div className="aspect-video w-full bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl relative border border-white/5">
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                <source src={playingVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="px-2">
              <h4 className="text-3xl font-black text-white uppercase tracking-tight">{playingVideo.title}</h4>
              <p className="text-slate-400 font-semibold text-sm mt-2 leading-relaxed">{playingVideo.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Videos;
