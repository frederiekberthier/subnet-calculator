# Subnetting oefenen

Oefenplatform voor IPv4-subnetting voor de studenten van het **Graduaat Internet of Things** (Howest).
Studenten krijgen onbeperkt nieuwe opgaves, meteen feedback per veld en een uitgewerkte oplossing.

Online: <https://www.graduaatiot.be/subnetting/>

## Oefeningen
1. **Omrekenen** (binair ↔ decimaal) – IP-adres en subnetmasker omzetten in beide richtingen, plus de prefix.
2. **Adresanalyse** – netwerkadres, eerste/laatste bruikbare adres, broadcast, aantal bruikbare hostadressen, klasse, publiek/privaat en het masker in de andere notatie.
3. **Subnetten** – een netwerk splitsen in minstens N even grote subnetten: geleende bits, nieuw masker, aantal subnetten, hosts per subnet en 4 subnetten volledig uitschrijven.

Elke oefening heeft drie niveaus: **Basis**, **Gevorderd** en **Expert**. Bij omrekenen en adresanalyse gebruikt Basis de standaardprefix van de klasse, Gevorderd /24–/30 en Expert elke toegelaten prefix. Bij subnetten start Basis van een /24 (tot 8 netwerken), Gevorderd van een /16 of /24 (tot 32) en Expert van elke toegelaten prefix tot /26 (tot 64).

## Didactische regels
Deze regels zitten in de rekenkern (`src/lib/ipv4.ts`) en worden door tests bewaakt:
- **Bruikbaar** = een adres dat aan een toestel gekoppeld kan worden. Daarom is **/30** de grootste prefix; /31 en /32 komen nooit voor.
- **Nooit supernetting**: de prefix is nooit korter dan de standaardprefix van de klasse (A /8, B /16, C /24) – zie `isSubnettingAllowed`.
- Bij n geleende bits zijn er **2ⁿ subnetten**, genummerd vanaf **subnet 1** (het eerste subnet, vroeger ook "subnet zero" genoemd, is bruikbaar).
- **Subnetten enkel op private adressen**: het startnetwerk van oefening 3 ligt altijd in 10.0.0.0/8 (klasse A), 172.16.0.0/12 (B) of 192.168.0.0/16 (C), en daardoor ook alle subnetten. Omrekenen en adresanalyse gebruiken zowel publieke als private adressen (bij adresanalyse moet de student dat net bepalen).
- Het gegeven IP-adres of startnetwerk ligt nooit in een speciaal bereik (0.x, 127.x, 169.254.x, 100.64.0.0/10, documentatiebereiken, klasse D/E).

## Opgave delen
Elke opgave heeft een eigen link, bv. `https://www.graduaatiot.be/subnetting/#/analyse?seed=42&niveau=3&v=3`:
- `seed` – bepaalt de opgave (dezelfde seed geeft dezelfde opgave)
- `niveau` – 1 = Basis, 2 = Gevorderd, 3 = Expert
- `richting` – enkel bij Omrekenen: `dec2bin` of `bin2dec`
- `v` – versie van de opgavegenerators

Handig om een opgave klassikaal te bespreken: iedereen die de link opent, krijgt exact dezelfde oefening.

**Let op:** als de generators veranderen, verhoogt `GENERATOR_VERSION` (in `src/lib/generators.ts`) en kan dezelfde seed een andere opgave geven. Een link met een oudere `v` toont dan een melding. Deel dus bij voorkeur links na een update opnieuw. Wie de generators aanpast, ziet de snapshot-test in `tests/generators.test.ts` falen: verhoog dan de versie en werk de snapshot bij met `npx vitest -u`.

## Lokaal ontwikkelen
Vereist Node.js.

```bash
npm install
npm run dev      # ontwikkelserver
npm test         # alle tests (Vitest): rekenkern, generators en UI (happy-dom)
npm run build    # productiebuild in dist/
```

## Online zetten (FTP)
1. `npm run build`
2. Verwijder op de server de oude map `/subnetting/assets/`.
3. Laad de **inhoud** van `dist/` op naar `/subnetting/` (dus `index.html`, `favicon.svg` en de map `assets/`, niet de map `dist` zelf).

De build gebruikt relatieve paden (`base: './'` in `vite.config.ts`) en hash-routing (`#/omrekenen`, …), dus de site werkt in elke map zonder serverinstellingen. De bestandsnamen in `assets/` veranderen bij elke build, zodat studenten nooit een oude versie uit hun cache krijgen.

## Structuur
- `src/lib/` – rekenkern (`ipv4.ts`), opgavegenerators, random met seed, controle van antwoorden
- `src/exercises/` – de drie oefenpagina's
- `src/ui/` – gedeelde onderdelen (invoervakjes, feedback, oplossingsweergave)
- `tests/` – Vitest-tests; `tests/ui/` draait in happy-dom
