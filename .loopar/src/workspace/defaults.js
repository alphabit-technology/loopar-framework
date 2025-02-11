export const activeBgLink = "bg-secondary/50 hover:bg-secondary/80 focus:bg-secondary/80 font-bold";
export const inactiveBgLink = "bg-transparent text-primary/50 hover:bg-secondary/20 focus:bg-secondary/20";
export const activeTextLink = "text-primary hover:text-primary/80";

export const activeLink = (active) => {
  return active ? activeBgLink : inactiveBgLink;
}