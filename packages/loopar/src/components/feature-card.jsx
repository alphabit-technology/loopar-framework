import {cn} from "@cn/lib/utils";
import Icon from "@icon"; 

export default function FeatureCard(props) {
  const data = props.data;
  const {
    label, 
    text, 
    align = "start",
    image_height = "h-64",
    overlay_intensity = "medium",
    hover_effect = true,
    content_position = "outside",
    icon,
    icon_size = "96",
    icon_opacity = "20"
  } = data;

  const { backgroundImage, ...restStyle } = props.style || {};
  const hasIcon = icon && !backgroundImage;
  const hasImage = backgroundImage;
  
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

  const iconOpacityMap = {
    "10": "text-primary/10",
    "20": "text-primary/20",
    "30": "text-primary/30",
    "40": "text-primary/40",
    "50": "text-primary/50"
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

  const IconBackground = () => (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center",
      "bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
    )}>
      <Icon
        data={{icon:icon}}
        name={icon} 
        size={parseInt(icon_size)}
        className={cn(
          iconOpacityMap[icon_opacity],
          "transition-all duration-500",
          hover_effect && "group-hover:scale-110 group-hover:text-primary/30 text-8xl"
        )}
        strokeWidth={1}
      />
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
          "relative overflow-hidden",
          image_height,
          hasImage && "bg-cover bg-center m-4",
          hasIcon && "bg-muted/30",
          hover_effect && hasImage && "transition-transform duration-500 group-hover:scale-105"
        )}
        style={hasImage ? props.style : undefined}
      >
        {/* Icon Background */}
        {hasIcon && <IconBackground />}
        
        {/* Image Overlay */}
        {hasImage && (
          <div className={cn("absolute inset-0", overlayMap[overlay_intensity])} />
        )}
        
        {/* Gradient fade to content */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent",
          content_position === "outside" ? "from-card" : "from-black/80"
        )} />
        
        {/* Overlay content */}
        {content_position === "overlay" && (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <Content />
          </div>
        )}
      </div>
      
      {/* Outside content */}
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
      icon: {
        element: ICON_INPUT, // O TEXT si no tienes selector de iconos
        data: {
          label: "Icon",
          description: "Lucide icon name (e.g., Network, Database, Zap)"
        }
      },
      icon_size: {
        element: SELECT,
        data: {
          label: "Icon Size",
          options: [
            { value: "64", label: "Small" },
            { value: "80", label: "Medium" },
            { value: "96", label: "Large" },
            { value: "128", label: "XLarge" }
          ]
        }
      },
      icon_opacity: {
        element: SELECT,
        data: {
          label: "Icon Opacity",
          options: [
            { value: "10", label: "Very Subtle" },
            { value: "20", label: "Subtle" },
            { value: "30", label: "Medium" },
            { value: "40", label: "Visible" },
            { value: "50", label: "Strong" }
          ]
        }
      },
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