import 'server-only';
import {createHostingerDatabase} from './hostinger-node-d1.mjs';

// Explicit Node target only. Credentials are supplied by the hosting environment.
if(process.env.HOSTINGER_NODE_RUNTIME!=='1')throw Error('hostinger_node_target_required');
const database = process.env.DATABASE_URL || (process.env.DB_NAME&&process.env.DB_USER&&process.env.DB_PASSWORD)
  ? createHostingerDatabase() : undefined;
export const env = Object.freeze({...process.env,DB:database}) as unknown as Cloudflare.Env;
export function waitUntil(promise:Promise<unknown>) { void promise.catch(()=>console.error('node_background_operation_failed')); }
export class WorkerEntrypoint {}
export class DurableObject {}
export class WorkflowEntrypoint {}
