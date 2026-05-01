import { Button } from "@cn/components/ui/button";
import { CheckCircle, Palette, Droplet } from "lucide-react";
import { themes } from "@global/themes";
import { titleize } from "inflection";
import BaseInput from "@base-input";
import { useState, useEffect, useMemo } from "react";
import { previewDarkBackground, generateThemeCSS, isNeutralTheme } from "@global/theme-generator";
import {loopar} from "loopar";

function getColorMetrics(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = "0x" + hex[1] + hex[1];
    g = "0x" + hex[2] + hex[2];
    b = "0x" + hex[3] + hex[3];
  } else if (hex.length === 7) {
    r = "0x" + hex[1] + hex[2];
    g = "0x" + hex[3] + hex[4];
    b = "0x" + hex[5] + hex[6];
  }
  r /= 255; g /= 255; b /= 255;

  let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);

  return { h, s };
}

const ColorPreviewDisplay = ({ previewColor, mode, text }) => (
  <div className="space-y-2">
    <span className="text-xs text-muted-foreground">{text}</span>
    <div 
      className="w-full h-16 rounded-md flex items-center justify-center border border-border transition-colors duration-300"
      style={{ backgroundColor: previewColor }}
    >
      <span className="text-white text-xs font-medium px-3 py-1 bg-black/30 rounded">
        {previewColor}
      </span>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">
      {mode === 'auto' 
        ? '💡 Auto mode derives the background from your theme color.'
        : '🎨 Custom mode uses your base color. Intensity controls darkness in both modes.'
      }
    </p>
  </div>
);

const ThemeColorSelector = ({ color, twcolor, text, onSelect, active }) => {  
  const handleClick = (e) => {
    e.preventDefault();
    onSelect(color);
  }
  
  return (
    <Button
      variant="ghost"
      className={`w-full inline-flex items-center justify-start gap-2 ${
        active === color ? 'bg-primary/50 text-white' : 'text-primary'
      }`}
      onClick={handleClick}
      key={color}
    >
      <span className={`${twcolor} w-5 h-5 rounded-full flex items-center justify-center`}>
        {active === color && <CheckCircle className="w-4 h-4 text-white" />}
      </span>
      {text}
    </Button>
  );
}

const DarkBackgroundConfig = ({ theme, value, onChange }) => {
  const [mode, setMode] = useState(value?.darkMode || 'auto');
  const [intensity, setIntensity] = useState(value?.darkIntensity || 0.15);
  const [customColor, setCustomColor] = useState(value?.darkCustomColor || '#0a0a0a');

  const autoColor = previewDarkBackground(theme, intensity, 'auto', '#0a0a0a');
  const inputColor = mode === 'auto' ? autoColor : customColor;
  const previewColor = previewDarkBackground(theme, intensity, mode, customColor);

  useEffect(() => {
    onChange({
      darkMode: mode,
      darkIntensity: intensity,
      darkCustomColor: customColor
    });
  }, [mode, intensity, customColor]);

  const handleModeChange = (newMode) => {
    if (newMode === 'custom') {
      setCustomColor(autoColor);
    }
    setMode(newMode);
  };

  return (
    <div className="space-y-4 mt-4 p-4 border border-border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Droplet className="w-4 h-4" />
        <span>Dark Background Configuration</span>
      </div>

      <div className="flex justify-start">
        <div className="flex gap-2 w-full max-w-xs">
          <Button
            variant={mode === 'auto' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('auto')}
            className="flex-1"
          >
            Auto
          </Button>
          <Button
            variant={mode === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('custom')}
            className="flex-1"
          >
            Custom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              {mode === 'auto' ? 'Auto Color (read-only)' : 'Custom Base Color'}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={inputColor}
                onChange={(e) => setCustomColor(e.target.value)}
                disabled={mode === 'auto'}
                className={`w-10 h-10 rounded cursor-pointer border border-border ${
                  mode === 'auto' ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                title="Color Picker"
              />
              <input
                type="text"
                value={inputColor}
                onChange={(e) => setCustomColor(e.target.value)}
                disabled={mode === 'auto'}
                className={`flex-1 px-3 py-2 bg-background border border-border rounded text-sm font-mono ${
                  mode === 'auto' ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                placeholder="#0a0a0a"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Intensity</span>
              <span className="font-medium">{Math.round(intensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lighter</span>
              <span>Darker</span>
            </div>
          </div>
        </div>

        <ColorPreviewDisplay 
          previewColor={previewColor} 
          mode={mode} 
          text="Preview:"
        />
      </div>
    </div>
  );
}

export function ThemeSelector({ value, onChange }) {
  const [selectedTheme, setSelectedTheme] = useState(value?.theme || 'slate');
  const [darkConfig, setDarkConfig] = useState({
    darkMode: value?.darkMode || 'auto',
    darkIntensity: value?.darkIntensity || 0.95,
    darkCustomColor: value?.darkCustomColor || '#0a0a0a'
  });
  const [includeTitles, setIncludeTitles] = useState(value?.includeTitles !== false);

  useEffect(() => {
    onChange({
      theme: selectedTheme,
      ...darkConfig,
      includeTitles
    });
  }, [selectedTheme, darkConfig, includeTitles]);

  const handleThemeSelect = (themeName) => {
    setSelectedTheme(themeName);
  };

  const handleDarkConfigChange = (config) => {
    setDarkConfig(config);
  };

  const sortedThemeGroups = useMemo(() => {
    const neutrals = [];
    const chromatics = [];

    themes.forEach(theme => {
      const { h, s } = getColorMetrics(theme.color);
      
      if (isNeutralTheme(theme.name, theme.color)) {
        neutrals.push({ ...theme, hue: h, saturation: s });
      } else {
        chromatics.push({ ...theme, hue: h, saturation: s });
      }
    });

    chromatics.forEach(theme => {
      theme.sortHue = theme.hue > 300 ? theme.hue : theme.hue + 360;
    });
    
    chromatics.sort((a, b) => a.sortHue - b.sortHue);
    
    const neutralOrder = ['stone', 'neutral', 'zinc', 'gray', 'slate'];
    neutrals.sort((a, b) => neutralOrder.indexOf(a.name) - neutralOrder.indexOf(b.name));

    return [
      { id: 'colors', label: 'Colors', items: chromatics },
      { id: 'neutrals', label: 'Neutrals', items: neutrals }
    ];
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Palette className="w-4 h-4" />
          <span>Theme Color Palette</span>
        </div>
        
        <div className="space-y-4 border border-border rounded-md p-4">
          {sortedThemeGroups.map((group) => (
            group.items.length > 0 && (
              <div key={group.id} className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground opacity-70">
                  {group.label}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {group.items.map(theme => (
                    <ThemeColorSelector
                      key={theme.name}
                      color={theme.name}
                      twcolor={theme.twcolor}
                      text={titleize(theme.name)}
                      onSelect={handleThemeSelect}
                      active={selectedTheme}
                    />
                  ))}
                </div>
                {group.id === 'colors' && sortedThemeGroups[1].items.length > 0 && (
                   <div className="h-2" />
                )}
              </div>
            )
          ))}
        </div>
      </div>

      <DarkBackgroundConfig
        theme={selectedTheme}
        value={darkConfig}
        onChange={handleDarkConfigChange}
      />

      <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-muted/30">
        <input
          type="checkbox"
          id="includeTitles"
          checked={includeTitles}
          onChange={(e) => setIncludeTitles(e.target.checked)}
          className="w-4 h-4 rounded border-border"
        />
        <label htmlFor="includeTitles" className="text-sm cursor-pointer">
          Include title gradients (h1-h6)
        </label>
      </div>
    </div>
  );
}

export default function ThemeCustomizer(props) {
  const { renderInput } = BaseInput(props);

  function applyThemeCSS(themeConfig) {
    const css = generateThemeCSS(themeConfig.theme, {
      darkMode: themeConfig.darkMode,
      darkIntensity: themeConfig.darkIntensity,
      darkCustomColor: themeConfig.darkCustomColor,
      includeTitles: themeConfig.includeTitles,
      minify: true
    });
    
    let styleElement = document.getElementById('loopar-theme-styles');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'loopar-theme-styles';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
    
    return css;
  }
  
  return renderInput(field => {
    const handleChange = (themeConfig) => {
      applyThemeCSS(themeConfig);
      field.onChange({
        target: {
          value: JSON.stringify(themeConfig)
        }
      });
    };

    const currentValue = loopar.utils.JSONparse(field.value, {});

    return (
      <div className="w-full">
        <ThemeSelector 
          value={currentValue}
          onChange={handleChange}
        />
      </div>
    );
  });
}