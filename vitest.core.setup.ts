// Μόνο για το plugin «Vitest»: ό,τι κάνει μόνο του το ng test πριν από τα τεστ.
// (Δεν φορτώνουμε το src/test-setup.ts, γιατί το src είναι σύνδεσμος προς το OneDrive και το Vitest δεν το βρίσκει.)
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// 1. Ξυπνά το TestBed του Angular, για τα τεστ των store και των σελίδων.
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

// 2. Το ίδιο με το src/test-setup.ts: το jsdom δεν έχει window.matchMedia, και το Ionic το ζητά.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
