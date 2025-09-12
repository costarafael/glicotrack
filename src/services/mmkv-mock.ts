/**
 * Mock MMKV for testing without react-native-mmkv dependency
 * This allows bundle generation while Firebase/MMKV issues are resolved
 */

export class MMKV {
  private storage: Map<string, any> = new Map();

  set(key: string, value: any): void {
    console.warn(`[MMKV MOCK] Setting ${key} - value will not persist`);
    this.storage.set(key, value);
  }

  getString(key: string): string | undefined {
    console.warn(`[MMKV MOCK] Getting ${key} - returning mock value`);
    return this.storage.get(key);
  }

  getNumber(key: string): number | undefined {
    console.warn(`[MMKV MOCK] Getting number ${key} - returning mock value`);
    return this.storage.get(key);
  }

  getBoolean(key: string): boolean | undefined {
    console.warn(`[MMKV MOCK] Getting boolean ${key} - returning mock value`);
    return this.storage.get(key);
  }

  delete(key: string): void {
    console.warn(`[MMKV MOCK] Deleting ${key} - mock only`);
    this.storage.delete(key);
  }

  getAllKeys(): string[] {
    console.warn(`[MMKV MOCK] Getting all keys - mock only`);
    return Array.from(this.storage.keys());
  }

  clearAll(): void {
    console.warn(`[MMKV MOCK] Clearing all - mock only`);
    this.storage.clear();
  }
}