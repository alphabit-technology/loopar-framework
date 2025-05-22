import { useEffect, useState , useMemo} from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export function ParticlesMaster({ options={}, ...props }) {
  const [ init, setInit ] = useState(false);

  const particlesOptions = useMemo(() => {
    return {
      ...options,
    };
  }
  , [options]);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
        await loadSlim(engine);
    }).then(() => {
        setInit(true);
    });
  }, [particlesOptions]);

  if(init) return (
    <Particles
      id={ props.id }
      //particlesLoaded={particlesLoaded}
      className="w-full h-full absolute inset-0 z-0"
      options={{
        fullScreen: { enable: props.fullScreen ?? false },
        ...options,
        detectRetina: true,
      }}
    />
  );
}
