# subnet-calculator
Een online subnet calculator voor de studenten van Howest - graduaat IoT en bachelor MCT - CTAI

## Oefeningen
1. **Omrekenen** (binair ↔ decimaal) – IPv4-adres en subnetmasker omzetten.
2. **Adresanalyse** – netwerkadres, eerste/laatste host, broadcast, klasse, publiek/privaat.
3. **Subnetten** – een netwerk splitsen in minstens N even grote subnetten (2^n subnetten, genummerd vanaf subnet 0; nooit supernetting, maximum /30).

## Lokaal ontwikkelen
Vereist Node.js.

```bash
npm install
npm run dev      # ontwikkelserver
npm test         # unit tests (Vitest)
npm run build    # productiebuild in dist/
```
