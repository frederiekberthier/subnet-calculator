/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serveert de site onder /subnet-calculator/
  base: '/subnet-calculator/',
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
