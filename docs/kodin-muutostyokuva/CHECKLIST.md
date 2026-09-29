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

- [ ] **[EI-KOODI]** K1: Kenttälaite (iPad vai Android-tabletti). Jos iPad → päätetään
      natiivikääre (Capacitor tms.) Web Bluetoothia varten (§6.2)
- [ ] **[EI-KOODI]** K2: floorplan-3d ilman käännösvaihetta (ES-moduulit) vai Vite (§6.4)
- [ ] **[EI-KOODI]** K3: Ensimmäinen tuettu laser. Selvitä Bluetooth-rajapinnan ja
      SDK:n ehdot vähintään kahdelta valmistajalta (esim. Leica DISTO, Bosch GLM)
- [ ] **[EI-KOODI]** Pilottiasunto valittu ja asukkaan lupa kartoitukseen saatu
- [ ] **[EI-KOODI]** Yksi isännöitsijä ja yksi toimintaterapeutti lupautuneet
      arvioimaan tulosteet (V3)
- [ ] **[EI-KOODI]** Hae 2–3 esimerkkiä oikeista muutostyöilmoituksen liitteistä ja
      asunnonmuutostyöhakemuksista (K5, K6, K7)

**Valmis kun:** K1–K3 päätetty ja kirjattu arkkitehtuuridokumenttiin, pilottikohde ja
arvioijat sovittu.

---

## Vaihe V0: Perusta — yhteinen huoneistomalli

### Skeema (§5)
- [ ] **[RK]** Uusi moduuli `src/rakennuskuva/unit_models.py`: `UnitInputs`,
      `Wall`, `Opening`, `Room`, `Fixture`, `Threshold`, `RawMeasurement`,
      `ChangeOp`, `SurveyInfo` + `Consent`
- [ ] **[RK]** `Measurement`-malliin `method`-luettelo (§5.3), `captured_at`,
      `device`. Vanhan vapaan tekstin kuvaus luetteloon tuonnissa, nykyinen
      `project-input-v2` ei rikkoudu
- [ ] **[RK]** Validoinnit: yksilölliset id:t, `host_wall`-viittaukset,
      monikulmioiden sulkeutuminen, `Threshold` sidottu aukkoon tai huonerajaan
- [ ] **[RK]** `Wall.kind = load_bearing` vaatii `source_refs`-lähteen, joka ei ole
      `assumption` (§16, kantavuusriski)
- [ ] **[RK]** Ei kenttää terveystiedolle. Käyttäjäkohtaiset vaatimukset vain
      numeroina (`user.*`) (§10)
- [ ] **[RK]** Skeemavienti `schemas/unit-input-v1.schema.json`
- [ ] **[RK]** Testit: kelvollinen ja virheelliset esimerkkimallit

### Esimerkkidata
- [ ] **[FP]** Nykyinen kovakoodattu demo-asunto (`ROOMS`, `WALLS`, `WINS`, `DOORS`,
      `SLIDES`, `index.html:399–462`) muunnetaan `examples/demo-unit.json`-tiedostoksi
      skeeman mukaiseksi. Status `assumed`, menetelmä `archive_drawing`
- [ ] **[RK]** Sama tiedosto `rakennuskuva`n testiaineistoksi
- [ ] **[MOL]** Pieni esteettömyysesimerkki: kerrostalokylpyhuone + eteinen, jossa
      kynnys ja kapea ovi

### floorplan-3d lukee mallin
- [ ] **[FP]** Playwright-savutesti *ennen* muutoksia: lataus, 2D-näkymä, 3D-näkymä,
      kalusteen lisäys, seinän purku, JSON-vienti (§12.2)
- [ ] **[FP]** K2:n mukainen jako moduuleihin: `model/`, `plan2d/`, `view3d/`, `io/`
      (§6.4). Savutesti vihreänä jaon jälkeen
- [ ] **[FP]** `io/unit.js`: tuonti ja vienti. y-akselin kääntö vain tässä (§5.2)
- [ ] **[FP]** Keskilinjaseinät (`a`, `b`, `thickness`) → nykyinen 2D- ja
      3D-renderöinti. Vinot seinät vähintään piirtyvät oikein
- [ ] **[FP]** Aukot `host_wall` + `along_wall` -mallista → nykyiset ikkuna-, ovi- ja
      liukuovirakenteet
- [ ] **[FP]** Kovakoodatut vakiot poistettu. Demo ladataan `examples/demo-unit.json`sta
- [ ] **[FP]** Nykyinen `state.demolished` korvataan muutoskerroksella
      (`changes[]`, op `demolish_wall`). Vanhan `localStorage`-tilan siirto
      (`huxing-design-v1`)
- [ ] **[FP]** Kalusteet ja lattiamateriaalit toimivat kuten ennen

### Muutoskerros (§5.6)
- [ ] **[RK]** `apply(baseline, changes)` Pythonissa
- [ ] **[FP]** `apply(baseline, changes)` JS:ssä
- [ ] **[MOL]** Yhteiset testitapaukset `fixtures/apply/*.json` (syöte + odotettu
      tulos) ja niiden ajo molempien CI:ssä
- [ ] **[MOL]** Skeeman ja testitapausten kopioiden synkronointitarkistus CI:hin
      (vrt. `tools/sync_skills.py --check`)

**Valmis kun:** demo-asunto latautuu JSONista ja näyttää samalta kuin ennen, savutesti
ja `apply`-testit ovat vihreitä molemmissa repoissa, ja `rk` validoi saman tiedoston.

---

## Vaihe V1: Kenttäkartoitus laserilla

### Kartoitustila (§6.1)
- [ ] **[FP]** Uusi tila "Kartoitus" editorin rinnalle
- [ ] **[FP]** Projektin aloitus: osoite, huoneisto, profiilit, suostumukset
      (`survey.consent`, oletus: ei videota) (§5.7)
- [ ] **[FP]** Huoneen luonnostelu sormella: nurkat, seinät, aukot. Tarttuminen
      90°:een oletuksena
- [ ] **[FP]** Mittauksen kohdistus: napauta seinää, aukkoa tai kahta pistettä →
      odottaa mittaa
- [ ] **[FP]** Käsisyöttö numeronäppäimistöllä, menetelmävalinta (`laser` / `tape`)
- [ ] **[FP]** Raakamittaukset tallentuvat `measurements[]`-listaan alkuperineen,
      kartoittaja kuittaajana
- [ ] **[FP]** Valokuva elementtiin (vain jos `consent.photos` sallii) →
      `source_refs`
- [ ] **[FP]** Nykytilan lukitus ja kartoittajan kuittaus

### Geometria (§5.5)
- [ ] **[FP]** Raakamittaukset + luonnos → seinien koordinaatit
- [ ] **[FP]** Sulkeutumistarkistus huoneittain. Poikkeama näkyy ja pyytää
      uusintamittausta raja-arvon ylittyessä
- [ ] **[FP]** Lävistäjätarkistus ja kulmakorjaus
- [ ] **[FP]** Huoneiden liitos yhteisten seinien ja aukkojen kautta, seinäpaksuus
      aukon kohdalta
- [ ] **[FP]** Johdettujen arvojen status = heikoin lähde (`derived`)
- [ ] **[RK]** Sama geometrialaskenta tai sen tarkistus Pythonissa (QA)

### Laser (§6.2)
- [ ] **[FP]** `LaserAdapter`-rajapinta: `connect()`, `onMeasurement(cb)`,
      `deviceInfo()`
- [ ] **[FP]** Käsisyöttö toteuttaa saman rajapinnan
- [ ] **[FP]** Ensimmäinen laseradapteri (K3) Web Bluetoothilla
- [ ] **[FP]** Laitteen tunniste tallentuu mittaan (`device`)
- [ ] **[FP]** Yhteyden katkeamisen ja uudelleenyhdistämisen käsittely

### Offline (§6.3)
- [ ] **[FP]** PWA: manifest, Service Worker, Three.js ja sovellus välimuistissa
- [ ] **[FP]** Projektit IndexedDB:ssä (ei pelkkä `localStorage`)
- [ ] **[FP]** Projektin vienti tiedostona (MVP-synkronointi)

### Kenttätesti (§12.1)
- [ ] **[EI-KOODI]** Referenssimitat pilottiasunnosta (≥ 20 kpl, kaksi mittaajaa)
- [ ] **[EI-KOODI]** Kartoitus sovelluksella, aika huoneittain kirjattu
- [ ] **[EI-KOODI]** Poikkeamataulukko: sovellus vs. referenssi
- [ ] **[EI-KOODI]** Havainnot ja korjaukset kirjattu

**Valmis kun:** pilottiasunto kartoitettu. Oviaukot ≤ 5 mm ja seinät ≤ 10 mm
referenssistä. Kaksio ≤ 60 min, tai poikkeama selitetty ja korjaussuunnitelma
kirjattu.

---

## Vaihe V2: Sääntömoottori ja pyörätuolisimulaatio

### Säännöt (§7)
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
- [ ] **[EI-KOODI]** Viitearvot tarkistettu YM:n asetuksesta 241/2017 ja kirjattu
      lähteineen
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
- [ ] **[FP]** `blocked()` (`index.html:2593`) yleistetty: törmäysmuoto parametrina
- [ ] **[FP]** Pyörätuolin mitat käyttäjäkohtaisista parametreista
- [ ] **[FP]** 2D: kääntöympyrät ja kapeikot näkyviin
- [ ] **[FP]** "Aja reitti" -toiminto, kapein kohta raportoidaan
- [ ] **[FP]** Tulos syöttää `clear_circle`- ja `path_width`-sääntöjä
- [ ] **[FP]** Kuvakaappaus tallentuu esteettömyysliitettä varten

### Muutoksen suunnittelu
- [ ] **[FP]** Muutosoperaatiot käyttöliittymässä: purku, uusi seinä, aukon muutos,
      kynnyksen poisto, kiintokalusteen lisäys ja vaihto, pintamateriaali
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
- [ ] **[MOL]** Arkistopiirustuksen tuonti nykytilan pohjaksi
      (`archive_drawing`)
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
