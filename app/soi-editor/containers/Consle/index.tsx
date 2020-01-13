import React, { useContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  MosaicWindow,
  MosaicBranch,
  MosaicContext,
  MosaicNode
} from "react-mosaic-component";
import { responsedToConsole } from "../App/actions";
import { initialState } from "../App/reducer";
import { LogItem } from "../../../interfaces";

// import { mosaicId } from '../../../interfaces';

export interface ConsoleProps {
  path: Array<MosaicBranch>;
}

function Console(props: ConsoleProps) {
  const dispatch = useDispatch();
  const context: MosaicContext<any> = useContext(MosaicContext);
  const isConsoleOpen: boolean = useSelector(state => state.app.isConsoleOpen);
  const waitingConsoleToResponse: boolean = useSelector(
    state => state.app.waitingConsoleToResponse
  );
  const mosaicNodes: MosaicNode<number | string> | null = useSelector(
    state => state.app.mosaicNodes
  );

  const logs: Array<LogItem> = useSelector(state => {
    return state.app.logs || [];
  });

  const renderTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderLog = (log: LogItem, index: number) => {
    const ts = renderTimestamp(log.timestamp);
    const timestamp = <span className="timestamp">{ts}</span>;
    const lines = log.text.split(/\r?\n/);
    return lines.map((text, lineIndex) => (
      <p key={`${log.timestamp}--${index}--${lineIndex}`}>
        {timestamp}
        {text}
      </p>
    ));
  };

  useEffect(() => {
    if (context && context.mosaicActions && context.mosaicActions.updateTree) {
      if (waitingConsoleToResponse) {
        if (isConsoleOpen) {
          context.mosaicActions.updateTree([
            {
              path: [],
              spec: {
                splitPercentage: {
                  $set: mosaicNodes && mosaicNodes.splitPercentage
                },
                second: {
                  first: {},
                  splitPercentage: {
                    // $set: initialState.mosaicNodes.second.splitPercentage
                    $set: 70
                  }
                }
              }
            }
          ]);
        } else {
          // context.mosaicActions.hide(["second", "second"]);
          context.mosaicActions.updateTree([
            {
              path: [],
              spec: {
                splitPercentage: {
                  $set: mosaicNodes && mosaicNodes.splitPercentage
                },
                second: {
                  first: {},
                  splitPercentage: {
                    $set: 100
                  }
                }
              }
            }
          ]);
        }
        dispatch(responsedToConsole());
      }
    }
  });

  const lines = logs.slice(0, 1000).map(renderLog);

  return (
    <MosaicWindow<number>
      draggable={false}
      title={"Console"}
      path={props.path}
      toolbarControls={[]}
    >
      <div className="output">
        <div className="log-container">{lines}</div>
      </div>
    </MosaicWindow>
  );
}

// export class Console extends React.Component<ConsoleProps, {}> {
//   public render(): JSX.Element | null {
//     return (
//       <MosaicWindow<number>
//         draggable={false}
//         title={"Console"}
//         path={this.props.path}
//         toolbarControls={[]}
//       >
//         <div>Console</div>
//       </MosaicWindow>
//     );
//   }
// }

export default Console;
