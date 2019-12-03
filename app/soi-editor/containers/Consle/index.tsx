import React, { useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  MosaicWindow,
  MosaicBranch,
  MosaicContext
} from "react-mosaic-component";

// import { mosaicId } from '../../../interfaces';

export interface ConsoleProps {
  path: Array<MosaicBranch>;
}

function Console(props: ConsoleProps) {
  const context:MosaicContext<any> = useContext(MosaicContext);
  const isConsoleOpen: boolean = useSelector(
    state => state.app.isConsoleOpen
  );

  useEffect(()=>{
    if(context&&context.mosaicActions&&context.mosaicActions.expand){
      console.log('props.path: ', props.path);
      // if(isConsoleOpen){
      //   context.mosaicActions.expand(props.path, 20);
      // }else{
      //   context.mosaicActions.expand(props.path, 0);
      // }
    }
  });

  return (
    <MosaicWindow<number>
      draggable={false}
      title={"Console"}
      path={props.path}
      toolbarControls={[]}
    >
      <div>Console</div>
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
