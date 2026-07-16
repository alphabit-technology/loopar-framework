import * as iconModules from "@app/auto/preloaded-icons";

export function BaseIcon({ icon, className, children }) {
  const Icon = iconModules[icon] || null;

  if(!Icon) return null;

  return <Icon className={className} >{children}</Icon>;
}