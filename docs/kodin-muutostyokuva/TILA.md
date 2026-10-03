# Tilannekatsaus ja kokeiluohje

Tila 2026-10-03, haara `claude/gracious-franklin-kg3pr1`. Ensisijainen
käyttöympäristö on työpöytäselain (käyttäjän päätös); puhelinta ei ole testattu
uusille muokkaustoiminnoille.

## Mitä on valmiina

| Vaihe | Sisältö | Lisätiedot |
|---|---|---|
| V0 | Kanoninen `unit-v1`-malli, `baseline + changes`, `apply`, 2D/3D samasta mallista, palautettava tallennussiirto | [V0-SOPIMUS.md](V0-SOPIMUS.md) |
| V1.1 | Pohjakuvan tuonti (PDF/PNG/JPEG), kohdistus ja kahden pisteen kalibrointi | [V1.1-TOIMITUS.md](V1.1-TOIMITUS.md) |
| V1.2 | Seinäketjujen, ovien/ikkunoiden ja huoneiden jäljentäminen nykytilaan lähdeviitteineen | ARKKITEHTUURI §6.5 |
| Muutoskerros | Seinän purku/palautus, uusi seinä, aukon muutos, kynnyksen poisto, lattia, kiintokalusteen lisäys, vaihto ja siirto; muutoslista; 3D-elementtiobjektit metodeineen | ARKKITEHTUURI §5.6 |
| V2 (osa) | Ohjeelliset säännöt virallisine lähteineen, muokattavat mitoitusperusteet, vapaa ympyrä, wc:n sivutila, kulkureitti, pyörätuolikävely 3D:ssä | [SAANNOT.md](SAANNOT.md) |

Arvioita: [FLOORPLAN-ARVIO.md](FLOORPLAN-ARVIO.md) (juancuiule/floorplan).
Pascal-editorin (pascalorg/editor) arvio on käyty keskustelussa: ei pohjaksi,
koska siitä puuttuvat muutoskerros ja mittakohtainen alkuperä.

## Kokeile 10 minuutissa

```bash
npm install
npm run dev
```

1. **Tuo esimerkki.** Tiedosto → Tuo JSON → `examples/accessibility-unit.json`
   (eteinen, kylpyhuone, kapea ovi ja kynnys). Paina `F`.
2. **Valitse ovi.** Napsauta kylpyhuoneen ovea 2D:ssä. Paneeli näyttää karmiaukon
   ja vapaan leveyden alkuperineen sekä oven säännöt ✓-merkinnöin.
3. **Tee muutos.** Syötä vapaaksi leveydeksi 700 → Tallenna muutos. Tallennus
   onnistuu; sääntö muuttuu suositukseksi. Palaa yleisnäkymään: Huomiot listaa
   muutostyöilmoituksen, märkätilan, oven ja wc:n sivutilan lähteineen.
4. **Pura ja lisää.** Valitse väliseinä → Merkitse purettavaksi (keltainen).
   `W` piirtää uuden väliseinän (punainen), `K` lisää tukikahvan seinää vasten.
   Vedä wc-istuinta; seinäkiinnitys kääntää sen seinää vasten.
5. **Kulkureitti.** `U`, napsauta eteinen ja kylpyhuone: reitti ja kapein kohta
   piirtyvät. Mitoitusperusteissa oven arvo 900 muuttaa reitin punaiseksi.
6. **3D.** `T` vaihtaa 3D:hen. Napsauta seinää, oven ylitystä tai kalustetta;
   sama paneeli muokkaa. Purettu seinä on keltainen haamu, josta sen voi palauttaa.
   Kävele-tilassa "Pyörätuoli" kävelee pyörätuolin leveydellä.
7. **Kumoa ja vie.** `Ctrl+Z` kumoaa jokaisen muutoksen erikseen. Tiedosto → Vie JSON
   sisältää nykytilan muuttumattomana ja muutokset erillään.

Pohjakuvan jäljentäminen: Ominaisuudet → Pohjakuva → Tuo, avaa lukitus,
kalibroi kaksi pistettä tunnetulla mitalla, sitten "Jäljennä nykytila".
Synteettinen kuva: `fixtures/background/calibration-600x400.png`
(merkit 500 px:n päässä, 4000 mm).

## Tarkistukset

Paikallisesti 2026-10-03 ja CI:ssä jokaisella pushilla:

| Komento | Tulos |
|---|---|
| `npm run types:check` / `npm run typecheck` | läpäisi |
| `npm run test:unit` | 65 testiä läpäisi |
| `npm run build` | läpäisi (Viten varoitus suurista Three.js/PDF.js-lohkoista) |
| `npm run test:e2e -- --workers=1` | 15 läpäisi, 5 ohitettu (työpöytätestit puhelinprojektissa) |

Selaintestit: `background`, `trace` (työpöytä ja 390×844), `legacy-smoke`,
`changes`, `rules` ja `route` (työpöytä). Kuvat: [screenshots/](screenshots/)
(`v13-*`, `v14-*` uusimmat).

## Tunnetut rajoitukset

- Puhelinkäyttö: uudet työkalut eivät mahdu työkalupalkkiin eikä niitä ole testattu.
- Pyörätuoli on ympyräapproksimaatio; pituus ei vaikuta kääntymiseen. 3D-törmäys
  käyttää oven karmileveyttä, 2D-reitti vapaata leveyttä.
- Kulkureitin 900 mm on johdettu oletus, ei säädösarvo.
- Nykytilan lukitus (kartoituksen hyväksyntä) puuttuu: jäljennös voi muuttaa
  nykytilaa myöhemminkin.
- Kantavan, ulko- ja huoneistojen välisen seinän purkueste on työkalun suojaus,
  ei sääntö.
- Seinät ovat nurkissa päällekkäisiä suorakaiteita (ei viistettyjä liitoksia).
- Kenttäkartoitus (V1), RK:n Python-arvioija, tulosteet (V3), jakaminen (V4) ja
  PWA/offline ovat tekemättä.

## Avoimet päätökset

- Pilottiasunto ja asukkaan lupa; oikeat liite-esimerkit (K5–K7).
- Sääntölistan tarkistus isännöitsijän ja toimintaterapeutin kanssa.
- Muutosvärien varmistus viranomais- ja isännöitsijäpohjista.
