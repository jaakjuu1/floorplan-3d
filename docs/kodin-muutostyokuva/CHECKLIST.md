# Kodin muutostyökuva — toteutuksen tarkistuslista

Arkkitehtuuri ja perustelut: [ARKKITEHTUURI.md](ARKKITEHTUURI.md). Luku- ja
kohtaviittaukset (esim. §5.3) osoittavat sinne.

Merkinnät:
- **[FP]** = `jaakjuu1/floorplan-3d`
- **[RK]** = `jaakjuu1/rakennuspiirustus-automaatio` (`rakennuskuva`)
- **[MOL]** = molemmat
- **[EI-KOODI]** = selvitys, päätös tai yhteydenotto

Jokaisella vaiheella on lopussa *Valmis kun* -ehto. Vaiheeseen ei siirrytä ennen kuin
edellisen ehto täyttyy tai poikkeama on kirjattu.

---

## Vaihe −1: Päätökset ennen koodia

- [x] **[EI-KOODI]** K1: Kenttälaite → **Android-puhelin** (§6.0)
- [x] **[EI-KOODI]** K2: Rakenne → **Vite (+ TypeScript)** (§6.4)
- [x] **[EI-KOODI]** K3: Laser → **ei integraatiota**, lukemat syötetään käsin (§6.0)
- [x] **[EI-KOODI]** Testilaitteeksi valittu Android-puhelin: **Samsung Galaxy
      Z Fold3**, käyttäjän vahvistus 2026-09-29. Poikkeama alkuperäisestä keskitason
      laitteesta kirjattu arkkitehtuurin §6.0:aan. Suorituskyky mitataan V1:ssä
- [ ] **[EI-KOODI]** Pilottiasunto valittu ja asukkaan lupa kartoitukseen saatu
- [x] **[EI-KOODI]** Yksi isännöitsijä ja yksi toimintaterapeutti lupautuneet
      arvioimaan tulosteet (V3); käyttäjän vahvistus 2026-09-29
- [ ] **[EI-KOODI]** Hae 2–3 esimerkkiä oikeista muutostyöilmoituksen liitteistä ja
      asunnonmuutostyöhakemuksista (K5, K6, K7)
- [x] **[EI-KOODI]** Edellisen kohdan osatyö: kolme julkista lomaketta ja niiden
      liitevaatimukset tarkistettu 2026-09-29; [lähteet ja avoimet asiat](LIITE-ESIMERKIT.md).
      Hyväksytyn kohteen piirustusliite ja muutosvärien varmistus puuttuvat,
      joten alkuperäistä esimerkkikohtaa ei ole kuitattu kokonaan

**Valmis kun:** pilottikohde, testipuhelin ja arvioijat sovittu (K1–K3 päätetty).


---

## Vaihe V0: Perusta — yhteinen huoneistomalli

**Etenemispoikkeama 2026-09-29:** käyttäjä sallii V0:n teknisen toteutuksen,
vaikka vaiheen −1 pilottikohteen vahvistus ja liite-esimerkit ovat kesken.
Niitä ei kuitata valmiiksi; ne tarvitaan ennen vastaavia kenttä- ja
hyväksymistestejä. Ensimmäisen teknisen osuuden rajaus ja työnjako:
[V0-SOPIMUS.md](V0-SOPIMUS.md).

**V0:n tekninen valmistumisehto täyttyy:** demo ladataan kanonisesta JSONista,
2D/3D-geometria vastaa lähtöversiota, muutoskerros ja palautettava tallennussiirto
ovat käytössä. RK validoi saman demon. Paikalliset tarkistukset: 41 TypeScript-
testiä, 109 Python-testiä ja 6 Chromium-testiä (työpöytä ja 390×844-kosketus).
Testipuhelimella tehtävä kenttä- ja suorituskykytesti kuuluu edelleen V1:een.
CI:n WebGL-selainkokeet ajetaan yksi kerrallaan ja 300 sekunnin tapausrajalla;
ensimmäinen rinnakkainen ajo ylitti 120 sekunnin rajan. Paikallinen raja on 120 s.

### Skeema (§5)
- [x] **[RK]** Uusi moduuli `src/rakennuskuva/unit_models.py`: `UnitInputs`,
      `Wall`, `Opening`, `Room`, `Fixture`, `Threshold`, `RawMeasurement`,
      `ChangeOp`, `SurveyInfo` + `Consent`
- [x] **[RK]** `Measurement`-malliin `method`-luettelo (§5.3), `captured_at`,
      `device`. Vanhan vapaan tekstin kuvaus luetteloon tuonnissa, nykyinen
      `project-input-v2` ei rikkoudu
- [x] **[RK]** Validoinnit: yksilölliset id:t, `host_wall`-viittaukset,
      monikulmioiden sulkeutuminen, `Threshold` sidottu aukkoon tai huonerajaan
- [x] **[RK]** `Wall.kind = load_bearing` vaatii `source_refs`-lähteen, joka ei ole
      `assumption` (§16, kantavuusriski)
- [x] **[RK]** Ei kenttää terveystiedolle. Käyttäjäkohtaiset vaatimukset vain
      numeroina (`user.*`) (§10)
- [x] **[RK]** Skeemavienti `schemas/unit-input-v1.schema.json`
- [x] **[RK]** Testit: kelvollinen ja virheelliset esimerkkimallit

### Esimerkkidata
- [x] **[FP]** Nykyinen kovakoodattu demo-asunto (`ROOMS`, `WALLS`, `WINS`, `DOORS`,
      `SLIDES`, `index.html:399–462`) muunnetaan `examples/demo-unit.json`-tiedostoksi
      skeeman mukaiseksi. Status `assumed`, menetelmä `archive_drawing`
- [x] **[RK]** Sama tiedosto `rakennuskuva`n testiaineistoksi.
      `rk unit validate --input examples/demo-unit.json` tarkistaa mallin ja muutokset;
      sama demo kuuluu sopimuskopioiden synkronointiin. Geometria verrataan
      FP:n 697d6ca-version aineistoon; kaikki demomitat pysyvät oletuksina.
- [x] **[MOL]** Pieni esteettömyysesimerkki: kerrostalokylpyhuone + eteinen, jossa
      kynnys ja kapea ovi

### floorplan-3d lukee mallin
- [x] **[FP]** Playwright-savutesti *ennen* muutoksia: lataus, 2D-näkymä, 3D-näkymä,
      kalusteen lisäys, seinän purku, JSON-vienti (§12.2)
- [x] **[FP]** Siirto Viteen *sellaisenaan*: `package.json`, Vite + TypeScript,
      Three.js npm-paketista CDN:n sijaan, sama toiminnallisuus. Savutesti vihreänä
- [x] **[FP]** Jako hakemistoihin: `src/model/`, `src/plan2d/`, `src/view3d/`,
      `src/io/` (§6.4). Savutesti vihreänä jaon jälkeen
- [x] **[FP]** Skeeman TypeScript-tyypit generoidaan `unit-input-v1.schema.json`-
      tiedostosta (generointi osana käännöstä tai CI-tarkistus)
- [x] **[FP]** CI: tyyppitarkistus, testit (esim. Vitest) ja Playwright-savutesti
- [x] **[FP]** README päivitetty: `npm install`, `npm run dev`, `npm run build`
- [x] **[FP]** `src/io/unit.ts`: tuonti ja vienti. y-akselin kääntö vain tässä (§5.2)
      Editorin JSON-tuonti ja renderöintiadapteri käyttävät samaa rajapintaa
- [x] **[FP]** Keskilinjaseinät (`a`, `b`, `thickness`) → nykyinen 2D- ja
      3D-renderöinti. Vinot seinät vähintään piirtyvät oikein
- [x] **[FP]** Aukot `host_wall` + `along_wall` -mallista → nykyiset ikkuna-, ovi- ja
      liukuovirakenteet
- [x] **[FP]** Kovakoodatut rakennegeometrian vakiot poistettu. Demo ladataan
      `examples/demo-unit.json`sta; kalustekirjasto ja demoasettelun esitysasetukset säilyvät
- [x] **[FP]** Nykyinen `state.demolished` korvataan muutoskerroksella
      (`changes[]`, op `demolish_wall`). Vanhan `localStorage`-tilan siirto
      (`huxing-design-v1`)
- [x] **[FP]** Kalusteet ja lattiamateriaalit toimivat kuten ennen.
      Selainregressio kattaa myös mittaukset, kumoa/tee uudelleen, JSON/PNG-viennin,
      tuonnin, tallennuksen uudelleenavauksen, kävelytilan ja kosketuskäytön.
      Vinon seinän aukko ja 3D-suunta tarkistetaan toteutuneesta geometriasta.
      Sol-katselmoinnin kaksi P2-löydöstä korjattu: aukon positiivisen `sill_z`:n
      törmäysalue ja tyhjän mallin oletusrajaus. Selainregressio tarkistaa molemmat.

### Muutoskerros (§5.6)
- [x] **[RK]** `apply(baseline, changes)` Pythonissa
- [x] **[FP]** `apply(baseline, changes)` JS:ssä
- [x] **[MOL]** Yhteiset testitapaukset `fixtures/apply/*.json` (syöte + odotettu
      tulos) ja niiden ajo molempien CI:ssä
- [x] **[MOL]** Skeeman ja testitapausten kopioiden synkronointitarkistus CI:hin
      (vrt. `tools/sync_skills.py --check`)

**Valmis kun:** demo-asunto latautuu JSONista ja näyttää samalta kuin ennen, savutesti
ja `apply`-testit ovat vihreitä molemmissa repoissa, ja `rk` validoi saman tiedoston.

---

## Vaihe V1: Kenttäkartoitus laserilla

**Etenemispoikkeama 2026-09-30:** käyttäjä sallii rajatun V1.1:n teknisen
toteutuksen, vaikka pilottikohde ja liite-esimerkit ovat kesken. V1.1:n
[rajapinnat ja tallennusmuoto](V1.1-SOPIMUS.md) on dokumentoitu.
Kenttätestejä, PWA/offline-kokonaisuutta ja koko V1:tä ei kuitata valmiiksi.

### Kartoitustila (§6.1)
- [ ] **[FP]** Uusi tila "Kartoitus" editorin rinnalle, suunniteltu ensin
      Android-puhelimen pystynäytölle ja yhden käden käyttöön (§6.0)
- [ ] **[FP]** Projektin aloitus: osoite, huoneisto, profiilit, suostumukset
      (`survey.consent`, oletus: ei videota) (§5.7)
- [ ] **[FP]** Huoneen muotopohjat: suorakaide, L-muoto, vapaa monikulmio
- [ ] **[FP]** Seinä kerrallaan -eteneminen myötäpäivään, aktiivinen seinä korostettu
- [ ] **[FP]** Aukot seinittäin: etäisyys nurkasta, leveys, korkeus, kynnys; oville
      karmiaukko ja vapaa kulkuleveys erikseen
- [ ] **[FP]** Seuraava huone liittyy edelliseen yhteisen seinän tai oviaukon kautta
- [ ] **[FP]** Mittojen syöttö myös jälkikäteen paperilta (sama työnkulku)
- [ ] **[FP]** Raakamittaukset tallentuvat `measurements[]`-listaan alkuperineen,
      kartoittaja kuittaajana
- [ ] **[FP]** Valokuva elementtiin (vain jos `consent.photos` sallii) →
      `source_refs`
- [ ] **[FP]** Nykytilan lukitus ja kartoittajan kuittaus

### Pohjapiirustus lähtöaineistona (§6.5)
- [x] **[FP]** V1.1: PDF:n sivun tai PNG/JPEG-kuvan paikallinen tuonti 2D-taustaksi,
      monisivuisen PDF:n esikatselu ja sivuvalinta. Alkuperäiset tavut, sivuvalinta
      ja lähdetiedot säilyvät tallennuksessa ja JSON-viennissä. Yksi aktiivinen liite
- [ ] **[FP]** Edellisen kohdan jatko: koko sovelluksen saatavuus offline-tilassa
      (PWA ja projektivarasto, §6.3)
- [x] **[FP]** V1.1: siirto, kierto, läpinäkyvyys, näkyvyys ja kohdistuksen lukitus;
      kahden lähdepisteen millimetrikalibrointi, inferred/archive_drawing ja
      liite-/sivuviite. Malli, baseline ja mittojen statukset säilyvät muuttumattomina.
      Liitteen vaihto ja sivun vaihto nollaavat kalibroinnin; kumoa/tee uudelleen toimii
- [ ] **[FP]** Huoneiden, seinien ja aukkojen jäljentäminen sekä piirustuksen
      mittojen käsisyöttö samaan huoneistomalliin; päivittyvä 2D/3D-esikatselu
- [x] **[FP]** Edellisen kohdan V1.2-osuus: kalibroidulta pohjakuvalta seinäketju
      ja suljettu huonepolygoni suoraan `baseline`en (ei `add_wall`-muutosta).
      Koordinaatit ja piirustuksesta luettu seinäpaksuus `inferred` /
      `archive_drawing`, `confidence_mm: null`, viite `attachment:<SHA-256>/page:<n>`.
      Osoitinluonnos ei tallennu; irrotettu malliehdokas validoidaan ja yksi
      hyväksytty seinä/huone on yksi kumottava vaihe. 53 TypeScript- ja 10
      Chromium-testiä (työpöytä ja 390×844-kosketus). Aukot 2026-10-03: kaksi
      napautusta merkitsevät reunat, isäntäseinä päätellään lähimmästä nykytilan
      seinästä, `along_wall`/`width` ja valinnainen vapaa leveys piirustuksesta,
      päällekkäiset aukot hylätään. Piirustusmittojen käsisyöttö, snap ja
      panorointi jäljentäessä puuttuvat
- [ ] **[MOL]** Piirustusmitat `inferred` / `archive_drawing`, lähdeviite
      tiedostoon ja sivuun; tuntematon tarkkuus säilyy puuttuvana. Kenttämittaus
      korvaa arvon alkuperäketjun säilyttäen, hyväksyntä ei muuta statusta
- [ ] **[FP]** Playwright-testit myös 390×844-kosketusnäkymässä: PDF/kuva →
      kalibrointi → huone ja aukko → 2D/3D → kenttämitta → tallennus ja avaus
      offline-tilassa; piirustuksen muut mitat eivät muutu `measured`-tilaan
- [x] **[FP]** Edellisen kohdan V1.1-osuus: PDF/kuva → sivuvalinta → kalibrointi
      → kohdistus → 2D/3D → tallennus, avaus ja JSON-kierros. V0-regressiot,
      virhetilanteet, historian toiminta ja vanhan latauksen kilpailutilanteet
      tarkistettu työpöydällä ja aidoin kosketustapahtumin 390×844-näkymässä.
      50 TypeScript- ja 8 Chromium-testiä läpäisi; RK:n 109 testiä ja 31
      sopimuskopiota säilyvät vihreinä.
- [x] **[FP]** V1.1:n Sol-lukukatselmointi: kolme P2- ja yksi P3-löydös korjattu
      ja tarkistettu uudelleen selaimessa. Pääagentti katsoi tallennetut puhelinkuvat.
      [Tarkistukset, löydökset ja kuvat](V1.1-TOIMITUS.md)

### Geometria (§5.5)
- [ ] **[FP]** Raakamittaukset + luonnos → seinien koordinaatit
- [ ] **[FP]** Sulkeutumistarkistus huoneittain. Poikkeama näkyy ja pyytää
      uusintamittausta raja-arvon ylittyessä
- [ ] **[FP]** Lävistäjätarkistus ja kulmakorjaus
- [ ] **[FP]** Huoneiden liitos yhteisten seinien ja aukkojen kautta, seinäpaksuus
      aukon kohdalta
- [ ] **[FP]** Johdettujen arvojen status = heikoin lähde (`derived`)
- [ ] **[RK]** Sama geometrialaskenta tai sen tarkistus Pythonissa (QA)

### Mittojen syöttö (§6.2)
- [ ] **[FP]** Iso numeronäppäimistö, oletusyksikkö mm; `3,42` tulkitaan metreiksi
      (3420 mm)
- [ ] **[FP]** "Seuraava" siirtää suoraan seuraavaan puuttuvaan mittaan
- [ ] **[FP]** Menetelmä (`laser` / `tape`) muistetaan, vaihto yhdellä
      napautuksella; kynnyksille oletuksena `tape`
- [ ] **[FP]** Epäuskottavan arvon vahvistus (väärä yksikkö, liian suuri tai pieni)
- [ ] **[FP]** Jokainen syöte tallentuu heti; kumoa toimii
- [ ] **[FP]** Vapaa laitekenttä (`device`) kartoitukselle, ei pakollinen

### Reaaliaikainen esikatselu (§6.0)
- [ ] **[FP]** Jokainen syötetty mitta päivittää 2D-pohjan heti
- [ ] **[FP]** 3D-esikatselu päivittyy mittausten aikana (vaihdettavissa 2D:n kanssa
      yhdellä napautuksella)
- [ ] **[FP]** Puuttuvat mitat näkyvät pohjassa (esim. katkoviiva + arvioitu pituus)
- [ ] **[FP]** Suorituskyky testipuhelimella: esikatselu päivittyy alle 200 ms:ssa
      mitan syötöstä

### Offline (§6.3)
- [ ] **[FP]** PWA Viten PWA-lisäosalla: manifest, Service Worker, sovellus ja
      Three.js välimuistissa; asennettavissa Androidin aloitusnäytölle
- [ ] **[FP]** Projektit IndexedDB:ssä (ei pelkkä `localStorage`)
- [ ] **[FP]** Projektin vienti tiedostona ja jakaminen Androidin jakovalikon
      kautta (MVP-synkronointi)

### Kenttätesti (§12.1)
- [ ] **[EI-KOODI]** Referenssimitat pilottiasunnosta (≥ 20 kpl, kaksi mittaajaa)
- [ ] **[EI-KOODI]** Kartoitus sovelluksella, aika huoneittain kirjattu
- [ ] **[EI-KOODI]** Poikkeamataulukko: sovellus vs. referenssi
- [ ] **[EI-KOODI]** Havainnot ja korjaukset kirjattu

**Valmis kun:** pilottiasunto kartoitettu. Oviaukot ≤ 5 mm ja seinät ≤ 10 mm
referenssistä. Kaksio ≤ 60 min, tai poikkeama selitetty ja korjaussuunnitelma
kirjattu. Myös pohjapiirustuksesta aloituksen selainpolku (§6.5) läpäisty.

---

## Vaihe V2: Sääntömoottori ja pyörätuolisimulaatio

### Säännöt (§7)
- [x] **[FP]** Ohjeellinen esikatseluarvioija 2026-10-03: `rules/rules-v1.json`
      (10 sääntöä, lähteet Finlexistä) ja `src/model/rules.ts`. Säännöt näkyvät,
      kun muutos tai valinta koskee niitä, eivätkä estä muokkausta (käyttäjän päätös).
      Vapaa ympyrä ja wc:n sivutila lasketaan geometriasta. [Säännöt](SAANNOT.md)
- [ ] **[MOL]** Sääntötiedostomuoto (`rules/*.json`) ja sen JSON Schema (§7.2)
- [ ] **[MOL]** `check`-tyypit: `min`, `max`, `range`, `clear_circle`, `clear_rect`,
      `path_width`, `forbidden_change`, `requires_document`
- [ ] **[RK]** Kanoninen arvioija Pythonissa
- [ ] **[FP]** Esikatseluarvioija JS:ssä
- [ ] **[MOL]** Yhteiset sääntötestit `fixtures/rules/*.json` molempien CI:ssä

### Profiili `muutostyo`
- [ ] **[MOL]** Kantavan, huoneistojen välisen tai tyypiltään `assumed`-seinän muutos
      → `block`, vaatii asiantuntijadokumentin
- [ ] **[MOL]** Märkätilan (`Room.kind = wet`) muutos → vaatii
      vedeneristyssuunnitelman ja tarkastuksen (`requires_document`)
- [ ] **[MOL]** Ilmanvaihdon ja hormien kohdat → `warn`
- [ ] **[EI-KOODI]** Sääntölista tarkistettu isännöitsijän kanssa (K5)

### Profiili `esteettomyys`
- [x] **[EI-KOODI]** Viitearvot tarkistettu YM:n asetuksesta 241/2017 ja kirjattu
      lähteineen ([SAANNOT.md](SAANNOT.md), 2026-10-03)
- [x] **[FP]** Muokattavat mitoitusperusteet (`unit.user`, standardin oletukset
      lähteineen) ja kulkureitti (`path_width`, 2D-työkalu) 2026-10-03; käyttäjän
      päätös: ei henkilökohtaisia arvoja. [SAANNOT.md](SAANNOT.md)
- [ ] **[MOL]** Oviaukon vapaa leveys (`min`, käyttäjäkohtainen parametri, tarkkuus
      ≤ 5 mm)
- [ ] **[MOL]** Kynnyskorkeus (`max`, menetelmä `tape`)
- [ ] **[MOL]** Kääntötila valituissa huoneissa (`clear_circle`)
- [ ] **[MOL]** WC-istuimen sivutila (`clear_rect`)
- [ ] **[MOL]** Kulkureitin leveys (`path_width`)
- [ ] **[EI-KOODI]** Sääntölista tarkistettu toimintaterapeutin kanssa (K6)

### Kenttäsovelluksen ohjaus
- [ ] **[FP]** Profiilien `requires` → puuttuvien mittojen lista kartoitustilaan
- [ ] **[FP]** Listan tila näkyy jatkuvasti. Kuittaus estetty, jos `block`-tason
      mittoja puuttuu (ohitus perusteluineen mahdollinen)
- [ ] **[FP]** Mittakohtainen `max_confidence_mm` käytössä
- [ ] **[RK]** Virallisen tulosteen estot käyttävät profiilin mittakohtaisia rajoja
      globaalin 50 mm:n sijaan

### Pyörätuolisimulaatio (§7.4)
- [x] **[FP]** Työpöytäosuus 2026-10-03: 3D-kävely pyörätuolitilassa (törmäyssäde
      pyörätuolin leveydestä, katse 1,2 m) ja 2D-kulkureitti kapeimman kohdan
      raportilla; pituuden huomioiva kääntyminen puuttuu
- [ ] **[FP]** `blocked()` (`src/view3d/view3d.js:1071`) yleistetty: törmäysmuoto parametrina
- [ ] **[FP]** Pyörätuolin mitat käyttäjäkohtaisista parametreista
- [ ] **[FP]** 2D: kääntöympyrät ja kapeikot näkyviin
- [ ] **[FP]** "Aja reitti" -toiminto, kapein kohta raportoidaan
- [ ] **[FP]** Tulos syöttää `clear_circle`- ja `path_width`-sääntöjä
- [ ] **[FP]** Kuvakaappaus tallentuu esteettömyysliitettä varten

### Muutoksen suunnittelu
- [ ] **[FP]** Muutosoperaatiot käyttöliittymässä: purku, uusi seinä, aukon muutos,
      kynnyksen poisto, kiintokalusteen lisäys ja vaihto, pintamateriaali
- [x] **[FP]** Edellisen kohdan työpöytäosuus 2026-10-03: `src/model/edit.ts`
      kaikille seitsemälle operaatiolle; 3D:n elementtiobjektit metodeineen;
      seinän, aukon ja kiintokalusteen valinta 2D:ssä ja 3D:ssä; paneelista purku ja
      palautus, aukon karmi- ja vapaa leveys, kynnyksen poisto ja kalusteen vaihto;
      muutoslista ja yksittäinen peruminen; keltainen purku ja punainen uusi/muutettu.
      2D-työkalut "Uusi seinä" (W: ketjutus, kiinnitys seinien päihin ja
      keskilinjoihin, Shift vaaka/pysty) ja "Kiintokaluste" (K: seinän lähellä
      seinää vasten ja sen suuntaisesti, esim. tukikahva). Kiintokalusteen siirto
      vetämällä 2D:ssä ja 3D:ssä, nuolinäppäimillä, R-kierrolla ja paneelista;
      siirrot päivittävät kalusteen yhtä muutosta (`moveFixture`). Puhelinkäyttöä ei ole testattu
- [ ] **[FP]** Nykytila / muutos -vaihto 2D:ssä ja 3D:ssä
- [ ] **[FP]** Muutosvärit 2D-näkymässä (K7:n mukaisesti)

**Valmis kun:** molemmat profiilit toimivat pilottiasunnossa. Kenttäsovellus ohjaa
mittaamaan oikeat asiat. Sääntötestit vihreinä molemmissa repoissa.

---

## Vaihe V3: Tulosteet

- [ ] **[RK]** Huoneistotason renderöijä (ei riippuvuutta esimerkkiprojektin
      `architectural_model`-moduulista, vrt. `cli.py: _ensure_semantic_path`)
- [ ] **[RK]** Muutoskuva A3 1:50: nykytila + muutos väreineen, mitat, huonenimet,
      märkätilarajat, nimiö
- [ ] **[RK]** Työselostus operaatiolistasta
- [ ] **[RK]** Esteettömyysliite: nykytila vs. muutos, kääntöympyrät, vapaat
      leveydet, sääntöjen tulokset, 3D-kuvat floorplan-3d:stä
- [ ] **[RK]** Määräluettelo: pinta-alat aukot vähennettyinä, purettavat
      seinämetrit, laatoitus-m², vedeneristys-m²
- [ ] **[MOL]** Kustannusarvio: floorplan-3d:n nykyinen hinnoittelu (`MATS`)
      laajennettuna työ- ja materiaalihinnoilla + kotitalousvähennysarvio
- [ ] **[RK]** Mittausraportti: jokainen kriittinen mitta alkuperineen
- [ ] **[RK]** QA-JSON jokaiselle uudelle arkille, luonnosmerkintä ja estolista
- [ ] **[RK]** CLI: `rk unit validate | change-plan | accessibility | quantities | all`
- [ ] **[RK]** Testit uusille arkeille nykyisen QA-mallin mukaisesti
- [ ] **[EI-KOODI]** Isännöitsijä arvioi muutoskuvan ja työselostuksen
- [ ] **[EI-KOODI]** Toimintaterapeutti arvioi esteettömyysliitteen
- [ ] **[MOL]** Arvioiden korjaukset tehty

**Valmis kun:** pilottikohteesta syntyvät kaikki tulosteet yhdellä komennolla, ja
molemmat arvioijat pitävät niitä käyttökelpoisina (tai korjauslista on tehty).

---

## Vaihe V4: Jakaminen, roolit ja tietosuoja

### Tietosuoja (§10) — ennen palvelinta
- [ ] **[EI-KOODI]** Tietosuojan vaikutustenarviointi (DPIA)
- [ ] **[EI-KOODI]** Rekisteriseloste ja tietosuojaseloste
- [ ] **[EI-KOODI]** Käsittelijäsopimuspohjat (isännöitsijä, hyvinvointialue,
      urakoitsija)
- [ ] **[EI-KOODI]** Tarkistettu, ettei malliin päädy terveystietoja

### Palvelin (§9.2)
- [ ] **[MOL]** Projektivarasto: revisiot, liitteet, tulosteet revisioon sidottuina
- [ ] **[MOL]** Roolit ja oikeudet (asukas, kartoittaja, toimintaterapeutti,
      suunnittelija, isännöitsijä, urakoitsija)
- [ ] **[MOL]** Suostumusten anto ja peruutus. Peruutus poistaa aineiston
- [ ] **[MOL]** Säilytysaikojen automaattinen poisto (`retention_days`)
- [ ] **[MOL]** Salaus siirrossa ja levossa, pääsyloki
- [ ] **[FP]** Synkronointi kenttäsovelluksesta palvelimelle (offline-jono)
- [ ] **[EI-KOODI]** K8: `rakennuskuva`n ajopaikka tuotannossa päätetty

### Jaettu katselu (C7)
- [ ] **[FP]** Vain luku -tila: nykytila/muutos-vaihto, mitat, sääntöjen tulokset
- [ ] **[FP]** Aikarajatut, roolikohtaiset jakolinkit
- [ ] **[FP]** Urakoitsijan näkymässä ei henkilötietoja
- [ ] **[FP]** Kommentointi (isännöitsijä, terapeutti)

**Valmis kun:** kolme oikeaa kohdetta on kulkenut koko ketjun läpi, ja DPIA on tehty.

---

## Vaihe V5: Video (valinnainen, vain suostumuksella)

- [ ] **[EI-KOODI]** DPIA päivitetty videon osalta
- [ ] **[FP]** Videotallennus käynnistyy vain, kun `consent.video = true`
- [ ] **[MOL]** Kasvojen ja paperien automaattinen sumennus ennen tallennusta
- [ ] **[MOL]** Stillkuvien poiminta elementeittäin → `source_refs`
- [ ] **[MOL]** Videosta johdettu lisägeometria statuksella `inferred`, menetelmällä
      `video`. Ei koskaan korvaa laser-mittaa
- [ ] **[MOL]** Video poistetaan säilytysajan jälkeen, vain stillkuvat jäävät
- [ ] **[EI-KOODI]** Vertailu: video vs. laser pilottiasunnossa, poikkeamataulukko
- [ ] **[EI-KOODI]** Päätös: mihin videota käytetään jatkossa (havainnollistus,
      kiintokalusteet, ei-kriittiset mitat)

**Valmis kun:** videoaineisto poistuu automaattisesti, ja poikkeamat laserista on
raportoitu.

---

## Vaihe V6: Ulkoiset tietolähteet (§11)

- [ ] **[EI-KOODI]** MML:n API-avain ja käyttöehdot (avoin data, CC BY 4.0,
      lähdemaininta)
- [ ] **[MOL]** MML-adapteri: osoite → kiinteistö, kiinteistöjaotus, rakennusten
      pohjamuodot. Menetelmä `registry`, status `inferred`
- [ ] **[EI-KOODI]** HTJ: käyttöoikeudet ja rajapinta selvitetty
- [ ] **[EI-KOODI]** Rakennus- ja huoneistotiedot (DVV / Ryhti): käyttöoikeudet ja
      siirtymä selvitetty
- [ ] **[EI-KOODI]** Pilottikunnan piirustusarkisto: saatavuus ja hinta
- [ ] **[MOL]** Arkistopalvelusta haetun piirustuksen kytkentä V1:n
      pohjapiirustustuontiin (`archive_drawing`); käyttäjän oman tiedoston
      tuonti toteutetaan jo V1:ssä (§6.5)
- [ ] **[MOL]** Rakennusvuosi → haitta-ainekartoituksen tarpeen liputus
      muutostyöprofiilissa
- [ ] **[MOL]** Mikään ulkoinen tieto ei nouse `measured`-tilaan ilman
      kenttämittausta (testi)

**Valmis kun:** vähintään yksi ulkoinen lähde on tuotannossa ja sen tiedot näkyvät
mallissa oikealla alkuperällä.

---

## Jatkuvat tehtävät (kaikissa vaiheissa)

- [ ] Arkkitehtuuridokumentti päivitetty, kun päätös muuttuu (avoimet kysymykset
      luvussa 15 suljetaan päätöksiksi)
- [ ] Skeeman versiointi: muutokset vain uuden version kautta, siirtymä vanhasta
- [ ] Molempien repojen CI vihreänä ennen yhdistämistä
- [ ] Luonnos- ja virallinen-merkintä tarkistettu jokaisesta uudesta tulosteesta
- [ ] Tietosuoja: uusi kenttä → tarkistus, ettei se ole terveys- tai tarpeeton
      henkilötieto
