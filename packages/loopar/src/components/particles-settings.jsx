import React, {useState} from "react";
import BaseInput from "@base-input";
import { utils } from "@global";
import { structure } from "./particles/particles-structure.js";
import {titleize} from "inflection";

const InputField = ({ path, label, config, value, onChange }) => {
  const handleChange = (e) => {
    let newValue;
    if (config.type === "checkbox") {
      newValue = e.target.checked;
    } else if (config.type === "slide") {
      newValue = Number(e.target.value);
    } else {
      newValue = e.target.value;
    }
    onChange(path, newValue);
  };

  label = titleize(label);
  const labelClass = "text-sm font-semibold text-primary/80 gap-1";

  value ??= config.value;
  switch (config.type) {
    case "input":
      return (
        <label className={`flex flex-col ${labelClass}`}>{label}:
          <input className="w-full" type={config.format || config.type} value={value || ""} onChange={handleChange} />
        </label>
      );
    case "checkbox":
      return (
        <label className={`flex flex-row ${labelClass}`}>
          {label}:{" "}
          <input type="checkbox" checked={value || false} onChange={handleChange} />
        </label>
      );
    case "slide":
      return (
        <label className={`flex flex-col ${labelClass}`}>
          <span className="flex flex-row">{label}: {value}</span>
          <input
            className="w-full"
            type="range"
            min={config.range[0]}
            max={config.range[1]}
            step={config.range[1]/(config.steps || 100)}
            value={value}
            onChange={handleChange}
          />
        </label>
      );
    case "select":
      return (
        <label className={`flex flex-col ${labelClass}`}>
          {label}:{" "}
          <select value={value} onChange={handleChange}>
            {config.options.map((option) => (
              <option key={option} value={option} className="bg-card">
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    default:
      return null;
  }
};

const RecursiveForm = ({ structure, data = {}, parentPath = "", onChange }) => {
  const [visibleSections, setVisibleSections] = useState({});

  const handleSetVisibility = (e, sectionKey) => {
    e.preventDefault();
    e.stopPropagation();
    setVisibleSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  return (
    <div 
      className="border border-border py-2 px-4"
      style={{ marginLeft: parentPath ? "5px" : "0px", paddingLeft: "5px" }}
    >
      {Object.entries(structure).map(([key, value]) => {
        const currentPath = parentPath ? `${parentPath}.${key}` : key;

        if (value && typeof value === "object" && "type" in value && typeof value.type === "string") {
          return (
            <InputField 
              key={currentPath} 
              label={key} 
              path={currentPath} 
              config={value} 
              value={(data || {})[currentPath]} 
              onChange={onChange} 
            />
          );
        } else if (value && typeof value === "object") {
          const isVisible = visibleSections[currentPath] || false;
          
          return (
            <fieldset key={currentPath + "fieldset"} style={{ margin: "0", padding: "0" }}>
              <legend className="pt-1 font-bold" onClick={(e) => handleSetVisibility(e, currentPath)}>
                <span className={isVisible ? 'text-primary/90' : 'text-primary/50'}>
                  {isVisible ? "▼ " : "▶ "}
                </span>
                <span className="text-primary/80">{titleize(key)}</span>
              </legend>
              {isVisible && (
                <RecursiveForm 
                  structure={value} 
                  key={currentPath + "form"} 
                  data={data} 
                  parentPath={currentPath} 
                  onChange={onChange} 
                />
              )}
            </fieldset>
          );
        } else {
          return null;
        }
      })}
    </div>
  );
};


const ParticlesDynamicForm = ({...props }) => {
  return (
    <BaseInput
      {...props}
      render={(field) => {
        const handleFieldChange = (path, newValue) => {
          const data = utils.JSONparse(field.value, {});
          data[path] = newValue;
          field.onChange({target: {value: JSON.stringify(data)}});
        };

        return (
          <div>
            <RecursiveForm structure={structure} data={utils.JSONparse(field.value, {})} onChange={handleFieldChange} />
          </div>
        )
      }}
    />
  );
};

export default ParticlesDynamicForm;
