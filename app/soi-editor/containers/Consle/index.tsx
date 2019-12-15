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

  const logs: Array<any> = useSelector(state => state.app.logs||[]);

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
                    $set: initialState.mosaicNodes.second.splitPercentage
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

  return (
    <MosaicWindow<number>
      draggable={false}
      title={"Console"}
      path={props.path}
      toolbarControls={[]}
    >
      <div>
        {logs.map(log => {
          return (
            <p key={log.timestamp+Math.random()*1000}>
              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span>{log.text}</span>
            </p>
          );
        })}
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
