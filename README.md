# Subnetting oefenen

Oefenplatform voor **IPv4 en IPv6** voor de studenten van het **Graduaat Internet of Things** (Howest), in het Nederlands en het Engels: binair rekenen, adresanalyse en subnetting in IPv4, en het inkorten van IPv6-adressen.
Studenten krijgen onbeperkt nieuwe opgaves, meteen feedback per veld en een uitgewerkte oplossing.

Online: <https://www.graduaatiot.be/subnetting/>

<img width="2074" height="1391" alt="Schermafbeelding 2026-10-25 181327" src="https://github.com/user-attachments/assets/df7181da-2772-4f14-bb80-c98448d1c1c0" />


## Oefeningen

| # | Oefening | Adres (route) | Wat de student doet |
|---|---|---|---|
| 1 | **Omrekenen** (binair ↔ decimaal) | `#/omrekenen` | IPv4-adres en subnetmasker omzetten in beide richtingen, plus de prefix. <img width="2074" height="1391" alt="Schermafbeelding 2026-10-25 181336" src="https://github.com/user-attachments/assets/716bf0c5-b401-4382-be8c-91533938573f" /> |
| 2 | **Adresanalyse** | `#/analyse` | netwerkadres, eerste/laatste bruikbare adres, broadcast, aantal bruikbare hostadressen, klasse, publiek/privaat en het masker in de andere notatie. <img width="2074" height="1391" alt="Schermafbeelding 2026-10-25 181340" src="https://github.com/user-attachments/assets/9a5d15bb-efae-469a-8d1a-edbc1cbfcfc4" />  |
| 3 | **Subnetten** | `#/subnetten` | een IPv4-netwerk splitsen in minstens N even grote subnetten: geleende bits, nieuw masker, aantal subnetten, hosts per subnet en 4 subnetten volledig uitschrijven <img width="2074" height="1391" alt="Schermafbeelding 2026-10-25 181346" src="https://github.com/user-attachments/assets/699483c3-8713-4555-895d-dce0be79d808" /> |
| 4 | **IPv6 inkorten** | `#/ipv6` | een volledig uitgeschreven IPv6-adres zo ver mogelijk inkorten: voorloopnullen schrappen en één rij lege groepen weglaten met `::` (zero compression) <img width="2074" height="1391" alt="Schermafbeelding 2026-10-25 181357" src="https://github.com/user-attachments/assets/5ef67ccb-4bdc-451a-80c7-035badf4c00f" /> |

### Niveaus
Elke oefening heeft drie niveaus: **Basis**, **Gevorderd** en **Expert**.

| Oefening | Basis | Gevorderd | Expert |
|---|---|---|---|
| Omrekenen, adresanalyse | standaardprefix van de klasse | /24 – /30 | elke toegelaten prefix |
| Subnetten | start van een /24, tot 8 netwerken | start van een /16 of /24, tot 32 | elke toegelaten prefix tot /26, tot 64 |
| IPv6 inkorten | prefix `2001:0db8`, één rij van 2–4 lege groepen | twee rijen lege groepen, meer groepen met voorloopnullen, ook prefixen `2a02` en `fdxx` | lastige gevallen: lege groepen vooraan (`::…`) of achteraan (`…::`), even lange rijen, enkel losse lege groepen, opgave soms in hoofdletters |

## Bediening
- **Automatisch doorspringen**: de focus gaat naar het volgende veld zodra er geen cijfer meer bij kan (byte: `0`, `26` of meer, of 3 cijfers; prefix: `0`, `4`–`9` of 2 cijfers). Dat kijkt nooit naar het juiste antwoord, dus het verklapt niets. Een punt, komma of spatie springt ook door; een volledig adres plakken vult alle vakjes.
- **Enter** (of "Volgende" op een gsm-klavier) gaat naar het volgende veld; als alles ingevuld is, controleert Enter de oefening.
- Na een klik op een keuzeknop (klasse, publiek/privaat) gaat de focus naar het volgende veld; met de pijltjestoetsen blijft hij in de groep.
- **Controleer** toont per veld ✓ of ✗ (fout: rode rand, leeg: gestreepte rand) en een tip bij een fout formaat. **Toon oplossing** geeft de volledige uitwerking, met "jij: …" naast elk fout antwoord.

## Didactische regels
De regels zitten in de rekenkern en worden door tests bewaakt.

### IPv4 (oefening 1–3, `src/lib/ipv4.ts`)
- **Bruikbaar** = een adres dat aan een toestel gekoppeld kan worden. Daarom is **/30** de grootste prefix; /31 en /32 komen nooit voor.
- **Nooit supernetting**: de prefix is nooit korter dan de standaardprefix van de klasse (A /8, B /16, C /24) – zie `isSubnettingAllowed`.
- Bij n geleende bits zijn er **2ⁿ subnetten**, genummerd vanaf **subnet 1** (het eerste subnet, vroeger ook "subnet zero" genoemd, is bruikbaar).
- **Subnetten enkel op private adressen**: het startnetwerk van oefening 3 ligt altijd in 10.0.0.0/8 (klasse A), 172.16.0.0/12 (B) of 192.168.0.0/16 (C), en daardoor ook alle subnetten. Omrekenen en adresanalyse gebruiken zowel publieke als private adressen (bij adresanalyse moet de student dat net bepalen).
- Het gegeven IP-adres of startnetwerk ligt nooit in een speciaal bereik (0.x, 127.x, 169.254.x, 100.64.0.0/10, documentatiebereiken, klasse D/E).

### IPv6 (oefening 4, `src/lib/ipv6.ts`)
- **Aanpak in twee regels**, in deze volgorde (zoals in de les):
  1. **Voorloopnullen schrappen**: nullen bij het begin van een groep (hextet) vallen weg (`0db8` → `db8`, `0370` → `370`); nullen achteraan of in het midden blijven (`ff00`, `0a0b` → `a0b`); van een groep met enkel nullen blijft één `0` over (`0000` → `0`).
  2. **Lege groepen weglaten (zero compression)**: één rij aaneengesloten groepen met enkel nullen wordt vervangen door een dubbele dubbelpunt `::`. Dat mag **maar één keer** (`FD00::B13A:831::6789` is fout, `FD00::B13A:831:0:6789` is juist).
- **Wanneer is een antwoord juist?** Als het hetzelfde adres is, alle voorloopnullen geschrapt zijn en `::` precies één keer een **volledige** rij lege groepen weglaat.
  - Welke rij maakt niet uit (niet enkel de langste) en ook **één enkele lege groep** mag met `::` weggelaten worden. Dat is bewust losser dan de officiële aanbeveling (RFC 5952).
  - Een `::` die maar een deel van een rij weglaat (er blijft een `0` naast staan), telt als niet volledig ingekort.
  - Hoofd- en kleine letters zijn allebei goed.
- **Tips bij een fout**: voorloopnullen niet geschrapt, `::` twee keer, `::` niet gebruikt terwijl het kan, `::` op een deel van een rij, ongeldig formaat.
- **Oplossing**: één deel per regel. Regel 1 toont de 8 groepen met de voorloopnullen gemarkeerd en geteld, plus een opsomming van de aangepaste groepen; regel 2 toont de rijen lege groepen, de gekozen rij, de kortste vorm (langste rij, bij gelijke lengte de eerste) en de andere juiste schrijfwijzen. De oplossing volgt de schrijfwijze van de opgave (hoofdletters als de opgave in hoofdletters staat).
- **Opgaves**: altijd minstens één groep met voorloopnullen én minstens één lege groep (beide regels worden geoefend), nooit het volledige 0-adres. Prefixen: `2001:0db8` (documentatieprefix `2001:db8::/32`), `2a02` (Belgische providers, bv. Telenet), `fdxx` (unique local).

## Taalgebruik
De site gebruikt dezelfde woorden als de les. Wie teksten aanpast of een oefening toevoegt, houdt die termen aan:

| Onderwerp | Nederlands | English |
|---|---|---|
| IPv4: adres dat aan een toestel gekoppeld kan worden | **bruikbaar** adres, aantal bruikbare hostadressen | **host address** (first/last host address, number of host addresses) |
| IPv4: subnetnummering | subnet 1, 2, … | subnet 1, 2, … |
| IPv6: de 8 delen van het adres | **groep** (hextet) | **group** (hextet) |
| IPv6: regel 1 | voorloopnullen **schrappen** | **remove** leading zeros |
| IPv6: regel 2 | **lege groepen weglaten**, rij groepen met enkel nullen, **zero compression** | **omit all-zero groups**, run of all-zero groups, **zero compression** |
| IPv6: `::` | dubbele **dubbelpunt** | double colon |
| IPv6: de oefening | adres **inkorten**, ingekort adres | **shorten**, shortened address |

De IPv6-termen komen uit de lesdia's (dia 13–18 van de IPv6-presentatie). De Engelse IPv4-term "host address" is een keuze van de docent.

## Talen (Nederlands / English)
De site is volledig beschikbaar in het Nederlands en het Engels. Rechtsboven in het menu kies je **NL** of **EN**; de keuze wordt onthouden.

Een link in een bepaalde taal: voeg `?lang=en` (of `?lang=nl`) toe vóór de `#`, bv.
`https://www.graduaatiot.be/subnetting/?lang=en` of `https://www.graduaatiot.be/subnetting/?lang=en#/ipv6`.

Alle teksten staan in `src/i18n/nl.ts` en `src/i18n/en.ts`. Een nieuwe tekst moet in **beide** woordenboeken komen: TypeScript en de test `tests/ui/i18n.test.ts` falen anders (die controleert ook dat er nergens Nederlands in de Engelse versie staat).

## Opgave delen
Elke opgave heeft een eigen link, bv. `https://www.graduaatiot.be/subnetting/#/analyse?seed=42&niveau=3&v=3` of `…/#/ipv6?seed=7&niveau=2&v=3`:
- `seed` – bepaalt de opgave (dezelfde seed geeft dezelfde opgave)
- `niveau` – 1 = Basis, 2 = Gevorderd, 3 = Expert
- `richting` – enkel bij Omrekenen: `dec2bin` of `bin2dec`
- `v` – versie van de opgavegenerators (nu 3)
- `lang` – taal, vóór de `#` (zie hierboven)

Handig om een opgave klassikaal te bespreken: iedereen die de link opent, krijgt exact dezelfde oefening.

**Let op:** als de generators veranderen, verhoogt `GENERATOR_VERSION` (in `src/lib/generators.ts`) en kan dezelfde seed een andere opgave geven. Een link met een oudere `v` toont dan een melding. Deel dus bij voorkeur links na een update opnieuw. Wie de generators aanpast, ziet de snapshot-tests in `tests/generators.test.ts` falen (een voor oefening 1–3, een voor IPv6): verhoog dan de versie en werk de snapshots bij met `npx vitest -u`.

## Lokaal ontwikkelen
Vereist Node.js.

```bash
npm install
npm run dev      # ontwikkelserver
npm test         # alle tests (Vitest): rekenkern IPv4/IPv6, generators en UI (happy-dom)
npm run build    # productiebuild in dist/
```

## Online zetten (FTP)
1. `npm run build`
2. Verwijder op de server de oude map `/subnetting/assets/`.
3. Laad de **inhoud** van `dist/` op naar `/subnetting/` (dus `index.html`, `favicon.svg` en de map `assets/`, niet de map `dist` zelf).

De build gebruikt relatieve paden (`base: './'` in `vite.config.ts`) en hash-routing (`#/omrekenen`, `#/ipv6`, …), dus de site werkt in elke map zonder serverinstellingen. De bestandsnamen in `assets/` veranderen bij elke build, zodat studenten nooit een oude versie uit hun cache krijgen.

## Structuur
- `src/lib/` – logica zonder schermweergave:
  - `ipv4.ts` – rekenkern IPv4 (adressen, maskers, netwerk/broadcast, klassen, subnetten)
  - `ipv6.ts` – rekenkern IPv6 (inlezen, voorloopnullen, lege groepen, `::`, controle van het ingekorte adres)
  - `generators.ts` – opgaves per oefening en niveau (met `GENERATOR_VERSION`)
  - `check.ts` – controle van antwoorden en regel voor automatisch doorspringen; `random.ts` – random met seed; `html.ts` – escaping
- `src/exercises/` – de vier oefenpagina's: `binary.ts` (omrekenen), `analyze.ts` (adresanalyse), `subnet.ts` (subnetten), `ipv6.ts` (IPv6 inkorten)
- `src/pages/home.ts` – startpagina en "pagina niet gevonden"; `src/router.ts` – hash-routing en paginatitels; `src/main.ts` – opstart en taalknoppen
- `src/ui/` – gedeelde onderdelen: invoervakjes (`octets.ts`), navigatie tussen velden (`navigation.ts`), feedback en instellingen (`exercise.ts`), overzicht met "jij: …" (`overview.ts`), keuzeknoppen (`choice.ts`), binaire weergaves (`bitstrip.ts`, `andtable.ts`)
- `src/i18n/` – teksten in het Nederlands en het Engels, en de taalkeuze
- `tests/` – Vitest-tests per onderdeel; `tests/ui/` draait in happy-dom
