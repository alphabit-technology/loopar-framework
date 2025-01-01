import { useContext, createContext} from 'react';

export const ReceptorFilesContext = createContext({
  onselect: () => { },
  onclose: () => { },
  selected: [],
  setSelected: () => { },
  multiple: false,
  setMultiple: () => { },
  title: "File Browser",
  position: "top",
  size: "full",
  scrollable: true,
  open: false,
  buttons: [],
  content: null,
  onShow: () => { },
});

export const useReceptorFilesContext = () => useContext(ReceptorFilesContext);