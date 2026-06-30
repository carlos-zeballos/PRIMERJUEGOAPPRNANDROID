export interface DatabaseClient {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: (string | number | null)[]): Promise<void>;
  getAllAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

const memoryClient: DatabaseClient = {
  execAsync: async () => {},
  runAsync: async () => {},
  getAllAsync: async <T>() => [] as T[],
  getFirstAsync: async <T>() => null as T | null,
  withTransactionAsync: async (fn) => fn(),
};

// Web fallback — no persistence; mobile uses SQLiteClient.native.ts
export async function getDatabase(): Promise<DatabaseClient> {
  return memoryClient;
}
