import React, { useState, useRef, useEffect, useCallback } from 'react';

const ResizableContainer = ({ 
  children, 
  height, 
  onHeightChange, 
  minHeight = 300, 
  maxHeight = 1000,
  theme = 'normal',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(height);
  const containerRef = useRef(null);

  // Handle mouse/pointer events for resizing
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(height);
    
    // Capture pointer for smooth dragging
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  }, [height]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;

    e.preventDefault();
    const deltaY = e.clientY - dragStartY;
    let newHeight = dragStartHeight + deltaY;
    
    // Clamp height to min/max bounds
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    if (onHeightChange) {
      onHeightChange(newHeight);
    }
  }, [isDragging, dragStartY, dragStartHeight, minHeight, maxHeight, onHeightChange]);

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
    const step = 20; // 20px steps
    let newHeight = height;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newHeight = Math.max(minHeight, height - step);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newHeight = Math.min(maxHeight, height + step);
        break;
      case 'Home':
        e.preventDefault();
        newHeight = minHeight;
        break;
      case 'End':
        e.preventDefault();
        newHeight = maxHeight;
        break;
      default:
        return;
    }
    
    if (onHeightChange && newHeight !== height) {
      onHeightChange(newHeight);
    }
  }, [height, minHeight, maxHeight, onHeightChange]);

  // Set up global event listeners for smooth dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleThemeClasses = theme === 'geek'
    ? 'bg-green-700/50 border-green-400 hover:bg-green-400/30'
    : 'bg-gray-300 border-gray-400 hover:bg-blue-200';

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Main Content */}
      <div className="h-full pb-10">
        {children}
      </div>

      {/* Draggable Resize Handle */}
      <div
        className={`
          absolute bottom-1 left-1/2 transform -translate-x-1/2
          w-16 h-3 cursor-ns-resize flex-shrink-0 border border-t-2
          ${handleThemeClasses}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors duration-150
          rounded-full group z-20
        `}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-orientation="vertical"
        aria-valuenow={height}
        aria-valuemin={minHeight}
        aria-valuemax={maxHeight}
        aria-label={`Adjust typing area height. Currently ${height}px. Use arrow keys or drag to resize.`}
      >
        {/* Visual grip indicator */}
        <div className="flex items-center justify-center w-full h-full">
          <div className={`flex gap-1 ${
            theme === 'geek' ? 'text-green-400' : 'text-gray-500'
          }`}>
            <div className="w-0.5 h-1 bg-current rounded-full" />
            <div className="w-0.5 h-1 bg-current rounded-full" />
            <div className="w-0.5 h-1 bg-current rounded-full" />
          </div>
        </div>

        {/* Height indicator tooltip */}
        {isDragging && (
          <div className={`
            absolute -top-12 left-1/2 transform -translate-x-1/2
            px-3 py-1.5 text-xs font-mono rounded-md
            ${theme === 'geek'
              ? 'bg-green-900/95 text-green-400 border border-green-400/50 shadow-lg shadow-green-400/20'
              : 'bg-gray-900/95 text-white border border-gray-600 shadow-lg'
            }
            pointer-events-none z-50
          `}>
            {height}px
          </div>
        )}
      </div>
    </div>
  );
};

export default ResizableContainer;