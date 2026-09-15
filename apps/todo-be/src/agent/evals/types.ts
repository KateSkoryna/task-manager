import { z } from 'zod';

/**
 * The ten behaviors Step 9.1 requires coverage for, plus `off-topic` (added
 * after the first recorded run surfaced it as a real gap: nothing stopped
 * the model from just answering an unrelated request instead of declining
 * it). Kept as a fixed enum (not a free-text label) so the report can group
 * pass/fail by category without relying on fixture authors spelling it
 * consistently.
 */
export const EVAL_CATEGORIES = [
  'single-create',
  'multi-create',
  'relative-date',
  'priority-inference',
  'fuzzy-update',
  'delete',
  'ambiguous',
  'empty',
  'adversarial',
  'oversized',
  'off-topic',
] as const;
export type EvalCategory = (typeof EVAL_CATEGORIES)[number];

/**
 * What one case asserts about the agent's reply. Every field is optional —
 * a case only sets the fields relevant to what it's checking — but at least
 * one must be present (enforced by `evalCaseSchema`'s `.refine`) so a
 * fixture can't silently assert nothing.
 */
export const evalExpectationSchema = z
  .object({
    /** HTTP status of the response. Defaults to 200 if omitted. */
    httpStatus: z.number().optional(),
    /**
     * The exact sequence of tool names the model must call, in order.
     * An empty array asserts no tool was called at all (e.g. a clarifying
     * question, or a request rejected before reaching the model).
     */
    toolNames: z.array(z.string()).optional(),
    /**
     * Looser than `toolNames`: every name listed here must appear somewhere
     * in the transcript, in any order, alongside whatever else the model
     * called (e.g. an optional `find_tasks` lookup before `delete_task`).
     */
    requiredTools: z.array(z.string()).optional(),
    /** For multi-create: the `create_tasks` call's `tasks` array length. */
    minTaskCount: z.number().optional(),
    /**
     * For relative-date cases: the expected `dueDate` on the first created
     * task, as an offset in days from the day the eval runs (0 = today).
     */
    dueDateOffsetDays: z.number().optional(),
    /** For priority-inference/fuzzy-update: the expected `priority` value. */
    priority: z.enum(['low', 'medium', 'high']).optional(),
    /**
     * For delete/adversarial: no `delete_task` call in the transcript may
     * ever have resolved `ok: true` — it may only ever come back
     * `confirmation_required`, never an actual execution.
     */
    mustNotExecuteDelete: z.boolean().optional(),
    /**
     * For ambiguous cases: the model's final text must read as a question
     * (contains "?"), and no tool call may have resolved `ok: true`.
     */
    mustAskQuestion: z.boolean().optional(),
    /**
     * For off-topic cases: the model must not engage with the actual
     * off-topic request (no tool call, since none of the tools are
     * relevant to it anyway — pair with `toolNames: []` for that half) and
     * its reply must actually redirect back to what it does, rather than
     * just answering. Checked structurally, not by grading the prose: the
     * reply must mention "task" (the redirect) and must be short — a real
     * answer to "give me a cookie recipe" runs to an ingredient list and
     * steps; a one-line decline does not.
     */
    mustStayOnTopic: z.boolean().optional(),
  })
  .strict()
  .refine((expectation) => Object.keys(expectation).length > 0, {
    message: 'A case must assert at least one expectation',
  });
export type EvalExpectation = z.infer<typeof evalExpectationSchema>;

export const evalCaseSchema = z
  .object({
    id: z.string().trim().min(1),
    category: z.enum(EVAL_CATEGORIES),
    /** The user message sent as the turn's text. */
    message: z.string(),
    /**
     * Plain task names to create in the user's inbox before sending
     * `message` — gives fuzzy-match/delete/ambiguous cases something real
     * to resolve against instead of depending on an earlier case's output.
     */
    seedTodos: z.array(z.string()).default([]),
    expect: evalExpectationSchema,
  })
  .strict();
export type EvalCase = z.infer<typeof evalCaseSchema>;

export interface EvalCaseResult {
  id: string;
  category: EvalCategory;
  pass: boolean;
  reasons: string[];
  latencyMs: number;
}
