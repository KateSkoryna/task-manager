import { TFunction } from 'i18next';
import { toolCallLabel, extractLinkableTasks } from './agentToolLabels';
import { AgentToolCallSummary } from '../../hooks/useAgentChat';

const t = ((key: string) => key) as TFunction;

describe('toolCallLabel', () => {
  it('suppresses the chip for a confirmation_required failure', () => {
    // The `ProposalCard` already shows this exact moment — a chip saying
    // "Deleted task" here would claim a delete that hasn't happened yet.
    // See the destructive-retry note in agentToolLabels.ts.
    const toolCall: AgentToolCallSummary = {
      name: 'delete_task',
      input: { id: 't1' },
      result: { ok: false, reason: 'confirmation_required' },
    };
    expect(toolCallLabel(t, toolCall)).toBeNull();
  });

  it('labels a genuine (non-confirmation) failure distinctly from success', () => {
    const toolCall: AgentToolCallSummary = {
      name: 'delete_task',
      input: { id: 't1' },
      result: { ok: false, reason: 'not_found' },
    };
    expect(toolCallLabel(t, toolCall)).toBe('agent.tool.failed');
  });

  it('labels a successful delete_task normally', () => {
    const toolCall: AgentToolCallSummary = {
      name: 'delete_task',
      input: { id: 't1' },
      result: { ok: true, data: { id: 't1' } },
    };
    expect(toolCallLabel(t, toolCall)).toBe('agent.tool.deleteTask');
  });

  it('labels an in-flight call (no result yet) by its name, not as a failure', () => {
    const toolCall: AgentToolCallSummary = {
      name: 'create_tasks',
      input: { tasks: [{ name: 'Buy milk' }] },
    };
    expect(toolCallLabel(t, toolCall)).toBe('agent.tool.createTask');
  });
});

describe('extractLinkableTasks', () => {
  it('returns nothing for a confirmation_required failure', () => {
    const toolCall: AgentToolCallSummary = {
      name: 'delete_task',
      input: { id: 't1' },
      result: { ok: false, reason: 'confirmation_required' },
    };
    expect(extractLinkableTasks(toolCall)).toEqual([]);
  });

  it('returns the created tasks from a successful create_tasks result', () => {
    const toolCall: AgentToolCallSummary = {
      name: 'create_tasks',
      input: { tasks: [{ name: 'Buy milk' }] },
      result: {
        ok: true,
        data: [{ id: 't1', name: 'Buy milk', todolistId: null }],
      },
    };
    expect(extractLinkableTasks(toolCall)).toEqual([
      { id: 't1', name: 'Buy milk', todolistId: null },
    ]);
  });
});
