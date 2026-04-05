import { SheetMasterClient } from 'sheetmaster-sdk';

if (!process.env.SHEETMASTER_KEY || !process.env.SHEETMASTER_URL) {
  throw new Error('SHEETMASTER_KEY and SHEETMASTER_URL are required');
}

export const sm = new SheetMasterClient({
  apiKey: process.env.SHEETMASTER_KEY,
  baseUrl: process.env.SHEETMASTER_URL,
});
