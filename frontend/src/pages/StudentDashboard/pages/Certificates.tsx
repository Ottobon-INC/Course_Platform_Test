import React, { useState, useMemo } from 'react';
import { useCertificateData, type StudentCertificate } from '../hooks/useCertificateData';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';

export function Certificates() {
  const { data, isLoading, error } = useCertificateData();
  const { toast } = useToast();

  // State for search, filtering, and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'old'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'alpha'>('latest');

  // Derived data: filter and sort the certificates
  const filteredCertificates = useMemo(() => {
    if (!data?.certificates) return [];

    let result = [...data.certificates];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.courseTitle.toLowerCase().includes(q) || 
        c.displayName.toLowerCase().includes(q)
      );
    }

    // 2. Date filter (pills)
    if (activeFilter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(c => new Date(c.issuedAt) >= thirtyDaysAgo);
    } else if (activeFilter === 'old') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(c => new Date(c.issuedAt) < thirtyDaysAgo);
    }

    // 3. Sorting
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    } else if (sortBy === 'alpha') {
      result.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
    }

    return result;
  }, [data?.certificates, searchQuery, activeFilter, sortBy]);

  const handleShare = (cert: StudentCertificate) => {
    const url = `${window.location.origin}/course/${cert.courseSlug}/congrats/certificate`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Certificate link copied to clipboard.",
    });
  };

  const latestCert = data?.certificates?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4" />
        <h3 className="text-xl font-bold text-dark-text mb-2">Failed to load certificates</h3>
        <p className="text-gray-500 mb-6">There was an error connecting to the server.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-orange-primary text-white px-6 py-2 rounded-xl font-bold hover:brightness-110 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-85px)] bg-white p-4 md:p-8 pb-24 relative text-sans">
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
            <div>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">Your achievements and completed courses</p>
            </div>
            <div className="border border-gray-400/80 rounded-full px-4 py-1.5 text-sm text-gray-600 font-bold shadow-sm w-fit bg-white/50">
              Total Certificates Earned: {data?.stats.totalCerts || 0}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8 bg-white rounded-xl px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100">
            <div className="relative flex items-center flex-1 sm:flex-none">
              <i className="fas fa-search absolute left-3.5 text-gray-400 text-sm"></i>
              <input 
                type="text" 
                placeholder="Search certificates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm w-full sm:w-56 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all font-medium placeholder:text-gray-400 placeholder:font-medium" 
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`rounded-full px-5 py-1.5 text-sm font-bold shadow-sm transition-colors ${activeFilter === 'all' ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveFilter('recent')}
                className={`rounded-full px-5 py-1.5 text-sm font-bold shadow-sm transition-colors ${activeFilter === 'recent' ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                Recent
              </button>
              <button 
                onClick={() => setActiveFilter('old')}
                className={`rounded-full px-5 py-1.5 text-sm font-bold shadow-sm transition-colors ${activeFilter === 'old' ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                Old
              </button>
            </div>
            <div className="flex items-center gap-3 ml-0 sm:ml-auto">
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Sort by:</span>
              <div 
                onClick={() => setSortBy(sortBy === 'latest' ? 'alpha' : 'latest')}
                className="border border-gray-300 rounded-lg px-3.5 py-1.5 text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 bg-white font-medium shadow-sm transition-colors text-gray-700 flex-1 sm:flex-none"
              >
                {sortBy === 'latest' ? 'Latest first' : 'Alphabetical'} <i className="fas fa-exchange-alt text-gray-400 text-[0.65rem] text-center ml-1"></i>
              </div>
            </div>
          </div>

          {/* Certificate Grid */}
          {filteredCertificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCertificates.map((cert) => (
                <div key={cert.certificateId} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer">
                  {/* Card Header (Certificate Visual) */}
                  <div className="relative h-40 bg-gradient-to-br from-teal-800 to-teal-600 p-4 flex flex-col items-center justify-center text-center overflow-hidden border-b border-gray-100 group-hover:brightness-105 transition-all">
                    <div className="absolute inset-0 opacity-10">
                      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                    <p className="text-[0.45rem] text-teal-100/70 font-bold uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-1.5 relative z-10">
                      <i className="fas fa-building border border-teal-100/30 p-1 rounded-[2px]"></i> {cert.organizationName}
                    </p>
                    <h3 className="text-white font-serif text-[1rem] font-medium leading-tight mb-3 px-4 text-center z-10 line-clamp-2">{cert.courseTitle}</h3>
                    <p className="text-teal-50 font-serif italic text-[0.8rem] mb-4 z-10">{cert.displayName}</p>
                    <div className="w-6 h-6 rounded-full bg-yellow-400 absolute bottom-3 border-[2px] border-white/90 shadow-md flex flex-col items-center justify-center overflow-hidden z-10">
                      <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600"></div>
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-green-500 text-white text-[0.65rem] font-bold tracking-wide rounded-full px-2.5 py-0.5 shadow-sm z-10 uppercase">
                      Completed
                    </div>
                  </div>

                  {/* Card Info & Actions */}
                  <div className="p-4.5 flex flex-col flex-1 bg-white">
                    <h4 className="text-[0.95rem] font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 leading-tight">{cert.courseTitle}</h4>
                    <p className="text-[0.75rem] text-gray-500 font-medium mt-1.5 line-clamp-1" title={cert.organizationName}>{cert.organizationName}</p>
                    <p className="text-[0.7rem] font-bold text-gray-400 mt-1 mb-4 flex items-center gap-1">
                      {cert.issuedAtFormatted} <span className="text-gray-300 mx-0.5">|</span> Visakhapatnam time
                    </p>
                    <div className="flex gap-2 mt-auto">
                      <Link 
                        href={`/course/${cert.courseSlug}/congrats/certificate`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-gray-300 rounded-lg px-2.5 py-2 text-[0.75rem] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors flex-1 text-gray-700 font-bold shadow-sm"
                      >
                        <i className="fas fa-eye text-gray-400"></i> View
                      </Link>
                      <Link 
                        href={`/course/${cert.courseSlug}/congrats/certificate`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-orange-primary text-white rounded-lg px-2.5 py-2 text-[0.75rem] flex items-center justify-center gap-1.5 hover:bg-orange-600 hover:scale-105 transition-all flex-1 font-bold shadow-sm"
                      >
                        <i className="fas fa-download"></i> Download
                      </Link>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShare(cert); }}
                        className="border border-gray-300 rounded-lg px-2.5 py-2 text-[0.75rem] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors flex-1 text-gray-700 font-bold shadow-sm"
                      >
                        <i className="fas fa-share-alt text-gray-400"></i> Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                <i className="fas fa-certificate text-gray-300 text-2xl"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">No certificates found</h4>
              <p className="text-sm text-gray-500">
                {searchQuery ? "Try adjusting your search query." : "You haven't earned any certificates yet."}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6 pt-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-[1.05rem] font-bold text-gray-900 mb-4">Share Section</h3>
            <button 
              onClick={() => {
                if (latestCert) {
                  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/course/' + latestCert.courseSlug + '/congrats/certificate')}`;
                  window.open(url, '_blank');
                }
              }}
              className="bg-[#0077B5] hover:bg-[#006097] text-white rounded-lg px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 w-full transition-colors shadow-sm"
            >
              <i className="fab fa-linkedin text-xl"></i> LinkedIn
            </button>
            <div className="flex items-center gap-3.5 mt-5 border border-gray-200 rounded-xl p-2 hover:bg-gray-50 transition-colors cursor-pointer group shadow-sm">
              <div className="bg-gradient-to-br from-teal-800 to-teal-600 rounded-lg w-14 h-11 flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:brightness-110 shadow-inner">
                <i className="fas fa-certificate text-white/30 text-2xl absolute"></i>
                <span className="text-[0.3rem] text-white absolute bottom-1 right-1 font-serif italic text-shadow">
                  {latestCert ? latestCert.displayName.split(' ').map(n => n[0]).join('') : 'AA'}
                </span>
              </div>
              <p className="text-[0.8rem] text-gray-600 font-bold leading-tight">
                {latestCert ? `Check out my new ${latestCert.courseTitle} certificate!` : "Check out my new certificate!"}
              </p>
            </div>
            <p className="text-[0.7rem] font-medium text-gray-400 mt-3.5 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
              {latestCert ? `I'm excited to share that I've completed the ${latestCert.courseTitle} program at Ottolearn!` : "Check out my new certificate from Ottolearn!"}
            </p>
          </div>
        </div>
      </div>
      <i className="fas fa-sparkles fixed bottom-8 right-8 text-gray-300 opacity-40 text-4xl pointer-events-none drop-shadow-sm"></i>
    </div>
  );
}
