import { useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// @tsparticles/react v4: the engine is initialised once per app through
// <ParticlesProvider init>, whose `init` callback MUST be a stable reference
// (the provider throws if it changes between renders). Children render only
// after the engine is loaded, so <Particles> never mounts before that.
const initEngine = async (engine) => {
  await loadSlim(engine);
};

export function ParticlesMaster({ options = {}, ...props }) {
  const particlesOptions = useMemo(() => ({
    fullScreen: { enable: props.fullScreen ?? false },
    ...options,
    detectRetina: true,
  }), [options, props.fullScreen]);

  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id={props.id}
        className="w-full h-full absolute inset-0 z-0"
        options={particlesOptions}
      />
    </ParticlesProvider>
  );
}
