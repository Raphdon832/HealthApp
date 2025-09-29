// Utility functions for link detection and preview generation

export const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export function extractUrls(text) {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  return matches || [];
}

export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function getDomainFromUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
}

export async function fetchLinkPreview(url) {
  try {
    // Since we can't directly fetch from other domains due to CORS,
    // we'll use a simple approach to extract domain and create a basic preview
    const domain = getDomainFromUrl(url);
    
    // For common domains, provide custom handling
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        return {
          url,
          title: 'YouTube Video',
          description: 'Watch on YouTube',
          image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          domain: 'YouTube',
          type: 'video'
        };
      }
    }
    
    if (domain.includes('twitter.com') || domain.includes('x.com')) {
      return {
        url,
        title: 'Twitter/X Post',
        description: 'View on Twitter/X',
        image: null,
        domain: 'Twitter/X',
        type: 'social'
      };
    }
    
    if (domain.includes('instagram.com')) {
      return {
        url,
        title: 'Instagram Post',
        description: 'View on Instagram',
        image: null,
        domain: 'Instagram',
        type: 'social'
      };
    }
    
    if (domain.includes('github.com')) {
      return {
        url,
        title: 'GitHub Repository',
        description: 'View on GitHub',
        image: null,
        domain: 'GitHub',
        type: 'code'
      };
    }
    
    // Default preview for other links
    return {
      url,
      title: domain,
      description: 'Click to visit',
      image: null,
      domain: domain,
      type: 'website'
    };
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return {
      url,
      title: getDomainFromUrl(url),
      description: 'Click to visit',
      image: null,
      domain: getDomainFromUrl(url),
      type: 'website'
    };
  }
}

function extractYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}