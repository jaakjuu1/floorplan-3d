/** Display-only details inherited from the original demo, not surveyed model data. */
export const demoRoomPresentation: Record<string, { at?: [number, number]; counted?: boolean }> = {
  master: { at: [8435, -2420] }, mbath: { at: [5980, -1780] }, kid: { at: [3380, -2330] },
  gbath: { at: [3760, -4620] }, laundry: { at: [1250, -4330] }, child: { at: [8850, -4850] },
  kitchen: { at: [1300, -6500] }, dining: { at: [3900, -5520] }, hall: { at: [5450, -4450] },
  living: { at: [7600, -7560] }, balcony: { at: [11180, -9450] },
  bay1: { counted: false }, bay2: { counted: false },
};

export const demoLowWallIds = new Set(['w30']);

export const demoOpeningPresentation: Record<string, {
  name?: string; hinge?: 'start' | 'end'; hingeSide?: -1 | 1; closeAlong?: -1 | 1; openNormal?: -1 | 1;
  entry?: boolean;
}> = {
  'door-0': { name: 'Lastenhuoneen ovi', hinge: 'end', hingeSide: 1, closeAlong: -1, openNormal: 1 },
  'door-1': { name: 'Päämakuuhuoneen ovi', hinge: 'end', hingeSide: -1, closeAlong: -1, openNormal: -1 },
  'door-2': { name: 'Pääkylpyhuoneen ovi', hinge: 'start', hingeSide: 1, closeAlong: 1, openNormal: 1 },
  'door-3': { name: 'Vieraskylpyhuoneen ovi', hinge: 'end', hingeSide: 1, closeAlong: -1, openNormal: 1 },
  'door-4': { name: 'Nuortenhuoneen ovi', hinge: 'end', hingeSide: -1, closeAlong: -1, openNormal: -1 },
  'door-5': { name: 'Ulko-ovi', hinge: 'end', hingeSide: -1, closeAlong: -1, openNormal: -1, entry: true },
};
