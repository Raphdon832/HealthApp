import { useState, useEffect } from 'react';
import { ExternalLink, Play, Code, Users, Globe } from 'lucide-react';
import { fetchLinkPreview, getDomainFromUrl } from '@/lib/linkPreview';

export default function LinkPreview({ url, compact = false }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    
    async function loadPreview() {
      try {
        setLoading(true);
        setError(false);
        const previewData = await fetchLinkPreview(url);
        setPreview(previewData);
      } catch (err) {
        console.error('Failed to load preview:', err);
        setError(true);
        // Fallback preview
        setPreview({
          url,
          title: getDomainFromUrl(url),
          description: 'Click to visit',
          image: null,
          domain: getDomainFromUrl(url),
          type: 'website'
        });
      } finally {
        setLoading(false);
      }
    }

    loadPreview();
  }, [url]);

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getIcon = () => {
    switch (preview?.type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-white animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div 
        className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-blue-600 hover:underline truncate">
              {url}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        className="border border-gray-200 rounded-lg p-2 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600 hover:underline truncate">
              {preview.domain}
            </div>
          </div>
          <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {preview.image && (
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          <img 
            src={preview.image} 
            alt={preview.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {preview.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="p-3">
        <div className="flex items-start gap-3">
          {!preview.image && (
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {getIcon()}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
              {preview.title}
            </div>
            
            {preview.description && (
              <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                {preview.description}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400 truncate">
                {preview.domain}
              </div>
              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}