import React from 'react';
import { extractUrls } from '@/lib/linkPreview';
import LinkPreview from './LinkPreview';

export default function MessageWithLinks({ text, isMine = false }) {
  if (!text) return null;

  const urls = extractUrls(text);
  
  // If no URLs found, return plain text
  if (urls.length === 0) {
    return <span>{text}</span>;
  }

  // Process the text to make URLs clickable
  let processedText = text;
  const linkElements = [];
  
  urls.forEach((url, index) => {
    const placeholder = `__LINK_${index}__`;
    processedText = processedText.replace(url, placeholder);
    
    linkElements[index] = (
      <a
        key={`url-${index}`}
        href={url.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline ${isMine ? 'text-sky-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'} transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        {url.trim()}
      </a>
    );
  });

  // Split by placeholders and reconstruct with links
  const parts = processedText.split(/(__LINK_\d+__)/);
  const finalElements = parts.map((part, index) => {
    const linkMatch = part.match(/^__LINK_(\d+)__$/);
    if (linkMatch) {
      const linkIndex = parseInt(linkMatch[1]);
      return linkElements[linkIndex];
    }
    return <span key={index}>{part}</span>;
  });

  return (
    <div className="space-y-2">
      {/* Render the text with clickable links */}
      <div>{finalElements}</div>
      
      {/* Render link previews below the message */}
      {urls.length > 0 && (
        <div className="space-y-2 mt-3">
          {urls.slice(0, 3).map((url, index) => (
            <LinkPreview 
              key={`preview-${url}-${index}`} 
              url={url.trim()} 
              compact={urls.length > 1}
            />
          ))}
          {urls.length > 3 && (
            <div className="text-xs text-gray-400 text-center">
              and {urls.length - 3} more link{urls.length - 3 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}