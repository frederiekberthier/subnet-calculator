// Nederlandse teksten. Het Engelse woordenboek (en.ts) moet exact dezelfde structuur hebben;
// TypeScript controleert dat via het type Messages.

export const nl = {
  site: {
    title: 'Subnetting oefenen',
    description:
      'Oefen IPv4-subnetting en IPv6: omrekenen binair ↔ decimaal, adresanalyse, subnetten en IPv6-adressen verkorten, met directe feedback en uitgewerkte oplossingen. Graduaat Internet of Things, Howest.',
    skip: 'Naar inhoud',
    brandLabel: 'Subnetting oefenen, startpagina',
    brandSub: 'Graduaat IoT',
    langLabel: 'Taal',
  },
  nav: {
    convert: 'Omrekenen',
    analysis: 'Adresanalyse',
    subnetting: 'Subnetten',
    ipv6: 'IPv6 verkorten',
  },
  /** Korte namen voor het menu bovenaan (op gsm staan de drie naast elkaar). */
  menu: {
    convert: 'Omrekenen',
    analysis: 'Adresanalyse',
    subnetting: 'Subnetten',
    ipv6: 'IPv6',
  },
  footer: {
    title: 'Graduaat Internet of Things',
    sub: 'Howest Hogeschool West-Vlaanderen - Campus Kortrijk',
    more: 'Meer info over de opleiding',
    moreUrl: 'https://www.howest.be/nl/opleidingen/graduaat/internet-of-things',
    copyright: 'Howest - Hogeschool West-Vlaanderen',
  },
  home: {
    eyebrow: 'Graduaat Internet of Things',
    lead: 'Onbeperkt oefenen op IPv4- en IPv6-adressen en subnetten, met meteen feedback en een uitgewerkte oplossing.',
    start: 'Start oefening',
    cards: {
      convert: 'Zet een IPv4-adres en subnetmasker om van decimaal naar binair en omgekeerd.',
      analysis: 'Bepaal netwerkadres, eerste en laatste host, broadcast, klasse en publiek/privaat.',
      subnetting: 'Splits een netwerk in een gevraagd aantal kleinere subnetten.',
      ipv6: 'Schrijf een volledig IPv6-adres zo kort mogelijk: voorloopnullen weg en één reeks nullen vervangen door ::.',
    },
  },
  notFound: {
    title: 'Pagina niet gevonden',
    back: 'Terug naar de startpagina',
  },
  common: {
    level: 'Niveau',
    levels: { 1: 'Basis', 2: 'Gevorderd', 3: 'Expert' } as Record<1 | 2 | 3, string>,
    newExercise: 'Nieuwe oefening',
    check: 'Controleer',
    showSolution: 'Toon oplossing',
    solution: 'Oplossing',
    overview: 'Overzicht',
    steps: 'Stappen',
    binaryWork: 'Binaire uitwerking',
    ipAddress: 'IP-adres',
    subnetMask: 'Subnetmasker',
    prefix: 'Prefix',
    network: 'Netwerk',
    networkAddress: 'Netwerkadres',
    firstUsable: 'Eerste bruikbare adres',
    lastUsable: 'Laatste bruikbare adres',
    broadcast: 'Broadcastadres',
    usableHosts: 'Aantal bruikbare hostadressen',
    outdated:
      'Deze link werd met een oudere versie van de site gemaakt. De opgave kan daardoor verschillen van de opgave die gedeeld werd.',
  },
  feedback: {
    allCorrect: '✓ Alles juist, goed gedaan!',
    summary: (correct: number, total: number) => `${correct} van ${total} velden juist.`,
    notAllFilled: ' Nog niet alle velden zijn ingevuld.',
    legend: '✓ juist · ✗ fout · gestreepte rand = nog niet ingevuld',
    correct: '✓ juist',
    you: 'jij:',
    notFilled: 'niet ingevuld',
  },
  hints: {
    byteRange: 'Een byte is een getal van 0 tot 255.',
    binaryOnly: 'Gebruik enkel 0 en 1.',
    eightBits: 'Schrijf elke byte met precies 8 bits (vul aan met nullen vooraan).',
    prefixRange: 'Een prefix is een getal van 0 tot 32, bv. /24.',
    integer: 'Geef een geheel getal.',
    ipv6Format: 'Schrijf een IPv6-adres als blokken van hoogstens 4 hexadecimale cijfers (0–9, a–f), gescheiden door dubbele punten.',
    ipv6Once: ':: mag maar één keer in een adres staan: anders weet je niet hoeveel 0-blokken elke :: vervangt.',
    ipv6LeadingZeros: 'Laat in elk blok de voorloopnullen weg (bv. 0db8 → db8, 0042 → 42, 0000 → 0).',
    ipv6UseDoubleColon: 'Vervang een reeks opeenvolgende 0-blokken door ::.',
    ipv6PartialRun: 'Laat :: een volledige reeks 0-blokken vervangen: er staat nog een 0-blok naast de ::.',
  },
  bits: {
    table: 'Binaire uitwerking',
    colAddress: 'Adres',
    colBinary: 'Binair',
    colDecimal: 'Decimaal',
    byte: 'Byte',
    networkBits: (n: number) => `${n} netwerkbits`,
    subnetBits: (n: number) => `${n} subnetbits`,
    hostBits: (n: number) => `${n} hostbits`,
  },
  convert: {
    title: '1. Omrekenen',
    subtitle: 'binair ↔ decimaal',
    leadToBinary: 'Zet het IP-adres en het subnetmasker om naar binair: 8 bits per byte.',
    leadToDecimal: 'Zet het IP-adres en het subnetmasker om naar decimaal: een getal van 0 tot 255 per byte.',
    leadPrefix: 'Geef ook de prefix van het subnetmasker.',
    direction: 'Richting',
    directions: { willekeurig: 'Willekeurig', dec2bin: 'Decimaal → binair', bin2dec: 'Binair → decimaal' } as Record<
      'willekeurig' | 'dec2bin' | 'bin2dec',
      string
    >,
    prefixHint: 'aantal 1-bits in het masker',
    prefixExplained: (p: number) =>
      `Het subnetmasker bevat <strong>${p}</strong> enen op rij, dus de prefix is <strong>/${p}</strong>.`,
  },
  analysis: {
    title: '2. Adresanalyse',
    subtitle: 'netwerk, bruikbare adressen en broadcast',
    lead: 'Bepaal voor dit IP-adres het netwerkadres, het eerste en laatste bruikbare adres, het broadcastadres en het aantal bruikbare hostadressen. Geef ook de klasse, of het adres publiek of privaat is, en het subnetmasker in de andere notatie.',
    class: 'Klasse',
    scope: 'Publiek of privaat',
    public: 'Publiek',
    private: 'Privaat',
    stepMask: (p: number, mask: string) => `<strong>Masker:</strong> /${p} betekent ${p} enen op rij: ${mask}.`,
    stepNetwork: (hostBits: number, net: string) =>
      `<strong>Netwerkadres</strong> = IP-adres AND subnetmasker: de netwerkbits blijven, alle ${hostBits} hostbits worden 0 → <span class="mono">${net}</span>.`,
    stepBroadcast: (bc: string) =>
      `<strong>Broadcastadres:</strong> dezelfde netwerkbits, alle hostbits op 1 → <span class="mono">${bc}</span>.`,
    stepFirstLast: (first: string, last: string) =>
      `<strong>Eerste bruikbare adres</strong> = netwerkadres + 1 → <span class="mono">${first}</span>.<br><strong>Laatste bruikbare adres</strong> = broadcastadres − 1 → <span class="mono">${last}</span>.`,
    stepHosts: (hostBits: number, total: string, usable: string) =>
      `<strong>Aantal bruikbare hostadressen</strong> = 2<sup>${hostBits}</sup> − 2 = ${total} − 2 = <strong>${usable}</strong> (netwerk- en broadcastadres zijn niet bruikbaar).`,
    stepClass: (first: number, from: number, to: number, cls: string) =>
      `<strong>Klasse:</strong> de eerste byte is ${first}, die ligt tussen ${from} en ${to} → klasse <strong>${cls}</strong>.`,
    stepPrivate: '<strong>Privaat:</strong> het adres ligt in een privébereik (RFC 1918).',
    stepPublic: '<strong>Publiek:</strong> het adres ligt niet in een van de privébereiken, dus het is publiek.',
    privateRanges: 'Privébereiken: 10.0.0.0/8, 172.16.0.0/12 en 192.168.0.0/16.',
  },
  subnetting: {
    title: '3. Subnetten',
    subtitle: 'een netwerk opsplitsen in kleinere netwerken',
    lead: 'Verdeel het netwerk in minstens het gevraagde aantal even grote subnetten. Bereken hoeveel bits je leent, het nieuwe subnetmasker en hoeveel subnetten en bruikbare hostadressen je krijgt. Schrijf daarna de gevraagde subnetten volledig uit. De subnetten zijn genummerd vanaf <strong>subnet 1</strong>.',
    requested: 'Gevraagd',
    atLeast: (n: number) => `minstens ${n} netwerken`,
    calculation: 'Berekening',
    borrowedBits: 'Aantal geleende bits',
    newMask: 'Nieuw subnetmasker',
    newPrefix: 'Nieuwe prefix',
    subnetCount: 'Aantal subnetten',
    hostsPerSubnet: 'Bruikbare hostadressen per subnet',
    writeOut: 'Subnetten uitschrijven',
    name: (n: number) => `Subnet ${n}`,
    oldMaskRow: 'Oud masker',
    newMaskRow: 'Nieuw masker',
    subnetsRule: 'subnetten',
    allSubnets: 'Alle subnetten',
    allSubnetsRegion: 'Alle subnetten (scrollbaar)',
    showAll: (n: number) => `Toon alle ${n} subnetten`,
    askedMarked: 'De gevraagde subnetten zijn gemarkeerd.',
    col: { subnet: 'Subnet', network: 'Netwerkadres', first: 'Eerste bruikbare', last: 'Laatste bruikbare', broadcast: 'Broadcast' },
    byteNames: ['1e', '2e', '3e', '4e'],
    stepBorrowed: (requested: number, n: number) =>
      `<strong>Geleende bits:</strong> zoek het kleinste aantal bits n waarvoor 2<sup>n</sup> ≥ ${requested}. ${
        n > 1 ? `2<sup>${n - 1}</sup> = ${2 ** (n - 1)} is te weinig, ` : ''
      }2<sup>${n}</sup> = ${2 ** n} is genoeg → <strong>${n} bit${n === 1 ? '' : 's'}</strong>.`,
    stepPrefix: (oldP: number, n: number, newP: number, mask: string) =>
      `<strong>Nieuwe prefix</strong> = /${oldP} + ${n} = <strong>/${newP}</strong> → nieuw subnetmasker <span class="mono">${mask}</span>.`,
    stepCount: (n: number, count: string, last: number) =>
      `<strong>Aantal subnetten</strong> = 2<sup>${n}</sup> = <strong>${count}</strong> (subnet 1 tot en met subnet ${last}).`,
    stepHosts: (hostBits: number, total: string, usable: string) =>
      `<strong>Bruikbare hostadressen per subnet:</strong> er blijven ${hostBits} hostbits over → 2<sup>${hostBits}</sup> − 2 = ${total} − 2 = <strong>${usable}</strong>.`,
    stepBlock: (byteName: string, maskByte: number, magic: number) =>
      `<strong>Blokgrootte:</strong> in de ${byteName} byte is het nieuwe masker ${maskByte}, dus 256 − ${maskByte} = <strong>${magic}</strong>. Elk volgend subnet begint ${magic} hoger in de ${byteName} byte.`,
    stepPerSubnet:
      '<strong>Per subnet:</strong> eerste bruikbare = netwerkadres + 1, broadcast = volgend netwerkadres − 1, laatste bruikbare = broadcast − 1.',
  },
  ipv6: {
    title: '4. IPv6 verkorten',
    subtitle: 'voorloopnullen weglaten en ::',
    lead: 'Schrijf het IPv6-adres zo kort mogelijk. Laat in elk blok de voorloopnullen weg en vervang één reeks opeenvolgende 0-blokken door <strong>::</strong>. Dat mag maar één keer per adres.',
    given: 'IPv6-adres',
    answer: 'Verkort adres',
    colBlock: 'Blok',
    rule1Title: 'Regel 1 – voorloopnullen weglaten',
    rule1Intro:
      'In elk blok vallen de nullen <strong>vooraan</strong> weg: ze veranderen de waarde niet (0042 = 42). Nullen achteraan of in het midden blijven staan (ff00, 0a0b → a0b). Van een blok met enkel nullen blijft één 0 over (0000 → 0).',
    removed: (n: number) => (n === 0 ? 'geen' : `−${n} ${n === 1 ? 'nul' : 'nullen'}`),
    changed: (list: string) => `Aangepaste blokken: ${list}.`,
    unchanged: (list: string) => `Geen voorloopnullen, dus ongewijzigd: ${list}.`,
    result1: (text: string) => `Na regel 1: <span class="mono">${text}</span>`,
    rule2Title: 'Regel 2 – één reeks 0-blokken door :: vervangen',
    rule2Intro:
      'Zoek de reeksen opeenvolgende 0-blokken in het adres van regel 1. Eén reeks mag je vervangen door <strong>::</strong> (de langste reeks geeft het kortste adres).',
    rule2Chosen: (length: number, from: number, text: string) =>
      `De langste reeks is ${length} ${length === 1 ? 'blok' : 'blokken'} vanaf blok ${from} → <span class="mono">${text}</span>`,
    leadingZeros: 'voorloopnullen',
    zeroRun: 'reeks 0-blokken',
    alternatives: (list: string) =>
      `Ook juist: ${list}. Je mag kiezen welke reeks nullen je door :: vervangt, maar :: mag maar één keer voorkomen.`,
    once: 'Waarom maar één keer? Bij twee keer :: weet je niet meer hoeveel 0-blokken elke :: voorstelt.',
  },
}

/** Structuur van een woordenboek: elke taal moet exact deze teksten aanleveren. */
export type Messages = typeof nl
