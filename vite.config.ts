/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  // Relatieve paden: de build werkt in elke map (FTP-server, GitHub Pages, ...).
  // Kan omdat de app hash-routing gebruikt.
  base: './',
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
