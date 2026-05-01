import { useState, useRef, useEffect, useContext } from 'react';
import {TenantManagerListContext} from "./tenant-manager-list.jsx";

function DragToggle({ 
  value = false, 
  onChange,
  onLabel = 'On',
  offLabel = 'Off',
  OnIcon = ()=>{},
  OffIcon = ()=>{},
  onColor = 'green',
  offColor = 'red',
  disabled = false,
  site
}) {
  const {updateRows} = useContext(TenantManagerListContext);
  const [isOn, setIsOn] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sliderRef = useRef(null);
  const startPosRef = useRef(0);
  const [isDisabled, setIsDisabled] = useState(disabled);

  useEffect(() => {
    setIsOn(value);
  }, [value, onChange]);

  useEffect(() => {
    setIsDisabled(disabled || updateRows.includes(site))
  }, [disabled, onChange, updateRows, site])

  const colorClasses = {
    blue: "from-blue-600/60 to-blue-600/50",
    amber: "from-amber-600/70 to-amber-600/50",
    green: "from-green-600/70 to-green-600/50",
    red: "from-red-600/70 to-red-600/50",
    purple: "from-purple-600/70 to-purple-600/50",
    pink: "from-pink-600/70 to-pink-600/50",
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    startPosRef.current = e.clientX;
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startPosRef.current = e.touches[0].clientX;
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;

    const slider = sliderRef.current;
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const sliderWidth = rect.width;
    const halfWidth = sliderWidth / 2;

    const offset = clientX - startPosRef.current;
    
    const maxOffset = halfWidth;
    const minOffset = -halfWidth;
    const clampedOffset = Math.max(minOffset, Math.min(maxOffset, offset));
    
    setDragOffset(clampedOffset);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;

    const threshold = 30;
    
    if (dragOffset > threshold && !isOn) {
      const newValue = true;
      setIsOn(newValue);
      if (onChange) onChange(newValue);
    } else if (dragOffset < -threshold && isOn) {
      const newValue = false;
      setIsOn(newValue);
      if (onChange) onChange(newValue);
    }

    setIsDragging(false);
    setDragOffset(0);
    startPosRef.current = 0;
  };

  const handleMouseUp = handleEnd;
  const handleTouchEnd = handleEnd;

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={sliderRef}
      disabled={isDisabled}
      className={`relative inline-flex h-8 w-40 items-center rounded-full bg-gray-300/50 dark:bg-gray-800/50 dark:border-gray-700 cursor-grab active:cursor-grabbing select-none ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none disabled' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <span
        className={`absolute h-7 rounded-full shadow-lg transition-all ${
          isDragging ? 'duration-0' : 'duration-300 ease-in-out'
        } bg-gradient-to-r ${
          isOn
            ? colorClasses[onColor] || colorClasses.blue
            : colorClasses[offColor] || colorClasses.amber
        }`}
        style={{
          width: '49%',
          left: '0.1rem',
          transform: isDragging 
            ? `translateX(${isOn ? 'calc(100% + 0.05rem)' : '0'}) translateX(${dragOffset}px)`
            : isOn 
              ? 'translateX(calc(100% + 0.05rem))' 
              : 'translateX(0)',
        }}
      />
      
      <span className="relative z-10 flex-1 flex items-center justify-center gap-2 pointer-events-none">
        <OffIcon className={`w-4 h-4 transition-colors ${!isOn ? 'text-white' : 'text-gray-500'}`} />
        <span className={`text-xs font-medium transition-colors ${!isOn ? 'text-white' : 'text-gray-500'}`}>
          {offLabel}
        </span>
      </span>
      
      <span className="relative z-10 flex-1 flex items-center justify-center gap-2 pointer-events-none">
        <OnIcon className={`w-4 h-4 transition-colors ${isOn ? 'text-white' : 'text-gray-500'}`} />
        <span className={`text-xs font-medium transition-colors ${isOn ? 'text-white' : 'text-gray-500'}`}>
          {onLabel}
        </span>
      </span>

      {isDragging && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
          {Math.abs(dragOffset) > 30 ? `✓ ${isOn ? offLabel : onLabel}` : '← Drag →'}
        </div>
      )}
    </div>
  );
}

export default DragToggle;