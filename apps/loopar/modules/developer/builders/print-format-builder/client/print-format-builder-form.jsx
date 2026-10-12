'use strict';

import { useCallback, useEffect, useState } from "react";
import loopar from "loopar";
import Emitter from "@services/emitter/emitter";
import { useDocument, useFieldEvent, useHandlers } from "@loopar/document";
import { useForm, FormLayout } from "@loopar/form";
import { setPrintDesignFields } from "@loopar/print/record";

const DESIGN_FIELD = "doc_structure";

export default function PrintFormatBuilderForm() {
  const { Document, ctrl } = useDocument();
  const { getValue } = useForm();
  const [entity, setEntity] = useState(Document?.data?.for_entity || "");

  useFieldEvent("for_entity", "change", (e) => setEntity(e?.target?.value ?? e?.value ?? ""));

  useEffect(() => {
    let alive = true;

    if (!entity) {
      setPrintDesignFields(null, []);
      return;
    }

    loopar.call("Print Format Builder", "entityFields", { query: { entity }, freeze: false })
      .then((r) => alive && setPrintDesignFields(r?.entity || entity, r?.fields || []))
      .catch(() => alive && setPrintDesignFields(entity, []));

    return () => { alive = false; };
  }, [entity]);

  useEffect(() => () => setPrintDesignFields(null, []), []);

  useEffect(() => {
    ctrl?.setFieldDf("load_entity", "disabled", !entity);
  }, [ctrl, entity]);

  const loadEntity = useCallback(async () => {
    if (!entity) return loopar.notify("Pick the entity to print first.", "warning");

    const r = await loopar.call("Print Format Builder", "entityLayout", { query: { entity } });
    const elements = r?.elements || [];
    if (!elements.length) return loopar.notify(`${entity} has nothing printable to load.`, "warning");

    const load = (mode) => Emitter.emit("designer:load", { field: DESIGN_FIELD, elements, mode });

    const current = loopar.utils.JSONparse(getValue(DESIGN_FIELD), []) || [];
    if (!current.length) return load("replace");

    loopar.dialog({
      type: "confirm",
      title: `Load ${entity}`,
      content: `The design already has elements. Replace them with the layout of ${entity}, or add it at the end? (Undo brings the current design back.)`,
      buttons: [
        { name: "replace", text: "Replace", variant: "secondary", dismiss: true, onClick: () => load("replace") },
        { name: "append", text: "Add at the end", variant: "secondary", dismiss: true, onClick: () => load("append") },
        { name: "cancel", text: "Cancel", variant: "ghost", dismiss: true, onClick: () => {} },
      ],
    });
  }, [entity, getValue]);

  useHandlers({ loadEntity });

  return <FormLayout />;
}
