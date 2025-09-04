import React, { useState, useRef, useEffect, useCallback } from 'react';

const SplitPane = ({ 
  left, 
  right, 
  ratio = 0.5, 
  onChangeRatio, 
  minRatio = 0.2, 
  maxRatio = 0.8,
  className = '',
  theme = 'normal'
}) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRatio, setDragStartRatio] = useState(ratio);

  // Handle mouse/pointer events for resizing
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartRatio(ratio);
    
    // Capture pointer for smooth dragging
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  }, [ratio]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;

    e.preventDefault();
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const deltaX = e.clientX - dragStartX;
    const deltaRatio = deltaX / containerWidth;
    
    let newRatio = dragStartRatio + deltaRatio;
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
    
    if (onChangeRatio) {
      onChangeRatio(newRatio);
    }
  }, [isDragging, dragStartX, dragStartRatio, minRatio, maxRatio, onChangeRatio]);

  const handlePointerUp = useCallback((e) => {
    if (isDragging) {
      setIsDragging(false);
      
      // Release pointer capture
      if (e.target.releasePointerCapture) {
        e.target.releasePointerCapture(e.pointerId);
      }
    }
  }, [isDragging]);

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback((e) => {
    const step = 0.05; // 5% steps
    let newRatio = ratio;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newRatio = Math.max(minRatio, ratio - step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newRatio = Math.min(maxRatio, ratio + step);
        break;
      case 'Home':
        e.preventDefault();
        newRatio = minRatio;
        break;
      case 'End':
        e.preventDefault();
        newRatio = maxRatio;
        break;
      default:
        return;
    }
    
    if (onChangeRatio && newRatio !== ratio) {
      onChangeRatio(newRatio);
    }
  }, [ratio, minRatio, maxRatio, onChangeRatio]);

  // Set up global event listeners for smooth dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const dividerThemeClasses = theme === 'geek'
    ? 'bg-gray-700 border-green-400 hover:bg-green-400/20'
    : 'bg-gray-200 border-gray-400 hover:bg-blue-100';

  return (
    <div 
      ref={containerRef}
      className={`flex h-full w-full ${className}`}
    >
      {/* Left Panel */}
      <div 
        className="overflow-hidden flex-shrink-0"
        style={{ width: `${ratio * 100}%` }}
      >
        {left}
      </div>

      {/* Resizable Divider */}
      <div
        className={`
          w-2 cursor-col-resize flex-shrink-0 border-l border-r
          ${dividerThemeClasses}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
          transition-colors duration-150
          relative group
        `}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        aria-label={`Resize panels. Use arrow keys to adjust. Currently ${Math.round(ratio * 100)}% left.`}
      >
        {/* Visual indicator */}
        <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-current opacity-50 group-hover:opacity-100 transition-opacity" />
        
        {/* Touch target for mobile */}
        <div className="absolute inset-0 -mx-2" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-hidden min-w-0">
        {right}
      </div>
    </div>
  );
};

export default SplitPane;