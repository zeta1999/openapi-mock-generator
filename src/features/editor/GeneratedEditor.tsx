import { createSelector } from "@reduxjs/toolkit";
import { Chance } from "chance";
import faker from "faker";
import jsf from "json-schema-faker";
import $RefParser from "json-schema-ref-parser";
import cloneDeep from "lodash-es/cloneDeep";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getObjectByRef } from "../../shared/utils";
import { getDocument } from "../document/document-slice";
import { getCurrentRef } from "./editor-slice";
import { EditorContainer } from "./EditorContainer";
import { monacoDefaultOptions } from "./monaco-options";
import { MyMonacoEditor } from "./MyMonacoEditor";
import { useEditorResize } from "./use-editor-resize";

jsf.extend("faker", () => faker);
jsf.extend("chance", () => new Chance());

const getCurrentSchemaValue = createSelector(
  [getDocument, getCurrentRef],
  (document, currentRef) => {
    if (document && currentRef) {
      return JSON.stringify(getObjectByRef(currentRef, document));
    }
  }
);

export const GeneratedEditor: React.FC = () => {
  const document = useSelector(getDocument);
  const currentSchemaValue = useSelector(getCurrentSchemaValue);

  const [value, setValue] = useState(" ");

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>();

  useEffect(() => {
    if (document && currentSchemaValue) {
      const schema = JSON.parse(currentSchemaValue);
      const schemas = document.components?.schemas;

      const schemaObj = {
        ...schema,
        components: {
          schemas: cloneDeep(schemas)
        }
      };

      $RefParser
        .dereference(schemaObj)
        .then(parsedSchema => {
          jsf.option("alwaysFakeOptionals", true);
          try {
            const generated = jsf.generate(parsedSchema);
            setValue(JSON.stringify(generated, null, 2));
          } catch {}
        })
        .catch(err => {
          console.error(err);
        });
    }
  }, [document, currentSchemaValue]);

  const containerRef = useEditorResize(editorRef);

  const options: monacoEditor.editor.IStandaloneEditorConstructionOptions = {
    ...monacoDefaultOptions,
    ariaLabel: "generated model",
    readOnly: true
  };

  const editorDidMount = (
    editor: monacoEditor.editor.IStandaloneCodeEditor
  ) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <EditorContainer data-testid="generated-editor" ref={containerRef}>
      <MyMonacoEditor
        language="json"
        value={value}
        options={options}
        editorDidMount={editorDidMount}
      ></MyMonacoEditor>
    </EditorContainer>
  );
};
