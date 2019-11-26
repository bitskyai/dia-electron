// Credit goes in large part to https://github.com/superRaytin/react-monaco-editor,
// this component is a changed version of it.

import * as MonacoType from "monaco-editor";
import * as React from "react";
import { getContent } from "../../utils/content";
import { loadMonaco } from "../../utils";

export interface EditorProps {
  appState: any;
  monaco: typeof MonacoType | null;
  monacoOptions: MonacoType.editor.IEditorOptions;
  id: string;
  options?: Partial<MonacoType.editor.IEditorConstructionOptions>;
  editorDidMount?: (editor: MonacoType.editor.IStandaloneCodeEditor) => void;
  onChange?: (
    value: string,
    event: MonacoType.editor.IModelContentChangedEvent
  ) => void;
}

export class Editor extends React.Component<EditorProps> {
  public editor: MonacoType.editor.IStandaloneCodeEditor;
  public language: string = "javascript";
  public value: string = "";

  private containerRef = React.createRef<HTMLDivElement>();

  constructor(props: EditorProps) {
    super(props);

    this.language = props.id === "html" ? "html" : "javascript";
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentDidMount() {
    this.initMonaco();
  }

  public componentWillUnmount() {
    this.destroyMonaco();
  }

  /**
   * Handle the editor having been mounted. This refers to Monaco's
   * mount, not React's.
   *
   * @param {MonacoType.editor.IStandaloneCodeEditor} editor
   */
  public async editorDidMount(editor: MonacoType.editor.IStandaloneCodeEditor) {
    // const { editorDidMount } = this.props;

    // Set the content on the editor
    await this.setContent();

    // Set the editor as an available object
    // window.MunewDIA.editors[this.props.id] = editor;

    // And notify others
    // if (editorDidMount) {
    //   editorDidMount(editor);
    // }
  }

  /**
   * Initialize Monaco.
   */
  public async initMonaco() {
    let { monaco, monacoOptions: monacoOptions } = this.props;
    const ref = this.containerRef.current;

    if (!monaco) {
      monaco = await loadMonaco();
    }

    if (ref) {
      if (monaco) {
        this.editor = monaco.editor.create(ref, {
          readOnly: true,
          language: this.language,
          theme: "main",
          contextmenu: false,
          model: null,
          ...monacoOptions
        });
      }

      await this.editorDidMount(this.editor);
    }
  }

  /**
   * Destroy Monaco.
   */
  public destroyMonaco() {
    if (typeof this.editor !== "undefined") {
      console.log("Editor: Disposing");
      this.editor.dispose();
    }
  }

  public render() {
    return <div className="monaco-editor-container" ref={this.containerRef} />;
  }

  /**
   * Sets the content on the editor, including the model and the view state.
   *
   * @private
   * @memberof Editor
   */
  private async setContent() {
    let { appState, id, monaco } = this.props;

    if (!monaco) {
      monaco = await loadMonaco();
    }

    const value = await getContent();
    const model = monaco.editor.createModel(value, this.language);
    model.updateOptions({
      tabSize: 2
    });

    this.editor.setModel(model);
  }
}
