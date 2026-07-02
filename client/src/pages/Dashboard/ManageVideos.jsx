import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Upload, Film, Edit, Trash2, Play, Eye, 
  X, CheckCircle, ChevronLeft, ChevronRight, FileText, Loader2, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { API_URL } from '../../utils/api';

const ManageVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;

  // Upload Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Modal States
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState('');
  const [editProgress, setEditProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Preview Modal States
  const [previewingVideo, setPreviewingVideo] = useState(null);

  const fetchVideos = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/videos?page=${p}&limit=${limit}`);
      setVideos(res.data.videos || []);
      setPage(res.data.pagination.page);
      setTotalPages(res.data.pagination.pages || 1);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(page);
  }, [page]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation: MP4, MOV, AVI, WEBM
    const allowedExtensions = ['mp4', 'mov', 'avi', 'webm'];
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      toast.error('Invalid file format. Only mp4, mov, avi, and webm are allowed.');
      e.target.value = '';
      return;
    }

    // Validation: 500MB Limit
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File size exceeds the 500MB limit.');
      e.target.value = '';
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['mp4', 'mov', 'avi', 'webm'];
    const extension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      toast.error('Invalid format. Use mp4, mov, avi, webm.');
      e.target.value = '';
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('File exceeds 500MB limit.');
      e.target.value = '';
      return;
    }

    setEditFile(file);
    setEditPreview(URL.createObjectURL(file));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      toast.error('Please select a video file to upload.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a video title.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', videoFile);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await axios.post(`${API_URL}/admin/videos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      toast.success('Video uploaded successfully to Cloudinary!');
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setVideoPreview('');
      fetchVideos(1); // reload page 1
    } catch (error) {
      console.error("Upload Error:", error);

      if (error.response) {
          console.log(error.response.status);
          console.log(error.response.data);
      }

      if (error.request) {
          console.log(error.request);
      }

      console.log(error.message);

      const serverMessage = error.response?.data?.message;
      const serverDetail = error.response?.data?.error;
      const displayMessage = serverMessage ? `${serverMessage}${serverDetail ? `: ${serverDetail}` : ''}` : error.message || 'Video upload failed. Try again.';
      
      toast.error(`Upload failed: ${displayMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error('Title is required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('description', editDescription);
    if (editFile) {
      formData.append('video', editFile);
    }

    setIsUpdating(true);
    setEditProgress(0);

    try {
      await axios.put(`${API_URL}/admin/videos/${editingVideo.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (editFile) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setEditProgress(percent);
          }
        }
      });

      toast.success('Video updated successfully!');
      setEditingVideo(null);
      setEditFile(null);
      setEditPreview('');
      fetchVideos(page);
    } catch (error) {
      console.error("Upload Error:", error);

      if (error.response) {
          console.log(error.response.status);
          console.log(error.response.data);
      }

      if (error.request) {
          console.log(error.request);
      }

      console.log(error.message);

      const serverMessage = error.response?.data?.message;
      const serverDetail = error.response?.data?.error;
      const displayMessage = serverMessage ? `${serverMessage}${serverDetail ? `: ${serverDetail}` : ''}` : error.message || 'Video update failed.';

      toast.error(`Update failed: ${displayMessage}`);
    } finally {
      setIsUpdating(false);
      setEditProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this video? This will destroy the record in DB and clean up Cloudinary.')) {
      try {
        await axios.delete(`${API_URL}/admin/videos/${id}`);
        toast.success('Video deleted successfully.');
        fetchVideos(page);
      } catch (error) {
        console.error('Delete failed:', error);
        toast.error('Failed to delete video.');
      }
    }
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || '');
    setEditFile(null);
    setEditPreview('');
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
            <Film className="text-emerald-500" size={56} /> Video Hub
          </h2>
          <p className="text-slate-500 font-medium tracking-tight text-lg">
            Manage premium system videos stored permanently in Cloudinary.
          </p>
        </div>
      </div>

      {/* Grid containing Upload Form & Video List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Panel */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <Upload className="text-emerald-500" size={24} /> Upload Video
            </h3>
            <p className="text-slate-400 text-sm font-semibold mt-1">Upload mp4, mov, avi, or webm (max 500MB).</p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Video Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold transition-all text-slate-800"
                disabled={isUploading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of the video..."
                rows={3}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold transition-all text-slate-800 resize-none"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Video Asset</label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50 text-center hover:bg-slate-100/50 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center gap-3">
                  <Film className="text-slate-400" size={32} />
                  <span className="text-sm font-bold text-slate-600">
                    {videoFile ? videoFile.name : 'Choose video or drag here'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">MP4, MOV, AVI, WEBM (Max 500MB)</span>
                </div>
              </div>
            </div>

            {/* Video Local Preview */}
            {videoPreview && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Preview Local File</label>
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video relative">
                  <video src={videoPreview} controls className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-wider">
                  <span>Uploading to Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black tracking-widest uppercase rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-700/30 transition-all flex items-center justify-center gap-3 cursor-pointer text-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Processing...
                </>
              ) : (
                <>
                  <Upload size={18} /> Deploy to Cloudinary
                </>
              )}
            </button>
          </form>
        </div>

        {/* Video List Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Film className="text-emerald-500" size={24} /> Library Videos
            </h3>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="text-emerald-500 animate-spin" size={40} />
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Querying Database...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-3xl">
                No videos found in the database. Use the upload panel to add some.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((v) => (
                  <div 
                    key={v.id} 
                    className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden hover:shadow-lg transition-all group flex flex-col"
                  >
                    {/* Thumbnail / Hover Play overlay */}
                    <div className="aspect-video bg-black relative overflow-hidden shrink-0">
                      <img 
                        src={v.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640'} 
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={() => setPreviewingVideo(v)}
                          className="w-12 h-12 bg-white/20 hover:bg-white/90 text-white hover:text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer"
                        >
                          <Play size={20} fill="currentColor" />
                        </button>
                      </div>
                      {v.duration > 0 && (
                        <span className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded-md text-[10px] font-black text-white uppercase tracking-wider">
                          {Math.floor(v.duration / 60)}:{(v.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight line-clamp-1">{v.title}</h4>
                        <p className="text-slate-400 font-semibold text-xs mt-1 line-clamp-2">{v.description || 'No description provided.'}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 mt-auto">
                        <button
                          onClick={() => openEditModal(v)}
                          className="px-4 py-2 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-black tracking-wider text-xs uppercase rounded-xl border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="px-4 py-2 hover:bg-red-50 text-slate-400 hover:text-red-600 font-black tracking-wider text-xs uppercase rounded-xl border border-transparent hover:border-red-200 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 py-2 border-t border-slate-100">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600 cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600 cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">Modify Asset Properties</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Asset ID: {editingVideo.id}</p>
              </div>
              <button
                onClick={() => setEditingVideo(null)}
                className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-all cursor-pointer shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Video Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold transition-all text-slate-800"
                  disabled={isUpdating}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold transition-all text-slate-800 resize-none"
                  disabled={isUpdating}
                />
              </div>

              {/* Replace video file option */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Replace Video File (Optional)</label>
                <div className="relative border border-slate-200 rounded-2xl p-4 bg-slate-50 text-center hover:bg-slate-100/50 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={handleEditFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUpdating}
                  />
                  <div className="flex items-center justify-center gap-3">
                    <Upload size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">
                      {editFile ? editFile.name : 'Select a new video to replace current file'}
                    </span>
                  </div>
                </div>
              </div>

              {editPreview && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Preview Replacement</label>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video">
                    <video src={editPreview} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {isUpdating && editFile && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-wider">
                    <span>Uploading replacement to Cloudinary...</span>
                    <span>{editProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${editProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black tracking-widest uppercase rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer text-xs"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Deploying Updates...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewingVideo && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <button
            onClick={() => setPreviewingVideo(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
          >
            <X size={24} />
          </button>
          
          <div className="max-w-5xl w-full flex flex-col gap-4">
            <div className="aspect-video w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl relative border border-white/5">
              <video
                src={previewingVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h4 className="text-2xl font-black text-white uppercase tracking-tight">{previewingVideo.title}</h4>
              <p className="text-slate-400 font-semibold text-sm mt-1">{previewingVideo.description || 'No description.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVideos;
