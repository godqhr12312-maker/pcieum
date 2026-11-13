import type { Instrumentation } from 'next';
import { reportServerError } from './lib/observability';

/** Vinext registers this hook in the production RSC Worker. */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  // Deliberately never read request.headers or serialize the supplied objects.
  reportServerError(error, { path: request.path, method: request.method }, { routeType: context.routeType });
};
