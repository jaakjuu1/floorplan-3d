/// <reference types="vite/client" />

import editorScriptUrl from './legacy/editor.js?url';

const editor = document.createElement('script');
editor.src = editorScriptUrl;
editor.addEventListener('load', () => {
  void import('./legacy/view3d.js').catch(error => console.error('3D-moottorin lataus epäonnistui', error));
}, { once: true });
editor.addEventListener('error', error => console.error('Editorin lataus epäonnistui', error), { once: true });
document.head.append(editor);
