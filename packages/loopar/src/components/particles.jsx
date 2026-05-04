import { Droppable } from "@droppable";
import {useMemo} from "react";
import {ParticlesMaster} from "./particles/particles.jsx";
import { structure, singleStructure } from "./particles/particles-structure.js";
import {utils} from "@global";

const getConfigAtPath = (structure, path) => {
  const keys = path.split(".");
  let current = structure;
  for (const key of keys) {
    if (current && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  return current;
};

const updateNestedValuePlain = (obj, path, newValue, configStructure) => {
  const keys = path.split(".");
  const updated = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = updated;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    } else {
      current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  const configAtPath = getConfigAtPath(configStructure, path);
  
  if (configAtPath && Array.isArray(configAtPath.value)) {
    current[lastKey] = Array.isArray(newValue) ? [...newValue] : [0, newValue];
  }else {
    current[lastKey] = newValue;
  }
  
  return updated;
};

const applyDataToPlainStructure = (plainStructure, data, configStructure) => {
  let updatedStructure = plainStructure;
  Object.keys(data).forEach((path) => {
    updatedStructure = updateNestedValuePlain(updatedStructure, path, data[path], configStructure);
  });
  return updatedStructure;
};

export default function MetaParticles(props) {
  const data = props.data || {};
  const particlesData = useMemo(() => utils.JSONparse(data.particles_settings, {}), [data.particles_settings]);
  const options = useMemo(() => applyDataToPlainStructure(singleStructure, particlesData, structure), [particlesData]);

  return (
    <Droppable
      {...props}
    >
      <div className="absolute inset-0 z-0">
        <ParticlesMaster options={options} id={data.key} fullScreen={props.fullScreen}/>
        {props.children}
      </div>
    </Droppable>
  )
}

MetaParticles.metaFields =()=>{
  return [{
    group: "particles",
    elements: {
      particles_settings: {
        element: PARTICLES_SETTINGS,
      },
    }
  }]
}