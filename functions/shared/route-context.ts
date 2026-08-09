import type { Env } from '../types';

export type RouteContext = {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
  url: URL;
  reqId: string;
  method: string;
  Sentry?: any;
};
