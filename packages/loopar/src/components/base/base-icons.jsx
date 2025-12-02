import {PiX, PiXLogo, PiXLogoBold, PiXLogoFill, PiXLogoThin } from "react-icons/pi";
import * as iconModules from "@app/auto/preloaded-icons";

export function BaseIcon({ icon, className, children }) {
  if(icon == "XLogo") return <PiXLogo className={className} >{children}</PiXLogo>;
  if(icon == "XLogoBold") return <PiXLogoBold className={className} >{children}</PiXLogoBold>;
  if(icon == "XLogoFill") return <PiXLogoFill className={className} >{children}</PiXLogoFill>;
  if(icon == "XlogoThin") return <PiXLogoThin className={className} >{children}</PiXLogoThin>;
  if(icon == "PiX") return <PiX className={className} >{children}</PiX>;

  const Icon = iconModules[icon] || null;

  if(!Icon) return null;

  return <Icon className={className} >{children}</Icon>;
}