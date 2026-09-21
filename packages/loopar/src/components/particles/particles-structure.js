export const structure = {
  autoPlay: { type: "checkbox", value: true },
  particles: {
    number: {
      value: { type: "input", value: 20 }
    },
    bounce: {
      horizontal: { type: "checkbox", value: false },
      vertical: { type: "checkbox", value: false }
    },
    density: {
      enable: { type: "checkbox", value: true },
      width: { type: "slide", value: 1920, range: [0, 4000] },
      height: { type: "slide", value: 1080, range: [0, 4000] }
    },
    paint: {
      color: {
        value: { type: "input", format: "color", value: "#ffffff" }
      },
      fill: {
        enable: { type: "checkbox", value: true },
        opacity: { type: "slide", value: 1, range: [0, 1] }
      },
      stroke: {
        width: { type: "slide", value: 0, range: [0, 20] },
        opacity: { type: "slide", value: 1, range: [0, 1] },
        color: {
          value: { type: "input", format: "color", value: "#ffffff" }
        }
      }
    },
    shape: {
      type: { type: "select", value: "circle", options: ["circle", "square", "triangle", "polygon", "star", "image"] },
      close: { type: "checkbox", value: true },
    },
    opacity: {
      value: {
        min: { type: "slide", value: 0.1, range: [0, 1] },
        max: { type: "slide", value: 1, range: [0, 1] }
      }
    },
    size: {
      value: {
        min: { type: "slide", value: 1, range: [0, 1000] },
        max: { type: "slide", value: 5, range: [0, 1000] }
      }
    },
    links: {
      enable: { type: "checkbox", value: true },
      blink: { type: "checkbox", value: false },
      color: { type: "input", format: "color", value: "#ffffff" },
      distance: { type: "number", value: 100},
      opacity: { type: "slide", value: 0.4, range: [0, 1] },
      width: { type: "slide", value: 1, range: [0, 10] },
      triangles: { 
        enable: { type: "checkbox", value: false },
        frequency: { type: "slide", value: 1, range: [0, 10] }
      }
    },
    attract: {
      enable: { type: "checkbox", value: false },
      distance: { type: "slide", value: 200, range: [0, 1000] },
      rotate: {
        x: { type: "slide", value: 600, range: [0, 3000] },
        y: { type: "slide", value: 1200, range: [0, 3000] }
      }
    },
    move: {
      enable: { type: "checkbox", value: true },
      random: { type: "checkbox", value: false },
      angle: { type: "slide", value: 90, range: [0, 360] },
      direction: { type: "select", value: "none", options: ["none", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left"] },
      gravity: {
        enable: { type: "checkbox", value: false },
        acceleration: { type: "slide", value: 9.81, range: [0, 15] },
        inverse: { type: "checkbox", value: false }
      },
      speed: {
        min: { type: "slide", value: 1, range: [0, 20] },
        max: { type: "slide", value: 4, range: [0, 20] }
      },
      spin: { 
        enable: { type: "checkbox", value: false },
        acceleration: { type: "slide", value: 0, range: [0, 10] }
      },
      straight: { type: "checkbox", value: false },
      outModes: {
        default: { type: "select", value: "out", options: ["bounce", "destroy", "none", "split", "out"]},
        bottom: { type: "select", value: "out", options: ["bounce", "destroy", "none", "split", "out"]},
        left: { type: "select", value: "out", options: ["bounce", "destroy", "none", "split", "out"]},
        right: { type: "select", value: "out", options: ["bounce", "destroy", "none", "split", "out"]},
        top: { type: "select", value: "out", options: ["bounce", "destroy", "none", "split", "out"]},
      }
    }
  },
  interactivity: {
    events: {
      onClick: { 
        enable: { type: "checkbox", value: false },
        mode: { type: "select", value: "push", options: ["push", "remove"] }
      },
      onHover: {
        enable: { type: "checkbox", value: false },
        mode: { type: "select", value: "repulse", options: ["grab", "bubble", "repulse"] },
        parallax: {
          enable: { type: "checkbox", value: false },
          force: { type: "slide", value: 60, range: [0, 100] },
          smooth: { type: "slide", value: 10, range: [0, 50] }
        }
      },
    },
    modes: {
      trail: {
        delay: { type: "slide", value: 1, range: [0, 10] },
        quantity: { type: "slide", value: 5, range: [0, 10] },
      },
      attract: {
        distance: { type: "slide", value: 200, range: [0, 1000] },
        duration: { type: "slide", value: 0.4, range: [0, 2] },
        speed: { type: "slide", value: 1, range: [0, 3] }
      },
      bubble: {
        distance: { type: "slide", value: 200, range: [0, 1000] },
        duration: { type: "slide", value: 0.4, range: [0, 2] },
      },
      connect: {
        distance: { type: "slide", value: 80, range: [0, 1000] },
        links: {
          opacity: { type: "slide", value: 0.5, range: [0, 1] }
        },
        radius: { type: "slide", value: 60, range: [0, 100] }
      },
      grab: {
        distance: { type: "slide", value: 100, range: [0, 1000] },
        links: {
          blink: { type: "checkbox", value: false },
          consent: { type: "checkbox", value: false },
          opacity: { type: "slide", value: 1, range: [0, 1] }
        }
      },
      push: {
        quantity: { type: "slide", value: 4, range: [0, 10] }
      },
      remove: {
        quantity: { type: "slide", value: 2, range: [0, 10] }
      }
    }
  }
};


const convertStructureToValues = (structure) => {
  if (structure && typeof structure === "object") {
    if ("type" in structure && "value" in structure) {
      return structure.value;
    }

    const result = {};
    for (const key in structure) {
      result[key] = convertStructureToValues(structure[key]);
    }
    return result;
  }

  return structure;
};

const singleStructure = convertStructureToValues(structure);
singleStructure.particles.array = [];
singleStructure.interactivity.mouse = {};
export { singleStructure };