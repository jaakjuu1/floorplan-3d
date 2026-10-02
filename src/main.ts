/// <reference types="vite/client" />

import demoUnitJson from '../examples/demo-unit.json?raw';
import { loadDesign, parseDesign, saveDesign } from './io/design';
import { parseUnit } from './io/unit';
import { projectUnit } from './model/render-unit';
import { traceOpening, traceRoom, traceWall } from './model/trace';
import * as UnitEdit from './model/edit';
import * as UnitRules from './model/rules';
import type { UnitInputs } from './model/unit-input-v1';
import editorScriptUrl from './plan2d/editor.js?url';
import * as PlanBackground from './io/background';
import * as AttachmentIO from './io/attachment';
import './plan2d/background.js';

declare global {
  interface Window {
    PlanBackground: typeof PlanBackground;
    AttachmentIO: typeof AttachmentIO;
    UnitModel: {
      demoUnit: UnitInputs;
      projectUnit: typeof projectUnit;
      parseDesign: typeof parseDesign;
      loadDesign: typeof loadDesign;
      saveDesign: typeof saveDesign;
      traceWall: typeof traceWall;
      traceRoom: typeof traceRoom;
      traceOpening: typeof traceOpening;
      edit: typeof UnitEdit;
      rules: typeof UnitRules;
    };
  }
}

window.UnitModel = {
  demoUnit: parseUnit(JSON.parse(demoUnitJson)), projectUnit, parseDesign, loadDesign, saveDesign, traceWall, traceRoom, traceOpening, edit: UnitEdit, rules: UnitRules,
};
window.PlanBackground = PlanBackground;
window.AttachmentIO = AttachmentIO;

const editor = document.createElement('script');
editor.src = editorScriptUrl;
editor.addEventListener('load', () => {
  void import('./view3d/view3d.js').catch(error => console.error('3D-moottorin lataus epäonnistui', error));
}, { once: true });
editor.addEventListener('error', error => console.error('Editorin lataus epäonnistui', error), { once: true });
document.head.append(editor);
