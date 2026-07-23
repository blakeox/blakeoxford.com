import type { Env } from '../types';

export type RouteContext = {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
  url: URL;
  reqId: string;
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sentry?: any;
};
