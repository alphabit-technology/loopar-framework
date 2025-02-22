export const activeBgLink = "bg-secondary/50 hover:bg-secondary/80 focus:bg-secondary/80 font-bold";
export const inactiveBgLink = "bg-transparent text-primary/80 hover:bg-secondary/20 focus:bg-secondary/20";
export const activeTextLink = "text-primary hover:text-primary/80";

import { cn } from "@cn/lib/utils";

export const activeLink = (active, activeClassName) => {
  return active ? cn(activeBgLink, activeClassName) : inactiveBgLink;
}