# V0:n ensimmäinen tekninen osuus

Rajaus 2026-09-29: kanoninen huoneistosopimus ja selainpohja. V0 ei valmistu
kokonaan tässä osuudessa: nykyisen demo-asunnon muunto, semanttisen mallin
kytkentä editoriin, vinot seinät ja vanhan tilan siirto jäävät seuraavaan osaan.
V1:n pohjapiirustustuontia ei toteuteta.

Käyttäjä sallii V0:n etenemisen vaiheen −1 pilottikohteen ja liite-esimerkkien
keskeneräisyydestä huolimatta. Avoimia kohtia ei kuitata; ne tarvitaan ennen
vastaavia kenttä- ja hyväksymistestejä.

## Omistus ja järjestys

- A (Luna): `tmp/rakennuspiirustus-automaatio/`-repon
  `src/rakennuskuva/unit_models.py`, `unit_apply.py`,
  `tools/export_unit_schema.py`, `tests/test_unit*.py` sekä generoitu
  `schemas/unit-input-v1.schema.json`. Vanha project-input-v2 säilyy ennallaan.
- C (Luna): FP:n `tests/e2e/`, `playwright.config.ts`, `tools/serve-static.mjs`,
  `fixtures/unit/`, `fixtures/apply/`, `examples/accessibility-unit.json`,
  `tools/check-contract-sync.mjs` ja testien kuvakaappaukset. C tuottaa ensin
  nykyisen editorin läpäisevän savutestin. Fixturet vasta A:n mallin valmistuttua.
- B (Luna): FP:n `index.html`, `src/legacy/`, `src/main.ts`, `package.json`,
  `package-lock.json`, `tsconfig.json`, `vite.config.ts`. Rakennemuutos vasta C:n
  vihreän alkutestin jälkeen. Ensimmäinen siirto säilyttää vanhan toimintalogiikan.
- Pääagentti: FP:n `src/model/`, `src/io/unit.ts`, generoidut tyypit ja
  skeemakopio, mallin testiajuri, CI, dokumentit, integraatio ja Git molemmissa
  repoissa. Pakettilisäykset sovitaan B:n kanssa, ei rinnakkaisia lockfile-muutoksia.
- Sol: valmiin integraation lukukatselmointi testien jälkeen, ei tiedostomuutoksia.

## Yhteinen sopimus

RK:n nykyisessä `input_models.py`:ssä on Measurement mutta ei huoneistomallia.
Uuden mallin kanoninen määrittely tulee A:n Pydantic-toteutuksesta. TS-tyypit
generoidaan sen skeemasta; käsin ylläpidettyä rinnakkaista tyyppisopimusta ei tehdä.

- `schema_version: "unit-v1"`, koordinaatit millimetreinä, x oikealle ja y ylös.
  Arkkitehtuurin §5:n elementit ja alkuperäkentät ovat lähtökohta. Uusi mittausmalli
  on erillinen vanhasta v2:sta, jonka vapaa method-kenttä säilyy yhteensopivana.
- Mitat ovat Measurement-olioita myös muutosoperaatioissa. Tuntematon tarkkuus
  on null; lähdeviitettä tai kuittaajaa ei keksitä. Piirustus/rekisteri/oletus ei
  kelpaa measured-menetelmäksi. Vanhat menetelmänimet muunnetaan vain tuontirajalla.
- Huoneen monikulmio sisältää lopuksi alkupisteen. Id:t ovat yksilöllisiä koko
  baselinessa; viittaukset tarkistetaan. Tuntemattomat kentät hylätään.
- `apply(baseline, changes)` palauttaa uuden baselinen muuttamatta syötteitä.
  Operaatiot suoritetaan järjestyksessä. Tuntematon kohde, päällekkäinen id ja
  virheellinen lopputila hylätään. Mittausten alkuperä säilyy.
  Puuttuvat valinnaiset kentät säilyvät puuttuvina; baselinen kuusi kokoelmaa
  palautetaan aina listoina. Pythonin JSON-vertailussa käytetään
  `model_dump(mode="json", by_alias=True, exclude_unset=True)`.
- Seitsemän operaatiota: demolish_wall, add_wall, modify_opening,
  remove_threshold, add_fixture, replace_fixture ja change_finish (§5.6).
  Seinän purku poistaa sen aukot sekä niiden kynnykset. Korvaava kaluste säilyttää
  kohteen id:n. Pintamuutos päivittää huoneen floor/walls-kentät.
  Kohdetilasta poistetaan myös poistettuihin elementteihin viittaavat raakamitat;
  alkuperäisen baselinen mittaukset ja niiden alkuperä säilyvät koskemattomina.
- Yhteinen apply-fixture on `{ "baseline": ..., "changes": [...],
  "expected": ... }` tai virhetapauksessa `{ "baseline": ..., "changes": [...],
  "error": true }`. Molemmat testiajurit tarkistavat myös syötteen muuttumattomuuden.
- Validointifixture on `{ "input": ..., "valid": true/false }`.
  C ja A sopivat konkreettiset esimerkit valmiin Pydantic-mallin perusteella.
- TS:n `parseUnit(unknown)` validoi ja palauttaa UnitInputs-arvon;
  `apply(baseline, changes)` noudattaa yllä olevaa sopimusta.
  Koordinaattien näyttömuunnos keskitetään `src/io/unit.ts`:ään.
  Näitä rajapintoja testataan tässä osassa ilman nykyisen editorin tilamallin vaihtoa.

## Todennus

Nykyinen editori ja Vite-versio: oikea Chromium, työpöytä ja 390×844 kosketus,
2D/3D, lisäys, purku, vienti/tuonti sekä vanhan tallennuksen uudelleenavaus.
RK: `uv run pytest -q` ja `uv run python tools/sync_skills.py --check`.
FP: tyyppigeneroinnin tarkistus, TypeScript-tarkistus, yhteiset fixturet,
tuotantokäännös ja Playwright. Kopioiden vertailu ja molempien repojen CI.
