/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';
import { Button } from "antd";

import Explorer from "../../components/Explorer";
import TouchBarManager from "../../components/TouchBarManager";

export default function App() {
  return (
    <div>
        <Explorer />
        <div>
          <div>
            <TouchBarManager />
          </div>
          <div>
            <Button type="primary">Primary</Button>
            <Button>Default</Button>
            <Button type="dashed">Dashed</Button>
            <Button type="danger">Danger</Button>
            <Button type="link">Link</Button>
          </div>
        </div>
      </div>
  );
}
