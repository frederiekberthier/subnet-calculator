// Binaire AND-uitwerking: IP-adres en masker onder elkaar, daaronder netwerk- en broadcastadres.
// De grens tussen netwerk- en hostdeel is een verticale lijn; het hostdeel heeft een eigen kleur.
// Met oldPrefix (subnetten) krijgen de geleende subnetbits een derde kleur.
import { formatIp, formatBinary } from '../lib/ipv4'

interface Row {
  label: string
  value: number
  /** Scheidingslijn boven deze rij, met tekst (bv. "AND"). */
  ruleAbove?: string
}

function zone(pos: number, prefix: number, oldPrefix: number): string {
  if (pos >= prefix) return 'host'
  return pos >= oldPrefix ? 'sub' : 'net'
}

function bitsHtml(value: number, prefix: number, oldPrefix: number): string {
  const bytes = formatBinary(value).split('.')
  return bytes
    .map(
      (byte, b) =>
        `<span class="at-byte">${[...byte]
          .map((bit, i) => {
            const pos = b * 8 + i
            const boundary = pos === prefix || (pos === oldPrefix && oldPrefix < prefix)
            const classes = [bit === '1' ? 'on' : 'off', zone(pos, prefix, oldPrefix), boundary ? 'boundary' : '']
            return `<span class="${classes.join(' ').trim()}">${bit}</span>`
          })
          .join('')}</span>`,
    )
    .join('<span class="at-dot">.</span>')
}

export function andTableHtml(rows: Row[], prefix: number, oldPrefix = prefix): string {
  const subBits = prefix - oldPrefix
  return `
    <div class="and-table" role="table" aria-label="Binaire uitwerking">
      ${rows
        .map(
          (row) => `
        ${row.ruleAbove ? `<div class="at-rule" role="presentation"><span>${row.ruleAbove}</span></div>` : ''}
        <div class="at-row" role="row">
          <span class="at-label" role="rowheader">${row.label}</span>
          <span class="at-bits mono" role="cell" aria-label="${formatBinary(row.value)}">${bitsHtml(row.value, prefix, oldPrefix)}</span>
          <span class="at-dec mono" role="cell">${formatIp(row.value)}</span>
        </div>`,
        )
        .join('')}
    </div>
    <p class="bs-split">
      <span class="bs-key net"></span>${oldPrefix} netwerkbits
      ${subBits > 0 ? `<span class="bs-key at-key-sub"></span>${subBits} subnetbits` : ''}
      <span class="bs-key host at-key-host"></span>${32 - prefix} hostbits
    </p>`
}
