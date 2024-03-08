import React from 'react';
import { createRoot } from 'react-dom/client';
import ShowCase from "./components/ShowCase";

const selector = '#root';
(async () => {
  const domElement = document.querySelector(selector);

  if (!domElement) {
    throw new Error(`No DOM element '${selector}' found!`);
  }

  const rootElement = createRoot(domElement);
  rootElement.render(
    <React.StrictMode>
      <ShowCase />
    </React.StrictMode>
  );
})();
