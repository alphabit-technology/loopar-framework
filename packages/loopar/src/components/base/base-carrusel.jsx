import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import loopar from "loopar";
import { useDesigner } from "@context/@/designer-context";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { Droppable } from "@droppable";
import { Button } from "@cn/components/ui/button";
import {DEFAULTS} from "@@tools/meta-fields"

const CONTENT_EXIT_DURATION = 300;

const BaseCarrusel = (props) => {
  const { data = {}, elements, children, content } = props;
  const { designerMode } = useDesigner();
  
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = loopar.cookie.get(data.key);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [prevIndex, setPrevIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const isTransitioningRef = useRef(false);
  const isExitingRef = useRef(false);
  const currentIndexRef = useRef(() => {
    const saved = loopar.cookie.get(data.key);
    return saved ? parseInt(saved, 10) : 0;
  });
  
  if (typeof currentIndexRef.current === 'function') {
    currentIndexRef.current = currentIndexRef.current();
  }
  
  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);
  
  useEffect(() => {
    isExitingRef.current = isExiting;
  }, [isExiting]);
  
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  
  const intervalRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  const sliderRef = useRef([]);
  const containerRef = useRef(null);
  
  const touchRef = useRef({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isDragging: false,
    startTime: 0
  });

  const items = useMemo(() => children || elements || [], [children, elements]);
  const itemCount = items.length;

  const goToSlide = useCallback((index) => {
    if (index === currentIndexRef.current) return;
    
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    
    setIsTransitioning(false);
    isTransitioningRef.current = false;
    setIsExiting(true);
    isExitingRef.current = true;
    
    exitTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(true);
      isTransitioningRef.current = true;
      
      setPrevIndex(currentIndexRef.current);
      setCurrentIndex(index);
      currentIndexRef.current = index;
      loopar.cookie.set(data.key, index);
      
      setIsExiting(false);
      isExitingRef.current = false;
      
      const duration = parseInt(data.animation_duration, 10) || 500;
      
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }, duration);
    }, CONTENT_EXIT_DURATION);
    
  }, [data.key, data.animation_duration]);

  const nextSlide = useCallback(() => {
    if (itemCount === 0) return;
    const next = (currentIndexRef.current + 1) % itemCount;
    goToSlide(next);
  }, [itemCount, goToSlide]);

  const nextSlideRef = useRef(nextSlide);
  useEffect(() => {
    nextSlideRef.current = nextSlide;
  }, [nextSlide]);

  const prevSlide = useCallback(() => {
    if (itemCount === 0) return;
    const prev = (currentIndexRef.current - 1 + itemCount) % itemCount;
    goToSlide(prev);
  }, [itemCount, goToSlide]);

  const clearAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (designerMode || data.pause || itemCount <= 1) return;
    
    clearAutoPlay();
    const interval = (parseInt(data.interval, 10) || 5) * 1000;
    
    intervalRef.current = setInterval(() => {
      nextSlideRef.current();
    }, interval);
  }, [designerMode, data.pause, data.interval, itemCount, clearAutoPlay]);

  const resetAutoPlay = useCallback(() => {
    clearAutoPlay();
    startAutoPlay();
  }, [clearAutoPlay, startAutoPlay]);

  useEffect(() => {
    if (!data.keyboard || designerMode) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        resetAutoPlay();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        resetAutoPlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data.keyboard, designerMode, prevSlide, nextSlide, resetAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      clearAutoPlay();
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [startAutoPlay, clearAutoPlay]);

  useEffect(() => {
    if (isHovered && data.pause) {
      clearAutoPlay();
    } else if (!isHovered) {
      startAutoPlay();
    }
  }, [isHovered, data.pause, clearAutoPlay, startAutoPlay]);

  const SWIPE_THRESHOLD = 50;
  const SWIPE_VELOCITY_THRESHOLD = 0.3;

  const handleTouchStart = useCallback((e) => {
    if (!data.touch || designerMode || itemCount <= 1) return;
    
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      endX: touch.clientX,
      endY: touch.clientY,
      isDragging: true,
      startTime: Date.now()
    };
    
    clearAutoPlay();
  }, [data.touch, designerMode, itemCount, clearAutoPlay]);

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current.isDragging) return;
    
    const touch = e.touches[0];
    touchRef.current.endX = touch.clientX;
    touchRef.current.endY = touch.clientY;
    
    const deltaX = Math.abs(touch.clientX - touchRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchRef.current.startY);
    
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current.isDragging) return;
    
    const { startX, endX, startY, endY, startTime } = touchRef.current;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = Date.now() - startTime;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
        if (deltaX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      }
    }
    
    touchRef.current.isDragging = false;
    startAutoPlay();
  }, [prevSlide, nextSlide, startAutoPlay]);

  const handleMouseDown = useCallback((e) => {
    if (!data.touch || designerMode || itemCount <= 1) return;
    
    touchRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
      isDragging: true,
      startTime: Date.now()
    };
    
    clearAutoPlay();
  }, [data.touch, designerMode, itemCount, clearAutoPlay]);

  const handleMouseMove = useCallback((e) => {
    if (!touchRef.current.isDragging) return;
    
    touchRef.current.endX = e.clientX;
    touchRef.current.endY = e.clientY;
  }, []);

  const handleMouseUp = useCallback((e) => {
    if (!touchRef.current.isDragging) return;
    
    const { startX, endX, startTime } = touchRef.current;
    const deltaX = endX - startX;
    const deltaTime = Date.now() - startTime;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    
    touchRef.current.isDragging = false;
    startAutoPlay();
  }, [prevSlide, nextSlide, startAutoPlay]);

  const handleMouseLeave = useCallback(() => {
    if (touchRef.current.isDragging) {
      touchRef.current.isDragging = false;
      startAutoPlay();
    }
    setIsHovered(false);
  }, [startAutoPlay]);

  const renderSlides = useMemo(() => {
    if (!itemCount) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <p className="text-muted-foreground">No slides available</p>
        </div>
      );
    }

    const visibleItems = designerMode 
      ? [{ element: items[currentIndex], index: currentIndex }]
      : [
          { element: items[prevIndex], index: prevIndex, isPrev: true },
          { element: items[currentIndex], index: currentIndex }
        ].filter((item, idx, arr) => 
          idx === arr.findIndex(i => i.index === item.index)
        );

    return (
      <div className={`relative w-full h-full ${designerMode ? "pt-3" : ""}`}>
        {visibleItems.map(({ element, index, isPrev }) => {
          if (!element) return null;
          if (element.$$typeof === Symbol.for("react.transitional.element")) return element;

          const key = element.data?.key || `slide-${index}`;
          
          const isCurrentSlide = index === currentIndex;
          const isActive = isCurrentSlide && !isExiting;
          
          const slideData = {
            ...element.data,
            ...(!isPrev && !designerMode ? {
              animation: data.animation,
              animation_duration: data.animation_duration,
              animation_delay: data.animation_delay
            } : {}),
            isActive,
            static_content: data.static_content,
            background_color: element.data?.background_color || data.background_color,
            background_blend_mode: element.data?.background_blend_mode || data.background_blend_mode,
            key,
          };

          return (
            <Droppable
              className={`absolute inset-0 w-full h-full ${isPrev ? 'z-0' : 'z-10'}`}
              data={slideData}
              index={index}
              elements={[
                {
                  ...element,
                  element: element.element || "banner",
                  data: slideData,
                  haveCarrusel: true,
                  elements: element.elements,
                  ref: (tab) => {
                    if (tab) sliderRef.current[index] = tab;
                  },
                },
              ]}
              key={`${key}-${index}-${isPrev ? 'prev' : 'current'}`}
            />
          );
        })}
      </div>
    );
  }, [items, currentIndex, prevIndex, designerMode, data, itemCount, isExiting]);

  const renderArrow = (direction) => {
    if (data.arrows === false || itemCount <= 1) return null;
    
    const isLeft = direction === 'left';
    const Icon = isLeft ? ChevronLeftIcon : ChevronRightIcon;
    
    return (
      <button
        type="button"
        className={`
          absolute top-1/2 -translate-y-1/2 z-20
          ${isLeft ? 'left-2 md:left-4 lg:left-6' : 'right-2 md:right-4 lg:right-6'}
          hidden md:inline-flex items-center justify-center
          h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16 xl:h-20 xl:w-20
          rounded-full
          bg-background/20 backdrop-blur-sm
          hover:bg-background/40
          text-foreground/80 hover:text-foreground
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
          disabled:pointer-events-none disabled:opacity-50
          ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 md:opacity-60 scale-95'}
          hover:scale-110
        `}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          isLeft ? prevSlide() : nextSlide();
          resetAutoPlay();
        }}
        aria-label={isLeft ? 'Previous slide' : 'Next slide'}
      >
        <Icon className="w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10" />
      </button>
    );
  };

  const renderIndicators = () => {
    if (data.indicators === false || itemCount <= 1) return null;

    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {items.map((_, index) => (
          <button
            key={`indicator-${index}`}
            type="button"
            className={`
              w-2.5 h-2.5 rounded-full transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              ${index === currentIndex 
                ? 'bg-white scale-110' 
                : 'bg-white/50 hover:bg-white/75'}
            `}
            onClick={(e) => {
              e.preventDefault();
              goToSlide(index);
              resetAutoPlay();
            }}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : 'false'}
          />
        ))}
      </div>
    );
  };

  const renderDesignerControls = () => {
    if (!designerMode) return null;

    return (
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.addSlide();
            
            setTimeout(() => {
              goToSlide(elements.length);
            }, )
          }}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Slide
        </Button>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-background/80 backdrop-blur-sm text-sm font-medium shadow-lg">
          <span className="text-foreground">{currentIndex + 1}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{itemCount || 0}</span>
        </div>
      </div>
    );
  };
  
  const containerStyle = useMemo(() => {
    const style = {};
    if (data.full_height) {
      style.height = '100vh';
    } else {
      style.paddingTop = data.aspect_ratio || '56.25%';
    }
    return style;
  }, [data.full_height, data.aspect_ratio]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${data.touch && !designerMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={containerStyle}
    >
      <div
        className="absolute inset-0 w-full h-full select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {renderArrow('left')}
        {content || renderSlides}
        {renderArrow('right')}
        {renderIndicators()}
        {renderDesignerControls()}
      </div>
    </div>
  );
};

export default BaseCarrusel;

BaseCarrusel.droppable = true;
BaseCarrusel.metaFields = () => {
  return [
    {
      group: "animation",
      elements: {
        animation: {
          element: SELECT,
          data: {
            label: "Transition Effect",
            options: Object.keys(loopar.animations()),
            selected: "",
          },
        },
        animation_duration: {
          element: INPUT,
          data: {
            label: "Duration (ms)",
            format: "number",
            default_value: DEFAULTS.animation_duration,
          },
        },
        animation_delay: {
          element: INPUT,
          data: {
            label: "Delay (ms)",
            format: "number",
            default_value: DEFAULTS.animation_delay,
          },
        },
        interval: {
          element: SELECT,
          data: {
            label: "Auto-play Interval",
            options: [
              { label: "3 Seconds", value: "3" },
              { label: "5 Seconds", value: "5" },
              { label: "7 Seconds", value: "7" },
              { label: "10 Seconds", value: "10" },
              { label: "15 Seconds", value: "15" },
              { label: "20 Seconds", value: "20" },
              { label: "30 Seconds", value: "30" },
              { label: "50 Seconds", value: "50" },
              { label: "100 Seconds", value: "100" },
            ],
            selected: "5",
          },
        },
        static_content: {
          element: SWITCH,
          data: {
            description:
              "If enabled the content will remain static even when there are animations in the slide.",
          },
        },
        full_height: {
          element: SWITCH,
          data: {
            label: "Full Screen Height",
            description: "Slider will occupy the full viewport height",
          },
        },
        aspect_ratio: {
          element: SELECT,
          data: {
            label: "Aspect Ratio",
            description: "Only applies when Full Screen Height is disabled",
            options: [
              { option: "16:9 (Widescreen)", value: "56.25%" },
              { option: "4:3 (Standard)", value: "75%" },
              { option: "21:9 (Ultrawide)", value: "42.85%" },
              { option: "1:1 (Square)", value: "100%" },
              { option: "60% (Default)", value: "60%" },
            ],
            selected: "56.25%",
          },
        },
        loop: { 
          element: SWITCH,
          data: {
            label: "Loop Slides",
            description: "Continue to first slide after last",
          },
        },
        pause: { 
          element: SWITCH,
          data: {
            label: "Pause on Hover",
            description: "Stop auto-play when mouse is over the slider",
          },
        },
        keyboard: { 
          element: SWITCH,
          data: {
            label: "Keyboard Navigation",
            description: "Use arrow keys to navigate slides",
          },
        },
        touch: { 
          element: SWITCH,
          data: {
            label: "Touch/Swipe",
            description: "Enable swipe gestures on touch devices",
          },
        },
        indicators: { 
          element: SWITCH,
          data: {
            label: "Show Indicators",
            description: "Display navigation dots at bottom",
            selected: true,
          },
        },
        arrows: { 
          element: SWITCH,
          data: {
            label: "Show Arrows",
            description: "Display navigation arrows on sides",
            selected: true,
          },
        },
      },
    },
  ];
};