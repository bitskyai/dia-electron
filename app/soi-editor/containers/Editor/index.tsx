// Credit goes in large part to https://github.com/superRaytin/react-monaco-editor,
// this component is a changed version of it.
import { message } from "antd";
import PubSub from 'pubsub-js';
import _ from 'lodash';
import * as MonacoType from "monaco-editor";
import * as React from "react";
import * as path from "path";
import { loadMonaco } from "../../utils";
import { ipcRendererManager } from "../../ipc";
import { IpcEvents } from "../../../ipc-events";
import { PUBSUB_TOPICS } from '../../utils/constants';

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
    PubSub.unsubscribe(PUBSUB_TOPICS.RE_GET_FILE_CONTENT);
    PubSub.subscribe(PUBSUB_TOPICS.RE_GET_FILE_CONTENT, ()=>{
      this.setContent();
    });
    this.initMonaco();
  }

  public componentWillUnmount() {
    PubSub.unsubscribe(PUBSUB_TOPICS.RE_GET_FILE_CONTENT);
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
    let result = ipcRendererManager.sendSync(
      IpcEvents.SYNC_SOI_UPDATE_FILE_CONTENT,
      {
        filePath: this.props.path,
        fileContent: this.editor.getValue()
      }
    );
    if (result && result.status) {
      message.success("Successfully saved");
    } else {
      message.error("Failed");
    }
    // updateFileContent(this.props.path, this.editor.getValue());
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
          readOnly: this.getReadOnly(),
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
      this.editor.dispose();
    }
  }

  public render() {
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

  private getReadOnly(): boolean {
    let readOnlyFiles = ['package.json', 'src/utils/additionalNodeModules.json'];
    let readonly = false;
    for(let i=0; i< readOnlyFiles.length; i++){
      console.log('readOnlyFiles[i]: ', readOnlyFiles[i]);
      console.log('this.props.path: ', this.props.path);
      if(_.isEqual(readOnlyFiles[i], this.props.path)){
        readonly = true;
        break;
      }
    }
    return readonly;
  }

  private async getContent(): Promise<string | null> {
    try {
      // return getFileContent(this.props.path);
      let result = ipcRendererManager.sendSync(
        IpcEvents.SYNC_SOI_GET_FILE_CONTENT,
        {
          filePath: this.props.path
        }
      );
      if (result && result.status) {
        return result.fileContent;
      } else {
        message.error("Failed");
        return '';
      }
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
      this.editor.updateOptions({
        readOnly: this.getReadOnly()
      })
    }
  }
}
