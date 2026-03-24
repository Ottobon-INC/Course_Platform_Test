import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Linkedin, Facebook, Link as LinkIcon, ArrowRight, Award, BookOpen, Instagram, Check } from 'lucide-react';
import { buildApiUrl } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SlideInPromo } from '@/components/blog/SlideInPromo';

interface Blog {
  id: string;
  title: string;
  description: string;
  summary: string;
  image_url: string;
  url: string;
  domain: string;
  hashtags: string[];
  created_at: string;
}

const BlogDetailPage: React.FC = () => {
  const [, params] = useRoute('/blogs/:id');
  const [, setLocation] = useLocation();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkedInCopied, setLinkedInCopied] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/blogs/${params?.id}`));
        if (response.ok) {
          const data = await response.json();
          setBlog(data);
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
      } finally {
        setLoading(false);
      }
    };
    if (params?.id) {
       window.scrollTo(0, 0);
       fetchBlog();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center font-sans">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-10 h-10 bg-retro-salmon rounded-lg"
        ></motion.div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-24 h-24 bg-retro-sage/10 rounded-full flex items-center justify-center mb-6">
           <BookOpen size={48} className="text-retro-teal/20" />
        </div>
        <h1 className="text-3xl font-bold text-retro-teal mb-4">Blog Post Not Found</h1>
        <p className="text-retro-teal/50 mb-8 max-w-sm">The article you're looking for might have been moved or is no longer available.</p>
        <button 
          onClick={() => setLocation('/')} 
          className="bg-retro-teal text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-retro-salmon hover:scale-105 transition-all duration-300 active:scale-95"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans selection:bg-retro-salmon/20 selection:text-retro-salmon">
      <Navbar />
      
      {/* Article Header & Title Section */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-16 md:pt-40 md:pb-24">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <button 
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-retro-teal/60 hover:text-retro-salmon transition-colors font-bold tracking-tight group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          
          <div className="flex items-center gap-5 text-retro-teal/40 relative">
            <span className="text-sm font-bold tracking-widest uppercase">Share</span>

            {/* Twitter / X */}
            <button
              title="Share on X (Twitter)"
              onClick={() => {
                // Twitter limit: 280 chars total.
                // t.co URL shortener uses exactly 23 chars + 1 space = 24 reserved.
                // Static suffix "\n\nRead on Ottolearn 👇 " = 24 chars.
                // Remaining budget for title + summary snippet.
                const TWITTER_LIMIT = 280;
                const URL_CHARS = 24;          // t.co always = 23 + 1 space
                const SUFFIX = '\n\nRead on Ottolearn 👇 ';
                const budget = TWITTER_LIMIT - URL_CHARS - SUFFIX.length; // ~232 chars

                const title = blog.title || '';
                const rawSummary = blog.summary || blog.description || '';

                let tweetText = '';
                if (title.length <= budget) {
                  // Use remaining space for a clipped summary
                  const summaryBudget = budget - title.length - 2; // -2 for \n\n
                  if (summaryBudget > 20 && rawSummary) {
                    const clippedSummary = rawSummary.length > summaryBudget
                      ? rawSummary.slice(0, summaryBudget - 1) + '…'
                      : rawSummary;
                    tweetText = `${title}\n\n${clippedSummary}${SUFFIX}`;
                  } else {
                    tweetText = `${title}${SUFFIX}`;
                  }
                } else {
                  // Title itself is too long — clip it
                  tweetText = `${title.slice(0, budget - 1)}…${SUFFIX}`;
                }

                const url = encodeURIComponent(window.location.href);
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${url}`,
                  '_blank'
                );
              }}
              className="hover:text-black transition-all hover:scale-110 cursor-pointer"
            >
              {/* Official X (Twitter) logo SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.754l7.737-8.835L1.6 2.25h6.637l4.258 5.625 5.75-5.625Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>

            {/* Facebook */}
            <button
              title="Share on Facebook"
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                const quote = encodeURIComponent(`${blog.title} — Read on Ottolearn`);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank');
              }}
              className="hover:text-[#1877F2] transition-all hover:scale-110 cursor-pointer"
            >
              <Facebook size={18} />
            </button>

            {/* LinkedIn */}
            <button
              title="Share on LinkedIn"
              onClick={() => {
                // Use LinkedIn's feed composer URL which supports pre-filling text directly.
                // Format: linkedin.com/feed/?shareActive=true&text=ENCODED_TEXT
                // This opens the LinkedIn post composer with text AND URL already filled in.
                const postText = `📖 ${blog.title}\n\n${blog.summary || blog.description || ''}\n\nRead the full article 👉 ${window.location.href}\n\n#Ottolearn #Learning #Education`;
                const encodedText = encodeURIComponent(postText);
                window.open(
                  `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`,
                  '_blank'
                );
              }}
              className="hover:text-[#0A66C2] transition-all hover:scale-110 cursor-pointer"
            >
              <Linkedin size={18} />
            </button>

            {/* Instagram — Copy to clipboard */}
            <button
              title="Copy link for Instagram"
              onClick={() => {
                const text = `${blog.title}\n\nRead on Ottolearn 👉 ${window.location.href}`;
                navigator.clipboard.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                });
              }}
              className="hover:text-[#E1306C] transition-all hover:scale-110 cursor-pointer"
            >
              <Instagram size={18} />
            </button>

            {/* Copy Link */}
            <button
              title="Copy page link"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                });
              }}
              className="hover:text-retro-salmon transition-all hover:scale-110 cursor-pointer"
            >
              <LinkIcon size={18} />
            </button>

            {/* Copied! toast — for Instagram & Copy Link */}
            <AnimatePresence>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  className="absolute -bottom-10 right-0 bg-retro-teal text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg whitespace-nowrap z-50"
                >
                  <Check size={12} /> Copied to clipboard!
                </motion.div>
              )}
              {linkedInCopied && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  className="absolute -bottom-10 right-0 bg-[#0A66C2] text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg whitespace-nowrap z-50"
                >
                  <Check size={12} /> Post text copied! Paste it in LinkedIn 📋
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Article Meta Data */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 mb-8 text-sm font-bold tracking-tight"
        >
          <div className="w-10 h-10 bg-white border border-retro-sage/30 rounded-xl flex items-center justify-center text-retro-teal shadow-sm group hover:border-retro-salmon transition-all duration-500">
            {blog.domain?.[0]?.toUpperCase() || 'T'}
          </div>
          <div className="flex flex-col">
            <span className="text-retro-teal font-extrabold hover:text-retro-salmon transition-colors cursor-pointer">{blog.domain || 'techcrunch.com'}</span>
            <span className="text-retro-teal/30 text-[10px] uppercase font-bold tracking-widest">
              {blog.created_at ? new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Mar 17, 2026'}
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold text-retro-teal mb-10 leading-[1.15] tracking-tight"
        >
          {blog.title}
        </motion.h1>

        {/* Headline Subtitle / Summary */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-retro-teal/70 leading-relaxed mb-16 font-medium selection:bg-retro-salmon selection:text-white"
        >
          {blog.summary || blog.description}
        </motion.p>

        {/* Featured Image - Hero Style from image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="rounded-[2.5rem] overflow-hidden shadow-2xl mb-16 border-4 border-white relative z-0"
        >
          <img 
            src={blog.image_url || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop'} 
            alt={blog.title}
            className="w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </motion.div>

        {/* Hashtags Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-3 mb-20"
        >
          {blog.hashtags?.map((tag, i) => (
            <span 
              key={i} 
              className="bg-white border border-retro-sage/30 text-retro-teal/60 text-xs font-bold px-6 py-2.5 rounded-full hover:border-retro-salmon hover:text-retro-salmon hover:-translate-y-1 hover:shadow-lg transition-all cursor-default"
            >
              #{tag}
            </span>
          ))}
        </motion.div>

        {/* Article Content Area (Visual separator from image) */}
        <div className="h-px bg-retro-sage/20 w-full mb-16"></div>

        {/* Read Original Section - Matches image exactly */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white border border-retro-sage/20 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl shadow-retro-sage/10 relative overflow-hidden group mb-24"
        >
          {/* Subtle background flair */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-retro-salmon/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative z-10 text-center md:text-left">
            <span className="text-retro-salmon text-[10px] font-black uppercase tracking-[0.2em] block mb-3">Next Steps</span>
            <div className="text-xl md:text-2xl text-retro-teal font-medium">
              Read the full article at <span className="font-black text-retro-teal underline decoration-retro-salmon/30 underline-offset-4">{blog.domain || 'techcrunch.com'}</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.open(blog.url, '_blank')}
            className="relative z-10 bg-black text-white px-10 py-4 rounded-full font-bold flex items-center gap-3 hover:bg-retro-salmon transition-all duration-300 shadow-xl hover:shadow-retro-salmon/30 hover:-translate-y-1 active:scale-95 group/btn"
          >
            Read Original 
            <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Curation Badge - Matches image exactly */}
        <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in duration-1000 delay-700">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-retro-salmon" />
            <span className="text-sm font-bold text-retro-teal/40 uppercase tracking-[0.15em]">Curated by</span>
          </div>
          <span 
            className="text-lg font-black text-retro-teal border-b-2 border-retro-salmon/50 hover:text-retro-salmon hover:border-retro-salmon transition-all cursor-pointer"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            Vertical Pulse
          </span>
        </div>

      </div>
      <SlideInPromo relatedTags={blog.hashtags || []} />
      <Footer />
    </div>
  );
};

export default BlogDetailPage;
