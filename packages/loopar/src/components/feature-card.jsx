import {cn} from "@cn/lib/utils";

export default function FeatureCard(props) {
  const data = props.data;
  const {
    label, 
    text, 
    align = "start",
    image_height = "h-64",
    overlay_intensity = "medium",
    hover_effect = true,
    content_position = "outside"
  } = data;
  
  const { backgroundImage, ...restStyle } = props.style || {};
  
  const overlayMap = {
    none: "bg-black/0",
    light: "bg-black/10 dark:bg-black/20",
    medium: "bg-black/20 dark:bg-black/40",
    strong: "bg-black/40 dark:bg-black/60"
  };
  
  const alignMap = {
    start: "text-left items-start",
    center: "text-center items-center",
    end: "text-right items-end"
  };

  const className = cn(
    "group relative overflow-hidden rounded-xl bg-card border",
    "hover:border-primary/50 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30",
    "transition-all duration-300 h-full",
    props.className
  );

  const Content = () => (
    <div className={cn("flex flex-col gap-2", alignMap[align])}>
      <h3 className="text-lg font-semibold text-foreground">{label}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
    </div>
  );

  return (
    <div 
      {...props}
      style={restStyle}
      className={className}
    >
      <div 
        className={cn(
          "relative overflow-hidden bg-cover bg-center",
          image_height,
          hover_effect && "transition-transform duration-500 group-hover:scale-105"
        )}
        style={{ backgroundImage }}
      >
        <div className={cn("absolute inset-0", overlayMap[overlay_intensity])} />
        
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent",
          content_position === "outside" ? "from-card" : "from-black/80"
        )} />
        
        {content_position === "overlay" && (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <Content />
          </div>
        )}
      </div>
      
      {content_position === "outside" && (
        <div className="p-6 bg-card">
          <Content />
        </div>
      )}
    </div>
  );
}

FeatureCard.metaFields = () => {
  return [{
    group: "custom",
    elements: {
      align: {
        element: SELECT,
        data: {
          label: "Text Align",
          options: [
            { value: "start", label: "Start" },
            { value: "center", label: "Center" },
            { value: "end", label: "End" }
          ]
        }
      },
      image_height: {
        element: SELECT,
        data: {
          label: "Image Height",
          options: [
            { value: "h-32", label: "Small" },
            { value: "h-48", label: "Medium" },
            { value: "h-64", label: "Large" },
            { value: "h-80", label: "XLarge" },
            { value: "h-96", label: "Full" }
          ]
        }
      },
      overlay_intensity: {
        element: SELECT,
        data: {
          label: "Overlay Intensity",
          options: [
            { value: "none", label: "None" },
            { value: "light", label: "Light" },
            { value: "medium", label: "Medium" },
            { value: "strong", label: "Strong" }
          ]
        }
      },
      content_position: {
        element: SELECT,
        data: {
          label: "Content Position",
          options: [
            { value: "outside", label: "Outside (Footer)" },
            { value: "overlay", label: "Overlay (On Image)" }
          ]
        }
      },
      hover_effect: {
        element: SWITCH,
        data: {
          label: "Hover Zoom Effect"
        }
      }
    }
  }];
};