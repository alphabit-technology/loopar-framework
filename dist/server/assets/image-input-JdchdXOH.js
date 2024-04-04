import { F as FileInput } from "./file-browser-uAbuTUuu.js";
import "react/jsx-runtime";
import "./dialog-nmg_tOQf.js";
import "react";
import "../entry-server.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./dialog-9N_htvR6.js";
import "@radix-ui/react-dialog";
import "./x-3j0F7ehT.js";
import "./createLucideIcon-SgSXnVj5.js";
import "./input-LY3ihqM_.js";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "./scroll-area-5SWWHlEI.js";
import "@radix-ui/react-scroll-area";
import "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./base-input-uYDrqEOF.js";
import "./form-field-WWLBJIO2.js";
import "./form-context-8n26Uc_0.js";
import "./form-z4zN6fsS.js";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
import "react-lazy-load";
import "./globe-2-q99urLW1.js";
import "./form-1mb5BBtU.js";
import "zod";
class ImageInput extends FileInput {
  //inputType = 'file';
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      multiple: props.data.multiple || false,
      accept: props.data.accept || "image/*"
    };
  }
  render() {
    return super.render();
  }
}
export {
  ImageInput as default
};
