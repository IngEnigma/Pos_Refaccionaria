import 'zone.js';
import 'zone.js/testing';
import '@testing-library/jest-dom';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

const globalCrypto = ((globalThis as any).crypto ??= {});
if (typeof globalCrypto.randomUUID !== 'function') {
  Object.defineProperty(globalCrypto, 'randomUUID', {
    value: () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }),
    configurable: true,
    writable: true
  });
}

const testBed = getTestBed();
if (!testBed.platform) {
  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
  );
}
