// Μόνο για το plugin «Vitest» του VS Code: ▶ δίπλα σε ΚΑΘΕ τεστ (πυρήνας, store, σελίδες).
// Το «npm test» (ng test) ΔΕΝ το διαβάζει· τρέχει τα ίδια τεστ με τον δικό του τρόπο.
// Το plugin του Analog κάνει ό,τι κάνει και το ng test: μεταφράζει τα @Component και τα html τους (templateUrl).
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [angular({ tsconfig: 'tsconfig.spec.json' })],
  // το src είναι σύνδεσμος προς το OneDrive: έτσι τα τεστ δείχνουν στο C:\code\kalopsia\src που έχεις ανοιχτό
  resolve: { preserveSymlinks: true },
  test: {
    globals: true, // describe, it, expect χωρίς import, όπως στο ng test
    environment: 'jsdom', // ένας ψεύτικος browser, γιατί οι σελίδες και το TestBed τον χρειάζονται
    setupFiles: ['./vitest.core.setup.ts'],
    include: ['src/**/*.spec.ts'], // κάθε νέο .spec.ts μπαίνει μόνο του
  },
});
