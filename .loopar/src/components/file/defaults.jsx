import {ImageIcon} from "lucide-react";
import { FaFileZipper } from "react-icons/fa6";
import { RiFileExcel2Fill } from "react-icons/ri";
import { BsFillFileEarmarkPdfFill } from "react-icons/bs";
import { FaFile, FaFileAudio, FaFolder } from "react-icons/fa";
import { IoVideocamSharp } from "react-icons/io5";
import { RiFileWord2Fill } from "react-icons/ri";
import fileManager from "@tools/file-manager";
import loopar from "loopar";

export const fileIcons = {
  image: {
    icon: ImageIcon,
    color: "text-primary",
  },
  video: {
    icon: IoVideocamSharp,
    color: "text-primary",
  },
  audio: {
    icon: FaFileAudio,
    color: "text-primary",
  },
  pdf: {
    icon: BsFillFileEarmarkPdfFill,
    color: "text-red-500",
  },
  zip: {
    icon: FaFileZipper,
    color: "text-yellow-500",
  },
  word: {
    icon: RiFileWord2Fill,
    color: "text-blue-500",
  },
  excel: {
    icon: RiFileExcel2Fill,
    color: "text-green-500",
  },
  archive: {
    icon: FaFileZipper,
    color: "text-yelow-500",
  },
  code: {
    icon: FaFile,
    color: "text-primary",
  },
  text: {
    icon: FaFile,
    color: "text-primary",
  },
  folder: {
    icon: FaFolder,
    color: "text-yellow-500",
  },
  default: {
    icon: FaFile,
    color: "text-primary",
  },
};

export const validateFile = (file, acceptedTypes = "*/*") => {
  const fileType = fileManager.getFileType(file);
  const fileExtension = fileManager.getExtention(file);
  acceptedTypes = Array.isArray(acceptedTypes) ? acceptedTypes : acceptedTypes.split(',');

  for (let i = 0; i < acceptedTypes.length; i++) {
    const acceptedType = acceptedTypes[i];

    if (acceptedType == fileType || acceptedType == fileExtension || acceptedType === '*/*') {
      return;
    }

    if (acceptedType.endsWith('/*') && fileType.startsWith(acceptedType.slice(0, -2))) {
      return;
    }
  }

  loopar.throw(`File type "${fileType}" is not supported!`);
}