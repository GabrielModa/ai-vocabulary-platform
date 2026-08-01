import type { Database } from "./connection.js";

export interface TransactionPort<TContext> {
  run<T>(work: (context: TContext) => Promise<T>): Promise<T>;
}

export type DatabaseTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export function createTransactionPort(database: Database): TransactionPort<DatabaseTransaction> {
  return {
    run: <T>(work: (context: DatabaseTransaction) => Promise<T>) => database.transaction(work),
  };
}
