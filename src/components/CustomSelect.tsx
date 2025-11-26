import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            onChange(options[highlightedIndex].value);
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, options, onChange]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        const currentIndex = options.findIndex(option => option.value === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* Select Trigger */}
      <div
        onClick={handleToggle}
        className={`
          w-full px-4 py-3 border rounded-lg cursor-pointer transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
            : isOpen
            ? 'border-orange-500 ring-2 ring-orange-200 bg-gradient-to-r from-white to-orange-50'
            : 'border-orange-200 hover:border-orange-300 bg-gradient-to-r from-white to-orange-50'
          }
        `}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            {selectedOption ? (
              <div>
                <div className="text-gray-900 font-medium">{selectedOption.label}</div>
                {selectedOption.subtitle && (
                  <div className="text-sm text-gray-600">{selectedOption.subtitle}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">{placeholder}</div>
            )}
          </div>
          <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-center">No options available</div>
          ) : (
            options.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`
                  px-4 py-3 cursor-pointer border-b border-orange-100 last:border-b-0 transition-all duration-150
                  ${highlightedIndex === index 
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-900' 
                    : 'hover:bg-orange-50'
                  }
                  ${value === option.value 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold' 
                    : 'text-gray-900'
                  }
                `}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium">{option.label}</div>
                {option.subtitle && (
                  <div className={`text-sm mt-1 ${
                    value === option.value ? 'text-orange-100' : 'text-gray-600'
                  }`}>
                    {option.subtitle}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}