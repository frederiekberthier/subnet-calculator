// English texts. Must have exactly the same structure as nl.ts (checked by the Messages type).
import type { Messages } from './nl'

export const en: Messages = {
  site: {
    title: 'Subnetting practice',
    description:
      'Practise IPv4 subnetting: binary ↔ decimal conversion, address analysis and subnetting, with instant feedback and worked solutions. Associate degree Internet of Things, Howest.',
    skip: 'Skip to content',
    brandLabel: 'Subnetting practice, home page',
    brandSub: 'Howest IoT',
    langLabel: 'Language',
  },
  nav: {
    convert: 'Conversion',
    analysis: 'Address analysis',
    subnetting: 'Subnetting',
  },
  menu: {
    convert: 'Conversion',
    analysis: 'Analysis',
    subnetting: 'Subnetting',
  },
  footer: {
    title: 'Associate degree Internet of Things',
    sub: 'Howest University of Applied Sciences - Kortrijk campus',
    more: 'More about the programme',
    moreUrl: 'https://www.howest.be/en/programmes/associate-degree/internet-of-things',
    copyright: 'Howest University of Applied Sciences',
  },
  home: {
    eyebrow: 'Associate degree Internet of Things',
    lead: 'Unlimited practice with IPv4 addresses and subnets, with instant feedback and a worked solution.',
    start: 'Start exercise',
    cards: {
      convert: 'Convert an IPv4 address and subnet mask from decimal to binary and back.',
      analysis: 'Find the network address, first and last host, broadcast, class and public/private.',
      subnetting: 'Split a network into a requested number of smaller subnets.',
    },
  },
  notFound: {
    title: 'Page not found',
    back: 'Back to the home page',
  },
  common: {
    level: 'Level',
    levels: { 1: 'Basic', 2: 'Intermediate', 3: 'Expert' },
    newExercise: 'New exercise',
    check: 'Check',
    showSolution: 'Show solution',
    solution: 'Solution',
    overview: 'Overview',
    steps: 'Steps',
    binaryWork: 'Binary working',
    ipAddress: 'IP address',
    subnetMask: 'Subnet mask',
    prefix: 'Prefix',
    network: 'Network',
    networkAddress: 'Network address',
    firstUsable: 'First usable address',
    lastUsable: 'Last usable address',
    broadcast: 'Broadcast address',
    usableHosts: 'Number of usable host addresses',
    outdated:
      'This link was created with an older version of the site. The exercise may therefore differ from the one that was shared.',
  },
  feedback: {
    allCorrect: '✓ All correct, well done!',
    summary: (correct: number, total: number) => `${correct} of ${total} fields correct.`,
    notAllFilled: ' Not all fields have been filled in yet.',
    legend: '✓ correct · ✗ wrong · dashed border = not filled in yet',
    correct: '✓ correct',
    you: 'you:',
    notFilled: 'not filled in',
  },
  hints: {
    byteRange: 'A byte is a number from 0 to 255.',
    binaryOnly: 'Use only 0 and 1.',
    eightBits: 'Write every byte with exactly 8 bits (pad with leading zeros).',
    prefixRange: 'A prefix is a number from 0 to 32, e.g. /24.',
    integer: 'Enter a whole number.',
  },
  bits: {
    table: 'Binary working',
    colAddress: 'Address',
    colBinary: 'Binary',
    colDecimal: 'Decimal',
    byte: 'Byte',
    networkBits: (n: number) => `${n} network bits`,
    subnetBits: (n: number) => `${n} subnet bits`,
    hostBits: (n: number) => `${n} host bits`,
  },
  convert: {
    title: '1. Conversion',
    subtitle: 'binary ↔ decimal',
    leadToBinary: 'Convert the IP address and the subnet mask to binary: 8 bits per byte.',
    leadToDecimal: 'Convert the IP address and the subnet mask to decimal: a number from 0 to 255 per byte.',
    leadPrefix: 'Also give the prefix of the subnet mask.',
    direction: 'Direction',
    directions: { willekeurig: 'Random', dec2bin: 'Decimal → binary', bin2dec: 'Binary → decimal' },
    prefixHint: 'number of 1 bits in the mask',
    prefixExplained: (p: number) =>
      `The subnet mask contains <strong>${p}</strong> ones in a row, so the prefix is <strong>/${p}</strong>.`,
  },
  analysis: {
    title: '2. Address analysis',
    subtitle: 'network, usable addresses and broadcast',
    lead: 'For this IP address, find the network address, the first and last usable address, the broadcast address and the number of usable host addresses. Also give the class, whether the address is public or private, and the subnet mask in the other notation.',
    class: 'Class',
    scope: 'Public or private',
    public: 'Public',
    private: 'Private',
    stepMask: (p: number, mask: string) => `<strong>Mask:</strong> /${p} means ${p} ones in a row: ${mask}.`,
    stepNetwork: (hostBits: number, net: string) =>
      `<strong>Network address</strong> = IP address AND subnet mask: the network bits stay, all ${hostBits} host bits become 0 → <span class="mono">${net}</span>.`,
    stepBroadcast: (bc: string) =>
      `<strong>Broadcast address:</strong> the same network bits, all host bits set to 1 → <span class="mono">${bc}</span>.`,
    stepFirstLast: (first: string, last: string) =>
      `<strong>First usable address</strong> = network address + 1 → <span class="mono">${first}</span>.<br><strong>Last usable address</strong> = broadcast address − 1 → <span class="mono">${last}</span>.`,
    stepHosts: (hostBits: number, total: string, usable: string) =>
      `<strong>Number of usable host addresses</strong> = 2<sup>${hostBits}</sup> − 2 = ${total} − 2 = <strong>${usable}</strong> (the network and broadcast addresses are not usable).`,
    stepClass: (first: number, from: number, to: number, cls: string) =>
      `<strong>Class:</strong> the first byte is ${first}, which lies between ${from} and ${to} → class <strong>${cls}</strong>.`,
    stepPrivate: '<strong>Private:</strong> the address lies in a private range (RFC 1918).',
    stepPublic: '<strong>Public:</strong> the address does not lie in any of the private ranges, so it is public.',
    privateRanges: 'Private ranges: 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.',
  },
  subnetting: {
    title: '3. Subnetting',
    subtitle: 'splitting a network into smaller networks',
    lead: 'Divide the network into at least the requested number of equally sized subnets. Work out how many bits you borrow, the new subnet mask and how many subnets and usable host addresses you get. Then write out the requested subnets in full. The subnets are numbered from <strong>subnet 1</strong>.',
    requested: 'Requested',
    atLeast: (n: number) => `at least ${n} networks`,
    calculation: 'Calculation',
    borrowedBits: 'Number of borrowed bits',
    newMask: 'New subnet mask',
    newPrefix: 'New prefix',
    subnetCount: 'Number of subnets',
    hostsPerSubnet: 'Usable host addresses per subnet',
    writeOut: 'Write out the subnets',
    name: (n: number) => `Subnet ${n}`,
    oldMaskRow: 'Old mask',
    newMaskRow: 'New mask',
    subnetsRule: 'subnets',
    allSubnets: 'All subnets',
    allSubnetsRegion: 'All subnets (scrollable)',
    showAll: (n: number) => `Show all ${n} subnets`,
    askedMarked: 'The requested subnets are highlighted.',
    col: { subnet: 'Subnet', network: 'Network address', first: 'First usable', last: 'Last usable', broadcast: 'Broadcast' },
    byteNames: ['1st', '2nd', '3rd', '4th'],
    stepBorrowed: (requested: number, n: number) =>
      `<strong>Borrowed bits:</strong> find the smallest number of bits n for which 2<sup>n</sup> ≥ ${requested}. ${
        n > 1 ? `2<sup>${n - 1}</sup> = ${2 ** (n - 1)} is too few, ` : ''
      }2<sup>${n}</sup> = ${2 ** n} is enough → <strong>${n} bit${n === 1 ? '' : 's'}</strong>.`,
    stepPrefix: (oldP: number, n: number, newP: number, mask: string) =>
      `<strong>New prefix</strong> = /${oldP} + ${n} = <strong>/${newP}</strong> → new subnet mask <span class="mono">${mask}</span>.`,
    stepCount: (n: number, count: string, last: number) =>
      `<strong>Number of subnets</strong> = 2<sup>${n}</sup> = <strong>${count}</strong> (subnet 1 up to and including subnet ${last}).`,
    stepHosts: (hostBits: number, total: string, usable: string) =>
      `<strong>Usable host addresses per subnet:</strong> ${hostBits} host bits remain → 2<sup>${hostBits}</sup> − 2 = ${total} − 2 = <strong>${usable}</strong>.`,
    stepBlock: (byteName: string, maskByte: number, magic: number) =>
      `<strong>Block size:</strong> in the ${byteName} byte the new mask is ${maskByte}, so 256 − ${maskByte} = <strong>${magic}</strong>. Each next subnet starts ${magic} higher in the ${byteName} byte.`,
    stepPerSubnet:
      '<strong>Per subnet:</strong> first usable = network address + 1, broadcast = next network address − 1, last usable = broadcast − 1.',
  },
}
