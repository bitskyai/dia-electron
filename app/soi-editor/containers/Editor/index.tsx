// Credit goes in large part to https://github.com/superRaytin/react-monaco-editor,
// this component is a changed version of it.

import * as MonacoType from "monaco-editor";
import * as React from "react";
import * as path from "path";
import { remote } from "electron";
import * as fs from "fs-extra";
import { loadMonaco } from "../../utils";
import { getFileContent, updateFileContent } from '../../../utils/soi-file-manager';

export interface EditorProps {
  path: string;
  monaco: typeof MonacoType | null;
  monacoOptions: MonacoType.editor.IEditorOptions;
  options?: Partial<MonacoType.editor.IEditorConstructionOptions>;
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
    let { monaco } = this.props;
    // Set the content on the editor
    await this.setContent();
    if (monaco && editor) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
        this.saveFile();
      });
    }
  }

  public async saveFile() {
    updateFileContent(this.props.path, this.editor.getValue());
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
      if (monaco && !this.editor) {
        this.editor = monaco.editor.create(ref, {
          automaticLayout: true,
          language: this.getLanguage(),
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
    console.log("this.props.path: ", this.props.path);
    if (this.editor) {
      // need to update content
      this.setContent();
    }
    return <div className="monaco-editor-container" ref={this.containerRef} />;
  }

  private getLanguage(): string {
    let extname = path.extname(this.props.path);
    switch (extname.toLowerCase()) {
      case ".js":
        return "javascript";
      case ".json":
        return "json";
      case ".css":
        return "css";
      case ".html":
        return "html";
      case ".map":
        return "json";
      case ".jade":
        return "jade";
      default:
        return "text";
    }
  }

  private async getContent(): Promise<string | null> {
    try {
      // return fs.readFileSync(
      //   path.join(remote.app.getPath("userData"), "soi", this.props.path),
      //   "utf8"
      // );
      return getFileContent(this.props.path);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Sets the content on the editor, including the model and the view state.
   *
   * @private
   * @memberof Editor
   */
  private async setContent() {
    let { monaco } = this.props;

    if (!monaco) {
      monaco = await loadMonaco();
    }

    const value = await this.getContent();
    if (monaco) {
      const model = monaco.editor.createModel(value || "", this.getLanguage());
      model.updateOptions({
        tabSize: 2
      });

      this.editor.setModel(model);
    }
  }
}
