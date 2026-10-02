# Säännöt ja suositukset (rules-v1)

Päivitetty 2026-10-03. Sääntötiedosto: [`rules/rules-v1.json`](../../rules/rules-v1.json),
arvioija: [`src/model/rules.ts`](../../src/model/rules.ts).

## Periaate

Käyttäjän päätös 2026-10-03: säännöt ovat **ohjeellisia eivätkä koskaan estä
muokkausta**. Ne tulevat näkyviin, kun ne alkavat koskea suunnitelmaa:

- **Muutos koskee sääntöä.** Yleisnäkymän "Huomiot" listaa muutoskerroksen
  esiin nostamat säännöt. Elementti on muutoksen koskema, kun se on muutoksen kohde
  tai lisätty elementti tai kun se on huoneessa, jota muutos koskee.
- **Valinta koskee sääntöä.** Valitun seinän, aukon, huoneen tai kiintokalusteen
  paneeli näyttää sen omat tarkistukset, myös täyttyvät (✓).
- **Profiili.** "Näytä kaikki esteettömyyssuositukset" lisää malliin
  `profiles: ["esteettomyys"]` ja tuo esiin kaikki täyttymättömät esteettömyyssuositukset.

Tasot: **Ilmoitus** (toimenpide, esim. muutostyöilmoitus), **Tarkista** (selvitettävä
asia), **Suositus** (mittaohje) ja **Tietoa**. Jokaisessa huomiossa on säädös ja pykälä
linkkeineen Finlexiin. Säädösteksti on tiivistetty, ei lainattu kokonaan.

Rajaus: VnA 241/2017 koskee luvanvaraista uudisrakentamista ja asuinkerrostalon
yleisiä tiloja. Asunnon sisäisessä muutostyössä sen arvot ovat mitoitusohje.
Toimintaterapeutin käyttäjäkohtaiset arvot (§7.1) eivät vielä ole käytössä.

Editorin aiempi kantavan, ulko- ja huoneistojen välisen seinän purkueste
(`demolishWall`) on työkalun suojaus, ei sääntömoottorin esto.

## Säännöt

| Tunniste | Taso | Milloin näkyy | Lähde |
|---|---|---|---|
| `muutostyo.ilmoitus` | Ilmoitus | Mikä tahansa muutos | Asunto-osakeyhtiölaki 1599/2009 5 luku 2 § |
| `muutostyo.seina_lupa` | Tarkista | Seinän purku tai uusi seinä | Rakentamislaki 751/2023 42 § 3 mom. |
| `muutostyo.seina_oletus` | Tarkista | Puretun seinän tyypillä ei ole muuta kuin oletuslähdettä | Asunto-osakeyhtiölaki 5 luku 3 § |
| `muutostyo.markatila` | Tarkista | Märkätilan pinta, siellä oleva kiintokaluste, sen ovi tai kynnys muuttuu | YM:n asetus 782/2017 28–29 § |
| `esteettomyys.oven_vapaa_leveys` | Suositus | Ovi tai kulkuaukko, vapaa leveys < 800 mm (puuttuessa karmiaukko) | VnA 241/2017 4 § 2 mom. |
| `esteettomyys.kynnys` | Suositus | Kynnys > 20 mm | VnA 241/2017 4 § 3 mom. |
| `esteettomyys.pesutila_vapaa_tila` | Suositus | Wc- tai pesutilan suurin vapaa ympyrä < Ø 1300 mm (palveluasuminen Ø 1500 mm) | VnA 241/2017 9 § 1–2 mom. |
| `esteettomyys.kaantymistila` | Suositus | Eteisen tai keittiön suurin vapaa ympyrä < Ø 1300 mm | VnA 241/2017 6 § 2–3 mom. |
| `esteettomyys.wc_sivutila` | Suositus | Wc-istuimen vapaampi sivu < 800 mm | VnA 241/2017 9 § 2 mom. |
| `esteettomyys.tuki` | Tietoa | Kynnyksen poisto, aukon levennys tai tukikahva | Vammaispalvelulaki 675/2023 22 § |

Vapaa ympyrä lasketaan huoneen monikulmion, seinien (paksuus huomioiden) ja
kiintokalusteiden väliin karkeasta hienoon -ruudukkohaulla 1 mm:n tarkkuuteen.
Ympyrä piirretään valitulle huoneelle 2D:ssä. Wc-istuimen sivutila mitataan
säteillä istuimen kummaltakin sivulta kolmella syvyydellä. Irtokalusteet eivät
vaikuta, koska asetus koskee kiinteitä kalusteita.

## Tarkistetut lähteet

- [VnA rakennuksen esteettömyydestä 241/2017](https://www.finlex.fi/fi/lainsaadanto/2017/241);
  soveltamisala päivitetty rakentamislakiin asetuksella 683/2024.
  [Vuoden 2026 rakentamislain muutosesitys HE 83/2026](https://www.edilex.fi/he/20260083)
  ei muuta esteettömyysvaatimuksia.
- [Asunto-osakeyhtiölaki 1599/2009](https://www.finlex.fi/fi/lainsaadanto/2009/1599)
  5 luku 1–4 ja 8 §.
- [Rakentamislaki 751/2023](https://www.finlex.fi/fi/lainsaadanto/2023/751) 42 §.
- [YM:n asetus rakennusten kosteusteknisestä toimivuudesta 782/2017](https://www.finlex.fi/fi/lainsaadanto/2017/782) 2, 28 ja 29 §.
- [Vammaispalvelulaki 675/2023](https://www.finlex.fi/fi/lainsaadanto/2023/675) 22–23 §.

## Avoimet asiat

- Isännöitsijän (K5) ja toimintaterapeutin (K6) tarkistus sääntölistalle.
- Käyttäjäkohtaiset raja-arvot, kulkureitin leveys ja pyörätuolisimulaatio (§7.4).
- Ilmanvaihto- ja hormikohtien liputus vaatii niiden mallintamisen.
- RK:n Python-arvioija ja yhteiset `fixtures/rules`-testit (§7.3).
