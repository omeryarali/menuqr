/**
 * Shared result shape for every Server Action.
 *
 * Actions return errors rather than throwing them: a thrown error in
 * production renders the generic error boundary and loses the message, which
 * is useless for "email already registered". Only unexpected faults throw.
 */
export type ActionState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export const idleState: ActionState = { status: "idle" };

export function errorState(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { status: "error", message, fieldErrors };
}
