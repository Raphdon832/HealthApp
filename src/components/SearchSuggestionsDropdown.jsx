import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * Reusable animated search suggestions dropdown component
 * Provides consistent animations, keyboard navigation hints, and styling across the app
 */
export default function SearchSuggestionsDropdown({
  suggestions = [],
  onSuggestionClick,
  selectedIndex = -1,
  showKeyboardHint = true,
  emptyMessage = "No suggestions found",
  emptySubMessage = "Try a different search term",
  className = "",
  maxHeight = "max-h-60",
  highlightQuery = "",
  renderSuggestion,
  // Icon and styling customization
  defaultIcon = MapPin,
  defaultIconBgColor = "bg-blue-100",
  defaultIconColor = "text-blue-600",
  suggestionType = "Suggestion"
}) {
  if (suggestions.length === 0 && !emptyMessage) return null;

  const highlightText = (text, query) => {
    if (!query.trim() || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 px-1 rounded">{part}</span>
      ) : (
        part
      )
    );
  };

  const defaultRenderSuggestion = (suggestion, index) => (
    <button
      key={suggestion.id || index}
      onClick={() => onSuggestionClick(suggestion)}
      className={`w-full text-left px-4 py-3 focus:outline-none transition-colors duration-200 border-b border-gray-100 last:border-b-0 animate-fadeInUp ${
        index === selectedIndex 
          ? 'bg-blue-100 border-blue-200 dark:border-gray-600' 
          : 'hover:bg-blue-50 focus:bg-blue-50'
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
          index === selectedIndex ? 'bg-blue-200' : defaultIconBgColor
        }`}>
          {React.createElement(defaultIcon, {
            className: `h-4 w-4 ${
              index === selectedIndex ? 'text-blue-700' : defaultIconColor
            }`
          })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {suggestion.primaryText ? 
              highlightText(suggestion.primaryText, highlightQuery) : 
              (suggestion.name || suggestion.title || suggestion.display_name)
            }
          </div>
          {suggestion.secondaryText && (
            <div className="text-xs text-gray-500 truncate mt-1">
              {highlightText(suggestion.secondaryText, highlightQuery)}
            </div>
          )}
        </div>
        <div className="text-xs text-blue-600 font-medium flex-shrink-0">
          {suggestion.type || suggestionType}
        </div>
      </div>
    </button>
  );

  return (
    <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 ${maxHeight} overflow-y-auto animate-fade-in ${className}`}>
      {suggestions.length > 0 ? (
        suggestions.map((suggestion, index) => 
          renderSuggestion ? 
            renderSuggestion(suggestion, index, selectedIndex, highlightText) : 
            defaultRenderSuggestion(suggestion, index)
        )
      ) : (
        <div className="px-4 py-6 text-center text-gray-500 animate-fade-in">
          {React.createElement(defaultIcon, {
            className: "h-8 w-8 text-gray-300 mx-auto mb-2"
          })}
          <p className="text-sm">{emptyMessage}</p>
          {emptySubMessage && (
            <p className="text-xs mt-1">{emptySubMessage}</p>
          )}
        </div>
      )}
      
      {/* Keyboard navigation hint */}
      {showKeyboardHint && suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
          Use ↑↓ arrow keys to navigate, Enter to select, Esc to close
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing search suggestions state and keyboard navigation
 * Provides consistent behavior across all search components
 */
export function useSearchSuggestions(suggestions = []) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  // Reset selected index when suggestions change
  React.useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = React.useCallback((e, onSelectSuggestion) => {
    if (!showSuggestions || suggestions.length === 0) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return true;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return true;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length && onSelectSuggestion) {
          onSelectSuggestion(suggestions[selectedIndex]);
        }
        return true;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        return true;
      default:
        return false;
    }
  }, [showSuggestions, suggestions, selectedIndex]);

  const handleFocus = React.useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  const handleBlur = React.useCallback(() => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  const hideSuggestions = React.useCallback(() => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, []);

  return {
    showSuggestions,
    selectedIndex,
    setShowSuggestions,
    setSelectedIndex,
    handleKeyDown,
    handleFocus,
    handleBlur,
    hideSuggestions
  };
}
