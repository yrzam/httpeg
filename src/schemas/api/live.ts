/* eslint-disable import/prefer-default-export */
import { z } from 'zod';

function maybeArray<T extends z.ZodTypeAny>(schema: T) {
  return schema.or(z.array(schema));
}

const io = maybeArray(z.object({
  options: maybeArray(z.string()).optional(),
  format: z.string(),
}));

const avf = z.union([
  maybeArray(z.object({
    filter: z.string(),
    options: maybeArray(z.string()),
  })),
  maybeArray(z.string()),
]);

const cfspec = z.object({
  filter: z.string(),
  inputs: maybeArray(z.string()).optional(),
  outputs: maybeArray(z.string()).optional(),
  options: z.any(),
});

export const settings = z.object({
  input: io,
  output: io,
  vf: avf.optional(),
  af: avf.optional(),
  cf: z.object({
    spec: maybeArray(z.string().or(cfspec)),
    map: maybeArray(z.string()).optional(),
  }).optional(),
  timeout: z.number().optional(),
});
