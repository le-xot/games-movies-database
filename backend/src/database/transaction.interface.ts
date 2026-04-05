export interface TransactionManager {
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
