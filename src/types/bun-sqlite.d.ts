declare module 'bun:sqlite' {
  import { EventEmitter } from 'events';

  export interface QueryOptions {
    returnValue?: 'rows' | 'result';
  }

  export interface RunResult {
    success: boolean;
    lastInsertRowid: number;
    changes: number;
  }

  export class Query extends EventEmitter {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    values(...params: any[]): any[];
    column(...params: any[]): any;
    columns(): Column[];
    finalize(): void;
  }

  export interface Column {
    name: string;
    type: string;
  }

  export class Database {
    constructor(filename: string, options?: { readonly?: boolean; create?: boolean });
    filename: string;
    closed: boolean;

    query<T = any>(sql: string, options?: QueryOptions): Query;
    prepare<T = any>(sql: string): Query;
    exec(sql: string): void;
    run(sql: string, ...params: any[]): RunResult;
    get<T = any>(sql: string, ...params: any[]): T | undefined;
    all<T = any>(sql: string, ...params: any[]): T[];
    values<T = any>(sql: string, ...params: any[]): T[];
    transaction<T>(fn: () => T): T;
    savepoint<T>(fn: () => T): T;
    vacuum(): void;
    close(): void;

    loadExtension(path: string): void;
    loadFile(path: string): void;

    setMaxListenerListeners(n: number): this;
    getMaxListenerListeners(): number;
    emit(eventName: string | symbol, ...args: any[]): boolean;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    once(eventName: string | symbol, listener: (...args: any[]) => void): this;
    off(eventName: string | symbol, listener: (...args: any[]) => void): this;
    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
  }

  export function open(filename: string, options?: { readonly?: boolean; create?: boolean }): Database;
}
