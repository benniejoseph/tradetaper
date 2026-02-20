import React, { useState, useEffect } from 'react';
import { FaNewspaper, FaVideo, FaSearch, FaFilter } from 'react-icons/fa';
import { authApiClient as api } from '@/services/api';

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  category: string;
  hasVideo?: boolean;
  videoUrl?: string;
}

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory]);

  const fetchNews = async (category: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/market-intelligence/news?category=${category}`);
      const payload = response.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.news)
            ? payload.news
            : [];
      setNews(items);
    } catch (error) {
      console.error('Failed to fetch news', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Forex', 'Crypto', 'Stocks', 'Economy', 'Fed'];

  return (
    <div className="flex flex-col space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 pb-2">
        {categories.map(cat => (
           <button
             key={cat}
             onClick={() => setActiveCategory(cat.toLowerCase())}
             className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
               activeCategory === cat.toLowerCase()
                 ? 'bg-emerald-600 text-white'
                 : 'bg-white dark:bg-black/70 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-950/40'
             }`}
           >
             {cat}
           </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-emerald-950/40 rounded-lg h-64"></div>
          ))
        ) : (
          news.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-black/70 rounded-lg shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Image / Video */}
              <div className="relative h-48 bg-gray-200 dark:bg-emerald-950/40">
                {item.hasVideo && item.videoUrl ? (
                   <iframe 
                     src={item.videoUrl} 
                     className="w-full h-full" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                     allowFullScreen
                   />
                ) : (
                   item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400">
                       <FaNewspaper size={48} />
                     </div>
                   )
                )}
                {item.hasVideo && !item.videoUrl && (
                   <div className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full">
                     <FaVideo size={12} />
                   </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">{item.category}</span>
                   <span className="text-xs text-gray-500">{new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-md font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 flex-1">{item.description}</p>
                
                <div className="mt-auto flex justify-between items-center">
                   <span className="text-xs text-gray-500">{item.source}</span>
                   <a 
                     href={item.url} 
                     target="_blank" 
                     rel="noreferrer" 
                     className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                   >
                     Read More →
                   </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default NewsFeed;
