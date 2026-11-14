// Μόνο για το plugin «Vitest» του VS Code: ▶ δίπλα σε κάθε τεστ του πυρήνα.
// Το «npm test» (ng test) ΔΕΝ το διαβάζει. Ο πυρήνας είναι καθαρή TypeScript, γι' αυτό τρέχει και χωρίς Angular.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // το src είναι σύνδεσμος προς το OneDrive: έτσι τα τεστ δείχνουν στο C:\code\kalopsia\src που έχεις ανοιχτό
  resolve: { preserveSymlinks: true },
  test: {
    globals: true, // describe, it, expect χωρίς import, όπως στο ng test
    include: ['src/app/core/**/*.spec.ts'],
  },
});
