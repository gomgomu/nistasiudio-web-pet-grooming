import { AsyncLocalStorage } from 'async_hooks';
import { TenantContextData } from './tenant-context.interface';

export class TenantContextStorage {
  private static readonly storage = new AsyncLocalStorage<TenantContextData>();

  static run<R>(context: TenantContextData, fn: () => R): R {
    return this.storage.run(context, fn);
  }

  static get(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  static getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  static getActiveBranchId(): string | undefined {
    return this.storage.getStore()?.activeBranchId;
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
