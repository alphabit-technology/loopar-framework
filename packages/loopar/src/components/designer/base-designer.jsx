import loopar from "loopar";
import { BrushIcon, BracesIcon, EyeIcon, SparkleIcon, HandGrab, BrushCleaning } from "lucide-react";
import { BaseFormContext } from "@context/form-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DesignerContext, useDesigner } from "@context/@/designer-context";
import {Button} from "@cn/components/ui/button";
import Tab from "@tab";
import Tabs from "@tabs";
import {useCookies} from "@services/cookie";
import {cn} from "@cn/lib/utils";
import { isEqual } from "es-toolkit/predicate";
import { Sidebar } from "./sidebar";
import {useDocument} from "@context/@/document-context";
import elementManage from "@@tools/element-manage";
import {DragAndDropProvider, useDragAndDrop} from "../droppable/DragAndDropContext.jsx";
import {Prompt} from "./src/prompt/Prompt.jsx";
import MarkdownPreview from '@uiw/react-markdown-preview';
import {elementsNames} from "@global/element-definition";
import {OrphanColumnsManager} from "./src/OrphanColumnsManager.jsx"
import { ElementStore, ElementStoreContext } from "./element-store.js";

const updateE = (structure, data, key, merge) => {
  return structure.map((el) => {
    if (!el.data) return el;

    const newEl = {...el, data: {...el.data}};

    if (!elementsNames.includes(newEl.element)) {
      newEl.data.tag = newEl.element;
      newEl.element = "generic";
    }

    if (newEl.data.key === key) {
      newEl.data = merge ? {...newEl.data, ...data} : {...data};
      newEl.data.key ??= elementManage.getUniqueKey();
    } else {
      newEl.elements = updateE(newEl.elements || [], data, key, merge);
    }

    return newEl;
  });
};

const fixMeta = (structure) => {
  try {
    return structure.map((el) => {
      const newEl = {...el, data: {...(el.data || {})}};

      newEl.data.key ??= elementManage.getUniqueKey();

      if (fieldIsWritable(newEl)) {
        newEl.data.id ??= newEl.data.key;
        newEl.data.label ??= loopar.utils.Capitalize((newEl.data.name || newEl.data.key).replaceAll("_", " "));
        newEl.data.name ??= newEl.data.key;
      }

      newEl.elements = fixMeta(el.elements || []);

      return newEl;
    });
  } catch (error) {
    loopar.throw(error)
  }
}

const DesignerButton = () => {
  const { designerMode, designerModeType } = useDesigner();
  const { sidebarOpen, name } = useDocument();

  if (!designerMode || designerModeType == "preview") {
    return <><BrushIcon className="mr-2" /> Design</>
  }

  if (designerModeType == "editor") {
    if (sidebarOpen) {
      return <><BrushIcon className="mr-2" /> Design</>
    } else {
      return <><EyeIcon className="mr-2" /> Preview</>
    }
  }

  if (designerModeType == "designer") {
    return <><EyeIcon className="mr-2" /> Preview</>
  }
}

export const BaseDesigner = (props) => {
  const {data, metaComponents} = props;
  const [activeId] = useState(null);
  const {designerMode} = useDesigner();
  const {name, sidebarOpen, handleSetSidebarOpen} = useDocument();
  const [dragEnabled, setDragEnable] = useState(true);

  const [updatingElementName, setUpdatingElementName] = useCookies(name + "updatingElementName");
  const [designerModeType, setDesignerModeType] = useCookies(name + "designer-mode-type");
  const [sendingPrompt, setSendingPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("Generate a form that allows me to manage inventory data");
  const [updatingFromEditor, setUpdatingFromEditor] = useState(false);
  const [localMetaComponents, setLocalMetaComponents] = useState(metaComponents || []);
  const commitTimerRef = useRef(null);
  const selfKey = data.key;

  // Per-element data store. Lives across renders. Populated from the tree
  // initially and re-populated on structural changes; editor edits write
  // directly here, bypassing the BaseDesigner re-render path.
  const storeRef = useRef(null);
  if (storeRef.current === null) {
    storeRef.current = new ElementStore();
    storeRef.current.populate(metaComponents || []);
  }

  // Latest-state ref so the callbacks below can keep stable identities ([] deps)
  // while still reading fresh values. Reassigned every render.
  const stateRef = useRef({});
  stateRef.current.localMetaComponents = localMetaComponents;
  stateRef.current.updatingElementName = updatingElementName;
  stateRef.current.designerModeType = designerModeType;
  stateRef.current.sidebarOpen = sidebarOpen;
  stateRef.current.selfKey = selfKey;
  stateRef.current.onChange = props.onChange;
  stateRef.current.handleSetSidebarOpen = handleSetSidebarOpen;
  stateRef.current.setUpdatingElementName = setUpdatingElementName;
  stateRef.current.setDesignerModeType = setDesignerModeType;

  useEffect(() => {
    // Skip the prop → local sync while we have in-flight editor edits — the
    // parent's prop is necessarily stale relative to the store, and applying
    // it would clobber the user's typing.
    if (commitTimerRef.current !== null) return;
    if (!isEqual(localMetaComponents, metaComponents || [])) {
      const next = metaComponents || [];
      storeRef.current.populate(next);
      setLocalMetaComponents(next);
    }
  }, [metaComponents]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    };
  }, []);

  const findElement = useCallback((field, value, els) => {
    const list = els ?? stateRef.current.localMetaComponents;
    if (!value || value == "null" || value.length == 0 || !list) return null;

    for (let i = 0; i < list.length; i++) {
      if (list[i]?.data?.[field] == value) {
        return list[i];
      } else if (Array.isArray(list[i]?.elements)) {
        const found = findElement(field, value, list[i].elements || []);
        if (found) return found;
      }
    }

    return null;
  }, []);

  const [updatingElement, setUpdatingElement] = useState(() =>
    findElement("key", updatingElementName)
  );

  useEffect(() => {
    const found = findElement("key", updatingElementName, localMetaComponents);
    setUpdatingElement(prev => {
      // Same element still being edited — keep prev so its data ref doesn't
      // get clobbered by the tree (which may lag the store on in-flight edits).
      if (prev && found && prev.data?.key === found.data?.key) return prev;
      if (!found) return null;
      // New element selected — seed its data from the store (latest), falling
      // back to the tree's data if the store has nothing for that key yet.
      const liveData = storeRef.current.get(found.data?.key) || found.data;
      return liveData === found.data ? found : { ...found, data: liveData };
    });
  }, [updatingElementName, localMetaComponents, findElement]);

  // Structural commit path. Used for drop/delete/programmatic tree changes.
  // Writes the new tree to local state AND repopulates the store, then
  // notifies the parent immediately. Cancels any pending editor commit
  // since whatever was pending is now superseded by the new tree.
  const setMeta = useCallback((meta) => {
    if (loopar.utils.isJSON(meta)) {
      const fixed = fixMeta(JSON.parse(meta));

      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }

      storeRef.current.populate(fixed);
      setLocalMetaComponents(fixed);
      stateRef.current.onChange?.(JSON.stringify(fixed));
    } else {
      console.error(["Invalid JSON object", meta]);
      loopar.throw("Invalid JSON object");
    }
  }, []);

  // Editor commit path. Called debounced after store-only edits to flush
  // in-flight data to the parent without forcing a BaseDesigner re-render
  // for every keystroke. Reconciles the tree with the store on the fly,
  // so the parent receives a consistent snapshot.
  const scheduleCommit = useCallback(() => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      const reconciled = storeRef.current.reconcileTree(stateRef.current.localMetaComponents);
      stateRef.current.onChange?.(JSON.stringify(reconciled));
    }, 300);
  }, []);

  const updateElements = useCallback((target, elements, current = null) => {
    // Reconcile from store first so any in-flight editor edits aren't
    // discarded by the structural mutation that follows.
    const currentElements = storeRef.current.reconcileTree(stateRef.current.localMetaComponents);
    const selfKeyNow = stateRef.current.selfKey;
    const targetKey = target.data.key;
    const currentKey = current ? current.data.key : null;
    const lastParentKey = current ? current.parentKey : null;

    const setElementsInTarget = (structure) => {
      return structure.map((el) => {
        el.elements = el.data.key === targetKey ? elements
          : setElementsInTarget(el.elements || []);
        return el;
      });
    };

    let newElements = targetKey === selfKeyNow ? elements
      : setElementsInTarget(currentElements, selfKeyNow);

    const deleteCurrentOnLastParent = (structure, parent) => {
      if (lastParentKey === parent) {
        return structure.filter(e => e.data.key !== currentKey);
      }

      return structure.map(el => {
        el.elements = deleteCurrentOnLastParent(el.elements || [], el.data.key);
        return el;
      });
    };

    if (current && lastParentKey !== targetKey) {
      newElements = deleteCurrentOnLastParent(newElements, selfKeyNow);
    }

    setMeta(JSON.stringify(newElements));
  }, [setMeta]);

  const updateElement = useCallback((key, data, merge = true, fromEditor = false) => {
    const { localMetaComponents: current, updatingElementName: editingName } = stateRef.current;
    const store = storeRef.current;

    if (data.name) {
      // Check duplicates against latest data (reconciled with in-flight edits).
      const reconciled = store.reconcileTree(current);
      const exist = findElement("name", data.name, reconciled);

      if (exist && exist.data.key !== key) {
        return loopar.throw(
          "Duplicate field",
          `The field with the name: ${data.name} already exists, your current field will keep the name: ${data.name} please check your fields and try again.`,
          false
        );
      }
    }

    if (fromEditor) {
      // Hot path: editor keystroke. Update store only, schedule a debounced
      // commit to the parent. BaseDesigner does NOT re-render here; only the
      // single Meta subscribed to this key reacts.
      store.update(key, data, merge);
      scheduleCommit();
      return;
    }

    // Programmatic / non-editor change: full tree update via setMeta.
    const reconciled = store.reconcileTree(current);
    setMeta(JSON.stringify(updateE(reconciled, data, key, merge)));

    if (key === editingName) {
      setUpdatingElement(prev => prev ? {
        ...prev,
        data: merge ? {...prev.data, ...data} : {...data},
        __version__: (prev.__version__ || 0) + 1
      } : prev);
    }
  }, [findElement, setMeta, scheduleCommit]);

  const deleteElement = useCallback((element) => {
    const removeElement = (elements) => {
      return elements.filter((el) => {
        if (el.data.key === element) return false;
        if (el.elements) el.elements = removeElement(el.elements);
        return true;
      });
    };

    const reconciled = storeRef.current.reconcileTree(stateRef.current.localMetaComponents);
    setMeta(JSON.stringify(removeElement(reconciled)));
  }, [setMeta]);

  const handleSetMode = useCallback((newMode) => {
    stateRef.current.setDesignerModeType(newMode);
    stateRef.current.handleSetSidebarOpen(true);
  }, []);

  const handleChangeMode = useCallback((opt = null) => {
    const { designerModeType: modeNow, sidebarOpen: openNow } = stateRef.current;
    const newMode = opt !== null ? opt : (
      ["preview", "editor"].includes(modeNow) ? (!openNow ? "preview" : "designer") : "preview"
    );

    handleSetMode(newMode);
  }, [handleSetMode]);

  const handleEditElement = useCallback((element) => {
    stateRef.current.setUpdatingElementName(element);
    handleChangeMode("editor");
  }, [handleChangeMode]);

  const handleDeleteElement = useCallback((element) => {
    loopar.confirm("Are you sure you want to delete this element?", () => {
      deleteElement(element);
    });
  }, [deleteElement]);

  useEffect(() => {
    if (designerMode) return;

    if (!updatingElementName || updatingElementName == "null") {
      handleSetMode("designer");
    } else if (!findElement("key", updatingElementName)) {
      setUpdatingElementName(null);
    }
  }, []);

  const handleSetMeta = useCallback((e) => {
    e.preventDefault();

    !designerMode && loopar.prompt({
      title: "META",
      label: "JSON META object",
      placeholder: "Enter a valid JSON META object",
      ok: setMeta,
      size: "lg",
      validate: (meta) => {
        !loopar.utils.isJSON(meta) && loopar.throw("Invalid JSON object");
        return true;
      }
    });
  }, [designerMode, setMeta]);

  const isDesigner = typeof designerMode != "undefined" ? !designerMode : true;

  const designerRef = useMemo(
    () => ({ updateElements, updateElement }),
    [updateElements, updateElement]
  );

  const designing = designerModeType === "designer" || designerModeType === "editor";

  const contextValue = useMemo(() => ({
    designerMode: isDesigner,
    designerModeType,
    designerRef,
    updateElements,
    updatingElement,
    updateElement,
    designing,
    handleEditElement,
    handleDeleteElement,
    activeId,
    handleChangeMode,
    handleSetMode,
    updatingFromEditor,
    dragEnabled,
    setDragEnable,
  }), [
    isDesigner,
    designerModeType,
    designerRef,
    updateElements,
    updatingElement,
    updateElement,
    designing,
    handleEditElement,
    handleDeleteElement,
    activeId,
    handleChangeMode,
    handleSetMode,
    updatingFromEditor,
    dragEnabled,
  ]);

  return (
    <ElementStoreContext.Provider value={storeRef.current}>
    <DesignerContext.Provider value={contextValue}>
      <BaseFormContext.Provider value={{}}>
        <div className="">
            <Prompt 
              defaultPrompt={currentPrompt} 
              open={sendingPrompt} 
              onClose={() => setSendingPrompt(false)}
              onComplete={setMeta}
            />
          <div className="flex w-full flex-row justify-between pt-2 px-2 pb-0">
            <div>
              <h2 className="text-3xl">{data.label}</h2>
            </div>
            <div className="space-x-1">
              <Button 
                className={dragEnabled ? 'bg-red-500' : 'bg-secondary'}
                onClick={() => {
                  setDragEnable && setDragEnable(!dragEnabled);
                }}
              >
                <HandGrab/>
              </Button>
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  !designerMode && handleChangeMode();
                }}
              >
                <DesignerButton/>
              </Button>
              <Button variant="secondary" onClick={handleSetMeta}>
                <BracesIcon className="mr-2" />
                META
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSendingPrompt(true)}
              >
                <SparkleIcon className="mr-2" />
                Design AI
              </Button>
            </div>
          </div>
          <Tabs
            data={{ name: selfKey}}
            key={selfKey}
            asChild={true}
            canCustomize={false}
          >
            <Tab
              label={<div className="flex"><BrushIcon className="h-6 w-6 pr-2" /> Designer</div>}
              name={`${selfKey}-designer_tab`}
              key={`${selfKey}-designer_tab`}
            >
              <div
                className={cn("rounded border shadow-sm w-full", designerModeType === "preview" ? "p-3" : "")}
              >
                <DragAndDropProvider 
                  metaComponents={metaComponents} 
                  data={data}
                  onDrop={setMeta}
                >
                  {sidebarOpen && <Sidebar/>}
                </DragAndDropProvider>
              </div>
            </Tab>
            <Tab
              label={<div className="flex"><BracesIcon className="h-6 w-6 pr-2" /> META</div>}
              name={`${selfKey}-meta_tab`}
              key={`${selfKey}-meta_tab`}
            >
              <div className="max-h-[720px] overflow-x-auto">
                <div
                  className="contents w-full prose dark:prose-invert"
                >
                  <MarkdownPreview source={`\`\`\`jsx\n${JSON.stringify(metaComponents, null, 2)}\n\`\`\``} />
                </div>
              </div>
            </Tab>
            <Tab
              label={<div className="flex"><BrushCleaning className="h-6 w-6 pr-2" /> Clean</div>}
              name={`${selfKey}-clean_tab`}
              key={`${selfKey}-clean_tab`}
            >
              <div className="max-h-[720px] overflow-x-auto">
                <div
                  className="contents w-full prose dark:prose-invert"
                >
                  {!!name &&
                    <OrphanColumnsManager
                      document={name}
                    />
                  }
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </BaseFormContext.Provider>
    </DesignerContext.Provider>
    </ElementStoreContext.Provider>
  )
}

export const Designer = (props) => {
  const {designerMode} = useDesigner();
  if (!designerMode) {
    return <BaseDesigner {...props} />
  }

  const {data} = props;
  
  return (
    <div className="">
      <div className="flex w-full flex-row justify-between pt-2 px-2 pb-0">
        <div>
          <h2 className="text-3xl">{data.label}</h2>
        </div>
        <div className="space-x-1 pointer-events-none">
          <Button variant="secondary">
            <BrushIcon className="mr-2" />
            Design
          </Button>
          <Button variant="secondary">
            <BracesIcon className="mr-2" />
            META
          </Button>
          <Button
            variant="secondary"
          >
            <SparkleIcon className="mr-2" />
            Design AI
          </Button>
        </div>
      </div>
      <div className="w-full p-2">
        <div className="flex items-center bg-slate-700/50 justify-center h-[60px]">
          <h1 className="text-center text-2xl font-bold">Design area</h1>
        </div>
      </div>
    </div>
  )
}