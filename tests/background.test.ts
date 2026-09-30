import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBackground, calibrateBackground, attachmentToModel, attachmentToScreen, screenToAttachment,
  validateBackground, MAX_ATTACHMENT_BYTES, type AttachmentSource } from '../src/io/background';
import { parseDesign, saveDesign, loadDesign, DEFAULT_STORE, type Design } from '../src/io/design';
import { readFileSync } from 'node:fs';
import { readUnit } from '../src/io/unit';

const bytes = Buffer.from('%PDF-1.7\nsynthetic');
const source: AttachmentSource = { id: 'a'.repeat(64), name: 'synthetic.pdf', mime: 'application/pdf', size: bytes.length, data: bytes.toString('base64') };
const page = { number: 2, count: 3, width: 600, height: 800, rotation: 90 };
const bg = () => createBackground(source, page, { x: 100, y: 200, w: 6000, h: 8000 });
const near = (a: number, b: number) => assert.ok(Math.abs(a-b) < 1e-8, `${a} != ${b}`);
const defaults: Design = { schema_version: DEFAULT_STORE, unit: readUnit(readFileSync(new URL('../examples/demo-unit.json', import.meta.url),'utf8')), furniture: [], rooms: {}, measures: [] };

test('calibration uses source coordinates, keeps its first model anchor and never mutates its input', () => {
  const original=bg(); original.transform.rotation=37;
  const before=structuredClone(original), a={x:100,y:200}, b={x:400,y:600};
  const anchor=attachmentToModel(a,original), next=calibrateBackground(original,a,b,2500);
  assert.equal(next.transform.mmPerUnit,5);
  near(attachmentToModel(a,next).x,anchor.x); near(attachmentToModel(a,next).y,anchor.y);
  const end=attachmentToModel(b,next); near(Math.hypot(end.x-anchor.x,end.y-anchor.y),2500);
  assert.deepEqual(original,before);
  assert.deepEqual(next.calibration,{a,b,value_mm:2500,status:'inferred',method:'archive_drawing',source_refs:[`attachment:${source.id}/page:2`]});
  validateBackground(next);
});

test('coordinate roundtrips at all rotations and display zooms without render pixel dependence', () => {
  for (const angle of [-270,-37,0,90,180,359]) {
    const current=bg(); current.transform.rotation=angle; const p={x:123,y:456};
    const screen=attachmentToScreen(p,current);
    for (const zoom of [.012,.05,1,2]) {
      const css={x:(screen.x-123)*zoom,y:(screen.y+456)*zoom};
      const recovered=screenToAttachment({x:css.x/zoom+123,y:css.y/zoom-456},current);
      near(recovered.x,p.x); near(recovered.y,p.y);
    }
  }
});

test('invalid calibration and inconsistent source/provenance/scale are rejected', () => {
  for (const distance of [0,-1,NaN,Infinity]) assert.throws(()=>calibrateBackground(bg(),{x:0,y:0},{x:100,y:0},distance));
  assert.throws(()=>calibrateBackground(bg(),{x:0,y:0},{x:0,y:0},100));
  assert.throws(()=>calibrateBackground(bg(),{x:-1,y:0},{x:100,y:0},100));
  assert.throws(()=>calibrateBackground(bg(),{x:NaN,y:0},{x:100,y:0},100));
  const calibrated=calibrateBackground(bg(),{x:0,y:0},{x:100,y:0},1000);
  const invalids=[
    {...calibrated,transform:{...calibrated.transform,mmPerUnit:11}},
    {...calibrated,calibration:{...calibrated.calibration,status:'measured'}},
    {...calibrated,page:{...page,number:1}},
    {...calibrated,source:{...source,size:MAX_ATTACHMENT_BYTES+1}},
    {...calibrated,source:{...source,data:'javascript:alert(1)'}},
    {...calibrated,opacity:NaN}, {...calibrated,locked:'yes'},
    {...calibrated,transform:{...calibrated.transform,x:Infinity}},
  ];
  for (const invalid of invalids) assert.throws(()=>validateBackground(invalid));
});

test('background survives JSON, storage and reopening without changing canonical data; old v2 remains valid', () => {
  const design=parseDesign({...defaults,background:calibrateBackground(bg(),{x:10,y:20},{x:310,y:420},2500)},defaults);
  const values=new Map<string,string>();
  const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
  saveDesign(storage,design);
  assert.deepEqual(loadDesign(storage,defaults),design);
  assert.deepEqual(design.unit,defaults.unit);
  assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(design)),defaults),design);
  assert.equal(parseDesign(defaults,defaults).background,undefined);
  const prior=storage.getItem(DEFAULT_STORE);
  storage.setItem=()=>{throw new Error('quota');};
  assert.throws(()=>saveDesign(storage,{...design,background:null}),/quota/);
  assert.equal(storage.getItem(DEFAULT_STORE),prior);
});
