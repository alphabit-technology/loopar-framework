var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, jsxs } from "react/jsx-runtime";
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
class FileManager {
  constructor() {
    __publicField(this, "groupElement", FILE_INPUT);
    __publicField(this, "inputType", "file");
    __publicField(this, "fileIcons", {
      image: { icon: "fas fa-file-image", color: "primary" },
      video: { icon: "fas fa-file-video", color: "danger" },
      audio: { icon: "fas fa-file-audio", color: "warning" },
      pdf: { icon: "fas fa-file-pdf", color: "danger" },
      word: { icon: "fas fa-file-word", color: "primary" },
      excel: { icon: "fas fa-file-excel", color: "success" },
      powerpoint: { icon: "fas fa-file-powerpoint", color: "danger" },
      zip: { icon: "fa fa-file-archive", color: "yellow" },
      code: { icon: "fas fa-file-code", color: "secondary" },
      text: { icon: "fas fa-file-alt", color: "secondary" },
      default: { icon: "fas fa-file", color: "secondary" },
      folder: { icon: "fas fa-folder", color: "yellow" },
      application: { icon: "fas fa-file", color: "secondary" }
    });
    __publicField(this, "fileRxtensions", {
      image: ["jpg", "jpeg", "png", "gif", "svg", "bmp", "ico", "webp", "tiff", "tif", "psd", "ai", "raw", "indd", "heif", "heic", "eps", "svgz", "jfif"],
      video: ["mp4", "avi", "mkv", "webm", "mov", "flv", "wmv", "mpg", "mpeg", "3gp", "3g2", "m4v", "h264", "rmvb", "vob", "ts", "m2ts", "mts", "divx", "xvid", "asf", "ogv", "rm", "swf", "f4v", "dat", "m2v", "mpeg1", "mpeg2", "mpeg4", "vcd", "svcd", "dvd", "m1v", "m2p", "m2ts", "m2v", "m4e", "mjp", "mjpeg", "mod", "movie", "mp21", "mpe", "mpv", "ogx", "qt", "viv", "vivo", "vob", "vro", "xlmv"],
      audio: ["mp3", "wav", "ogg", "m4a", "wma", "flac", "aac", "aiff", "alac", "pcm", "dsd", "awb", "ac3", "dts", "mp2", "mka", "m3u", "m3u8", "opus", "ra", "rm", "tta", "wv", "webm", "caf", "amr", "mpc", "mid", "midi", "log", "cue", "aif", "aifc", "cda", "dct", "dss", "dvf", "gsm", "m3u", "pls", "sln", "vox", "wma", "wpl", "zab", "m4b", "m4p", "oga", "mogg", "spx", "opus", "3gp", "aa", "aax", "act", "aiff", "alac", "amr", "ape", "au", "awb", "dct", "dss", "dvf", "flac", "gsm", "iklax", "ivs", "m4a", "m4b", "m4p", "mmf", "mpc", "msv", "nmf", "nsf", "ogg", "oga", "mogg", "opus", "ra", "rm", "raw", "rf64", "sln", "tta", "voc", "vox", "wav", "wma", "wv", "webm", "8svx", "cda", "m3u", "pls", "spx", "wpl", "zab"],
      pdf: ["pdf", "ps"],
      word: ["doc", "docx"],
      excel: ["xls", "xlsx"],
      powerpoint: ["ppt", "pptx"],
      zip: ["zip", "rar", "7z", "tar"],
      code: ["html", "css", "js", "php", "py", "java", "cpp", "c", "cs", "go", "ts", "tsx", "jsx", "rb", "sh", "bat", "cmd"],
      text: ["txt", "md"],
      application: ["exe", "msi", "apk", "dmg", "iso", "bin", "jar", "deb", "rpm", "appimage", "run", "app", "ipa", "xap", "xapk", "msix", "msixbundle", "msixupload", "msixbundleupload", "msixupload", "msixbundleupload", "msixbq", "dll"]
    });
  }
  getIconByExtention(ext, type) {
    if (type === "folder") {
      return this.fileIcons["folder"];
    }
    for (const [key, value] of Object.entries(this.fileRxtensions)) {
      if (value.includes(ext)) {
        return this.fileIcons[key];
      }
    }
    return this.fileIcons["default"];
  }
  getTypeByExtension(ext) {
    for (const [key, value] of Object.entries(this.fileRxtensions)) {
      if (value.includes(ext)) {
        return key;
      }
    }
    return "default";
  }
  getExtention(file) {
    const explit = file.name.split(".");
    if (explit.length === 1)
      return "folder";
    return explit.pop().toLowerCase();
  }
  getFileType(file) {
    if (elementManage.isJSON(file)) {
      file = JSON.parse(file);
    }
    return file.type === "folder" ? "folder" : this.getTypeByExtension(this.getExtention(file));
  }
  getFileSize(bytes, decimals = 2) {
    if (bytes === 0)
      return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return [parseFloat((bytes / Math.pow(k, i)).toFixed(dm)), /* @__PURE__ */ jsx("small", { className: "pl-1", children: /* @__PURE__ */ jsx("strong", { children: sizes[i] }) })];
  }
  getFileIcon(type) {
    return this.fileIcons[type] ? this.fileIcons[type].icon : this.fileIcons["default"].icon;
  }
  getRenderedFileIcon(type) {
    const TYPE = this.fileIcons[type] || this.fileIcons["default"];
    return /* @__PURE__ */ jsx("span", { className: TYPE.icon + " fa-2x text-" + TYPE.color });
  }
  isURL(str) {
    var regex = /^(https?:\/\/)?([\w-]+\.)+([a-z]{2,})(\/\S*)?$/;
    return regex.test(str);
  }
  getMappedFiles(files = []) {
    if (typeof files === "string" && !elementManage.isJSON(files)) {
      if (this.isURL(files)) {
        files = [{
          name: files,
          src: files,
          type: "image",
          extention: "png",
          previewSrc: files
        }];
      } else {
        files = [files];
      }
    }
    if (files instanceof File) {
      files = FileList(files);
    }
    if (files && typeof files == "object") {
      files = Object.values(files);
    }
    if (typeof files === "string" && elementManage.isJSON(files)) {
      files = JSON.parse(files);
    }
    if (typeof files == "object" && !Array.isArray(files)) {
      files = [];
    }
    return (files || []).filter((file) => typeof file == "object" && file.name && !Array.isArray(file)).map((file) => {
      const ext = this.getExtention(file);
      return file instanceof File ? file : {
        ...file,
        type: this.getFileType(file),
        src: this.getSrc(file),
        extention: ext,
        previewSrc: this.getSrc(file, true, ext)
      };
    });
  }
  getSrc(file, preview = false, ext = null) {
    if (file.src && (file.src.includes("data:") || file.src.includes("http"))) {
      return encodeURI(file.src);
    }
    return encodeURI("/uploads/" + (preview && ext !== "svg" ? "thumbnails/" : "") + file.name);
  }
  getImagePreview(file) {
    return /* @__PURE__ */ jsx("div", { className: "card card-figure", children: /* @__PURE__ */ jsx("figure", { className: "figure", children: /* @__PURE__ */ jsxs("div", { className: "figure-img", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          className: "img-fluid",
          src: file.previewSrc || file.src,
          alt: file.name
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "figure-description", children: [
        /* @__PURE__ */ jsx("h6", { className: "figure-title", children: file.name }),
        /* @__PURE__ */ jsx("p", { className: "text-muted mb-0", children: /* @__PURE__ */ jsx("small", { children: file.size }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "figure-tools", children: /* @__PURE__ */ jsx("a", { href: "#", className: "tile tile-circle tile-sm mr-auto", children: /* @__PURE__ */ jsx("span", { className: "oi oi-data-transfer-download" }) }) }),
      /* @__PURE__ */ jsx("div", { className: "figure-action", children: /* @__PURE__ */ jsx("button", { className: "btn btn-block btn-sm btn-primary", onClick: () => clearFiles(), children: "Remove" }) })
    ] }) }) });
  }
  async makePreviews(files) {
    const promises = Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        if (file instanceof File) {
          if (file.type.match("image.*")) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const imageFile = { name: file.name, src: e.target.result, type: "image" };
              resolve(this.getImagePreview(imageFile));
            };
            reader.onerror = (e) => {
              reject(e);
            };
            return reader.readAsDataURL(file);
          }
        } else if (file.type === "image") {
          return resolve(this.getImagePreview(file));
        }
        resolve(p({ class: "text-muted mb-0" }, file.name));
      });
    });
    return new Promise((resolve, reject) => {
      Promise.all(promises).then((previews) => {
        resolve(previews);
      }).catch((error) => {
        reject(error);
      });
    });
  }
  getImage(data = {}, field, avatar = null) {
    const img = this.getMappedFiles((data || {})[field])[0];
    return img ? img.previewSrc : avatar ? `/assets/images/avatars/${avatar}` : null;
  }
}
const fileManager = new FileManager();
export {
  fileManager as f
};
