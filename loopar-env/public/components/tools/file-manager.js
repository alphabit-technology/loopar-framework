import { div, span,  a, p, small, image, figure, h6} from "/components/elements.js";
import {element_manage} from "../element-manage.js";

class FileManager{
   group_element = FILE_INPUT;
   input_type = 'file';
   file_icons = {
      image: {icon: 'fas fa-file-image', color: 'primary'},
      video: {icon: 'fas fa-file-video', color: 'danger'},
      audio: {icon: 'fas fa-file-audio', color: 'warning'},
      pdf: {icon: 'fas fa-file-pdf', color: 'danger'},
      word: {icon: 'fas fa-file-word', color: 'primary'},
      excel: {icon: 'fas fa-file-excel', color: 'success'},
      powerpoint: {icon: 'fas fa-file-powerpoint', color: 'danger'},
      zip: {icon: 'fa fa-file-archive', color: 'yellow'},
      code: {icon: 'fas fa-file-code', color: 'secondary'},
      text: {icon: 'fas fa-file-alt', color: 'secondary'},
      default: {icon: 'fas fa-file', color: 'secondary'},
      folder: {icon: 'fas fa-folder', color: 'yellow'},
      application: {icon: 'fas fa-file', color: 'secondary'}
   };

   file_extensions = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'ico', 'webp', 'tiff', 'tif', 'psd', 'ai', 'raw', 'indd', 'heif', 'heic', 'eps', 'svgz', 'jfif'],
      video: ['mp4', 'avi', 'mkv', 'webm', 'mov', 'flv', 'wmv', 'mpg', 'mpeg', '3gp', '3g2', 'm4v', 'h264', 'rmvb', 'vob', 'ts', 'm2ts', 'mts', 'divx', 'xvid', 'asf', 'ogv', 'rm', 'swf', 'f4v', 'dat', 'm2v', 'mpeg1', 'mpeg2', 'mpeg4', 'vcd', 'svcd', 'dvd', 'm1v', 'm2p', 'm2ts', 'm2v', 'm4e', 'mjp', 'mjpeg', 'mod', 'movie', 'mp21', 'mpe', 'mpv', 'ogx', 'qt', 'viv', 'vivo', 'vob', 'vro', 'xlmv'],
      audio: ['mp3', 'wav', 'ogg', 'm4a', 'wma', 'flac', 'aac', 'aiff', 'alac', 'pcm', 'dsd', 'awb', 'ac3', 'dts', 'mp2', 'mka', 'm3u', 'm3u8', 'opus', 'ra', 'rm', 'tta', 'wv', 'webm', 'caf', 'amr', 'mpc', 'mid', 'midi', 'log', 'cue', 'aif', 'aifc', 'cda', 'dct', 'dss', 'dvf', 'gsm', 'm3u', 'pls', 'sln', 'vox', 'wma', 'wpl', 'zab', 'm4b', 'm4p', 'oga', 'mogg', 'spx', 'opus', '3gp', 'aa', 'aax', 'act', 'aiff', 'alac', 'amr', 'ape', 'au', 'awb', 'dct', 'dss', 'dvf', 'flac', 'gsm', 'iklax', 'ivs', 'm4a', 'm4b', 'm4p', 'mmf', 'mpc', 'msv', 'nmf', 'nsf', 'ogg', 'oga', 'mogg', 'opus', 'ra', 'rm', 'raw', 'rf64', 'sln', 'tta', 'voc', 'vox', 'wav', 'wma', 'wv', 'webm', '8svx', 'cda', 'm3u', 'pls', 'spx', 'wpl', 'zab'],
      pdf: ['pdf', 'ps'],
      word: ['doc', 'docx'],
      excel: ['xls', 'xlsx'],
      powerpoint: ['ppt', 'pptx'],
      zip: ['zip', 'rar', '7z', 'tar'],
      code: ['html', 'css', 'js', 'php', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'ts', 'tsx', 'jsx', 'rb', 'sh', 'bat', 'cmd'],
      text: ['txt', 'md'],
      application: ['exe', 'msi', 'apk', 'dmg', 'iso', 'bin', 'jar', 'deb', 'rpm', 'appimage', 'run', 'app', 'ipa', 'xap', 'xapk', 'msix', 'msixbundle', 'msixupload', 'msixbundleupload', 'msixupload', 'msixbundleupload', 'msixbq', 'dll'],
   }

   getIconByExtention(ext, type) {
      if (type === 'folder') {
         return this.file_icons['folder'];
      }

      for (const [key, value] of Object.entries(this.file_extensions)) {
         if (value.includes(ext)) {
            return this.file_icons[key];
         }
      }

      return this.file_icons['default'];
   }

   getTypeByExtension(ext) {
      for (const [key, value] of Object.entries(this.file_extensions)) {
         if (value.includes(ext)) {
            return key;
         }
      }

      return 'default';
   }
   
   getExtention(file) {
      const explit = file.name.split('.');
      if(explit.length === 1) return 'folder';

      return explit.pop().toLowerCase();
   }

   getFileType(file) {
      if(element_manage.isJSON(file)){
         file = JSON.parse(file);
      }

      return file.type === "folder" ? "folder" : this.getTypeByExtension(this.getExtention(file));
   }

   getMappedFiles(files = []){
      /*if(files instanceof FileList){
         return files;
      }*/
      if(typeof files === "string" && !element_manage.isJSON(files)){
         files = [files]
      }

      if(files instanceof File){
         files = FileList(files);
      }

      if (typeof files == "object") {
         files = Object.values(files);
      }

      if(typeof files === "string" && element_manage.isJSON(files)){
         files = JSON.parse(files);
      }

      if(typeof files == "object" && !Array.isArray(files)){
         files = [];
      }

      return (files || []).filter(file => typeof file == "object" && !Array.isArray(file)).map(file => {
         const ext = this.getExtention(file);
         return file instanceof File ? file : {
            ...file, 
            type: this.getFileType(file), 
            src: this.getSrc(file), 
            extention: ext,
            previewSrc: this.getSrc(file, true, ext)
         } 
      });
   }

   getSrc(file, preview = false, ext = null){
      if(file.src && (file.src.includes("data:") || file.src.includes("http"))){
         return file.src;
      }
      return "/uploads/" + ((preview && ext !== "svg") ? "thumbnails/" : '') + file.name;
   }

   getImagePreview(file) {
      return [
         div({ class: "card card-figure" }, [
            figure({ class: "figure" }, [
               div({
                  class: "figure-img",
               }, [
                  image({ class: "img-fluid", src: file.previewSrc || file.src, alt: file.name }),
                  div({ class: "figure-description" }, [
                     h6({ class: "figure-title" }, file.name),
                     p({ class: "text-muted mb-0" }, [
                        small({}, file.size)
                     ])
                  ]),
                  div({ class: "figure-tools" }, [
                     a({ href: "#", class: "tile tile-circle tile-sm mr-auto" }, [
                        span({ class: "oi oi-data-transfer-download" })
                     ]),
                     //span({ class: "badge badge-danger" }, "Social")
                  ]),
                  div({ class: "figure-action" }, [
                     a({ href: "#", class: "btn btn-block btn-sm btn-primary", onClick: () => { this.clearFiles() } }, "Remove")
                  ])
               ])
            ])
         ])
      ]
   }

   async makePreviews(files) {
      const promises = Array.from(files).map((file) => {
         return new Promise((resolve, reject) => {
            if (file instanceof File) {
               if (file.type.match('image.*')){
                  const reader = new FileReader();

                  reader.onload = (e) => {
                     const imageFile = {name: file.name, src: e.target.result, type: "image"}
                     resolve(this.getImagePreview(imageFile));
                  };

                  reader.onerror = (e) => {
                     reject(e);
                  };

                  return reader.readAsDataURL(file);
               }
            } else if(file.type === "image"){
               return resolve(this.getImagePreview(file));
            }

            resolve(p({ class: "text-muted mb-0" }, file.name))
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

   getImage(data, field, avatar = null){
      const img = this.getMappedFiles(data[field])[0];
      if (img){
         return img.previewSrc;
      }else if(avatar){
         return `assets/images/avatars/${avatar}`;
      }

      return null
   }
}

export const fileManager = new FileManager();