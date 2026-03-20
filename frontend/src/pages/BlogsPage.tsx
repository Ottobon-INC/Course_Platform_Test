import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowRight, MessageSquare, BookOpen, Clock, Calendar } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CoursePromoCard } from '@/components/blog/CoursePromoCard';
import { buildApiUrl } from '@/lib/api';

interface Blog {
  id: string;
  title: string;
  description: string;
  summary: string;
  image_url: string;
  url: string;
  hashtags: string[];
  created_at: string;
}

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch(buildApiUrl('/blogs'));
        if (response.ok) {
          const data = await response.json();
          setBlogs(data);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-retro-bg flex flex-col">
      <Navbar onApplyTutor={() => setLocation('/become-a-tutor')} />
      <div className="pt-[72px]" /> {/* Spacer for fixed Navbar */}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-retro-teal py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-retro-salmon rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Insights & Stories</h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Exploring the frontiers of AI, education, and the future of work.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Blogs Feed */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            {loading ? (
              <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-3xl h-[450px] animate-pulse border border-retro-sage/20 shadow-sm"></div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-retro-sage/30 max-w-4xl mx-auto shadow-sm">
                <MessageSquare size={64} className="mx-auto text-retro-teal/10 mb-6" />
                <h2 className="text-2xl font-bold text-retro-teal mb-3">No blogs found</h2>
                <p className="text-retro-teal/50">Our writers are working hard. Check back soon for fresh content!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
                {blogs.map((blog, index) => (
                  <React.Fragment key={blog.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index % 3 * 0.1 }}
                      whileHover={{ y: -8 }}
                      onClick={() => setLocation(`/blogs/${blog.id}`)}
                      className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-retro-sage/10 group flex flex-col h-full cursor-pointer"
                    >
                      <div className="h-56 overflow-hidden relative">
                        <img 
                          src={blog.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop'} 
                          alt={blog.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                           {blog.hashtags?.slice(0, 3).map((tag, i) => (
                             <span key={i} className="bg-white/95 backdrop-blur-sm text-retro-teal text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                               #{tag}
                             </span>
                           ))}
                        </div>
                      </div>
                      
                      <div className="p-8 flex flex-col flex-1">
                        <div className="flex items-center gap-4 text-xs text-retro-teal/40 mb-4 font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-retro-salmon" />
                            {blog.created_at ? new Date(blog.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                          <span className="w-1 h-1 bg-retro-sage rounded-full" />
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} className="text-retro-salmon" />
                            5 min read
                          </span>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-retro-teal mb-4 line-clamp-2 leading-snug group-hover:text-retro-salmon transition-colors">
                          {blog.title}
                        </h3>
                        
                        <p className="text-retro-teal/60 mb-8 line-clamp-3 text-base leading-relaxed flex-1">
                          {blog.summary || blog.description}
                        </p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-retro-sage/10">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-retro-sage rounded-full flex items-center justify-center text-white font-bold text-xs">
                               OL
                             </div>
                             <span className="text-xs font-bold text-retro-teal">Ottolearn Staff</span>
                           </div>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setLocation(`/blogs/${blog.id}`);
                             }}
                             className="text-retro-salmon font-bold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all"
                           >
                             Read Article <ArrowRight size={18} />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Add Ad Unit after every 4th item (indices 3, 7, 11...) */}
                     {index > 0 && (index + 1) % 4 === 0 && (
                       <CoursePromoCard index={index + 1} relatedTags={blog.hashtags} />
                     )}
                     
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogsPage;
