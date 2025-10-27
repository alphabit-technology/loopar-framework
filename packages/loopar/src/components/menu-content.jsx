import MetaComponent from "@meta-component";
import { useDesigner } from "@context/@/designer-context";
import { useEffect, useRef, forwardRef, useState } from "react";
import { Link } from "@link"
import { Droppable } from "./droppable/droppable";

const Section = forwardRef(({ element }, ref) => {
  return (
    <section
      ref={ref}
      data-section="true"
      id={element.data.label || element.data.id || element.data.key}
    >
      <div>
        <MetaComponent
          key={element.data.key}
          elements={[element]}
        />
      </div>
    </section>
  );
});

const SubMenus = ({ sectionRef, isVisible, activeSubSection }) => {
  const [subMenus, setSubMenus] = useState([]);

  useEffect(() => {
    if (!sectionRef) return;

    const extractHeadings = () => {
      const headings = sectionRef.querySelectorAll('h2, h3, h4');
      
      if (headings.length > 0) {
        const menus = Array.from(headings).map(heading => ({
          id: heading.id || heading.textContent.toLowerCase().replace(/\s+/g, '-'),
          text: heading.textContent,
          level: heading.tagName.toLowerCase()
        }));

        setSubMenus(menus);
      }
    };

    extractHeadings();

    const observer = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
      if (hasAddedNodes) {
        extractHeadings();
      }
    });

    observer.observe(sectionRef, { 
      childList: true, 
      subtree: true 
    });

    return () => observer.disconnect();
  }, [sectionRef]);

  if (subMenus.length === 0) return null;

  return (
    <div 
      className={`flex flex-col gap-1 overflow-hidden transition-all duration-400 ease-in-out ${
        isVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      {subMenus.map((menu, index) => (
        <Link
          key={menu.id}
          to={`#${menu.id}`}
          active={activeSubSection === menu.id}
          className={`text-sm transition-all duration-300 ease-in-out p-0 m-0 ${
            menu.level === 'h3' ? 'pl-2' : ''
          } ${
            menu.level === 'h4' ? 'pl-4' : ''
          } ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[-10px] opacity-0'
          }`}
          style={{ transitionDelay: isVisible ? `${index * 50}ms` : '0ms' }}
          title={menu.text}
        >
          <span className="truncate p-0 m-0">{menu.text}</span>
        </Link>
      ))}
    </div>
  );
};

const MenuItem = ({ element, sectionRef, visible = false, index, activeSection, activeSubSection }) => {
  const [isVisible, setIsVisible] = useState(visible);
  const sectionId = element.data.label || element.data.id || element.data.key;
  const isSectionActive = activeSection === sectionId;

  useEffect(() => {
    const delay = index === 0 ? 1 : 1 + (index * 5);
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div 
      className={`flex flex-col gap-1 overflow-hidden transition-all duration-400 ease-in-out ${
        isVisible 
          ? 'max-h-[1000px] opacity-100 translate-y-0' 
          : 'max-h-0 opacity-0 translate-y-[-10px]'
      }`}
    >
      <Link
        to={`#${sectionId}`}
        active={isSectionActive}
        className="font-medium"
      >
        {element.data.label}
      </Link>
      <div className="pl-4">
        <SubMenus 
          sectionRef={sectionRef} 
          isVisible={isVisible} 
          activeSubSection={isSectionActive ? activeSubSection : null}
        />
      </div>
    </div>
  );
};

const useActiveSection = () => {
  const [active, setActive] = useState({ section: null, subSection: null });
  const rafRef = useRef(null);
  const lastScrollRef = useRef(0);
  const cachedPositionsRef = useRef(null);

  useEffect(() => {
    const getHeaderHeight = () => {
      const header = document.querySelector('header');
      return header ? parseFloat(getComputedStyle(header).height) : 0;
    };

    const getAbsoluteTop = (element) => {
      return element.getBoundingClientRect().top + window.scrollY;
    };

    const cachePositions = () => {
      const sections = document.querySelectorAll('[data-section="true"]');
      const positions = [];

      sections.forEach((section) => {
        const sectionTop = getAbsoluteTop(section);
        const sectionHeight = section.offsetHeight;
        const headings = section.querySelectorAll('h2[id], h3[id], h4[id]');
        
        const headingPositions = Array.from(headings).map(heading => ({
          id: heading.id,
          top: getAbsoluteTop(heading)
        }));

        positions.push({
          id: section.id,
          top: sectionTop,
          bottom: sectionTop + sectionHeight,
          headings: headingPositions
        });
      });

      return positions;
    };

    const detectActiveSection = (forceRun = false) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const currentScroll = window.scrollY;
        
        if (!forceRun && Math.abs(currentScroll - lastScrollRef.current) < 10) {
          return;
        }
        lastScrollRef.current = currentScroll;

        if (!cachedPositionsRef.current) {
          cachedPositionsRef.current = cachePositions();
        }

        const scroll = currentScroll + getHeaderHeight() + 100;
        let activeSection = null;
        let activeSubSection = null;

        for (const section of cachedPositionsRef.current) {
          if (scroll >= section.top && scroll < section.bottom) {
            activeSection = section.id;
            
            for (let i = section.headings.length - 1; i >= 0; i--) {
              if (scroll >= section.headings[i].top) {
                activeSubSection = section.headings[i].id;
                break;
              }
            }
            
            break;
          }
        }

        setActive(prev => {
          if (prev.section !== activeSection || prev.subSection !== activeSubSection) {
            return { section: activeSection, subSection: activeSubSection };
          }
          return prev;
        });
      });
    };

    const handleResize = () => {
      cachedPositionsRef.current = null;
      detectActiveSection(true);
    };

    const handleMutation = () => {
      cachedPositionsRef.current = null;
    };

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    detectActiveSection(true);
    
    const scrollHandler = () => detectActiveSection(false);
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return active;
};

export default function MenuContentMeta(props) {
  const isDesigner = useDesigner().designerMode;
  const [elements, setElements] = useState(props.elements || []);
  const sectionsRefs = useRef([]);
  const { section: activeSection, subSection: activeSubSection } = useActiveSection();

  useEffect(() => {
    isDesigner && setElements(props.elements || []);
  }, [props.elements, isDesigner]);

  useEffect(() => {
    sectionsRefs.current = sectionsRefs.current.slice(0, elements.length);
  }, [elements]);

  return (
    <div className={`relative w-full flex flex-row ${!isDesigner && ""} h-full`}>
      <div className={`w-full h-full py-2 px-5 ${!isDesigner ? 'xl:pr-[250px]' : 'w-0'}`}>
        {isDesigner ? <Droppable {...props}/> : 
          <>
            {elements.map((element, index) => (
              <Section 
                element={element} 
                key={element.data.key}
                ref={(el) => sectionsRefs.current[index] = el}
              />
            ))}
          </>
        }
      </div>
      <div
        className={`${isDesigner ? 'sticky w-[250px]' : 'fixed w-0 xl:w-[250px]'} right-0 z-1 top-web-HeaderHeight h-full overflow-y-auto overflow-x-hidden transition-all duration-600 ease-in-out`}
      >
        {!isDesigner && <h6 className="px-2 pt-2">ON THIS PAGE</h6>}
        <div className="flex flex-col gap-2 p-2 w-full">
          {elements.map((element, index) => (
            <MenuItem
              key={element.data.key + "-menu"}
              element={element}
              sectionRef={sectionsRefs.current[index]}
              index={index}
              visible={index === 0}
              activeSection={activeSection}
              activeSubSection={activeSubSection}
            />
          ))}
        </div>
      </div>
    </div>
  );
}