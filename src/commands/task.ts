import { Context, Markup } from 'telegraf';
import { sm } from '../sm';
import { boardListCard, columnListCard, priorityCard, taskCreatedCard } from '../card';
import { ConversationState } from '../types';

export const sessions = new Map<number, ConversationState>();

export async function handleTaskCommand(ctx: Context) {
  const userId = ctx.from!.id;
  const boards = await sm.getBoards();
  if (!boards.length) {
    await ctx.reply('Tidak ada board tersedia di SheetMaster.');
    return;
  }
  sessions.set(userId, { step: 'await_board' });
  const { text, keyboard } = boardListCard(boards);
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
}

export async function handleBoardCallback(ctx: Context, boardId: string, boardName: string) {
  const userId = ctx.from!.id;
  const state = sessions.get(userId);
  if (!state || state.step !== 'await_board') return;

  const detail = await sm.getBoard(boardId);
  sessions.set(userId, { ...state, step: 'await_column', boardId, boardName });

  const { text, keyboard } = columnListCard(detail.columns, boardName);
  await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
}

export async function handleColumnCallback(ctx: Context, columnId: string, columnName: string) {
  const userId = ctx.from!.id;
  const state = sessions.get(userId);
  if (!state || state.step !== 'await_column') return;

  sessions.set(userId, { ...state, step: 'await_title', columnId, columnName });
  await ctx.editMessageText(
    `📌 *${state.boardName}* > ${columnName}\n\nKetik *judul task:*`,
    { parse_mode: 'Markdown' }
  );
}

export async function handleTitleMessage(ctx: Context) {
  const userId = ctx.from!.id;
  const state = sessions.get(userId);
  if (!state || state.step !== 'await_title') return false;

  const title = (ctx.message as any).text as string;
  sessions.set(userId, { ...state, step: 'await_priority', title });

  const { text, keyboard } = priorityCard();
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  return true;
}

export async function handlePriorityCallback(ctx: Context, priority: string) {
  const userId = ctx.from!.id;
  const state = sessions.get(userId);
  if (!state || state.step !== 'await_priority') return;

  sessions.set(userId, { ...state, step: 'await_deadline', priority });
  await ctx.editMessageText(
    `⚡ *Prioritas:* ${priority}\n\nKetik *deadline* (format: YYYY-MM-DD) atau kirim /skip`,
    { parse_mode: 'Markdown' }
  );
}

export async function handleDeadlineMessage(ctx: Context) {
  const userId = ctx.from!.id;
  const state = sessions.get(userId);
  if (!state || state.step !== 'await_deadline') return false;

  const text = (ctx.message as any).text as string;
  const deadline = text === '/skip' ? undefined : text;

  await createTask(ctx, state, deadline);
  return true;
}

async function createTask(ctx: Context, state: ConversationState, deadline?: string) {
  const userId = ctx.from!.id;
  sessions.delete(userId);

  const task = await sm.createTask(state.boardId!, state.columnId!, state.title!, {
    priority: state.priority as any,
    deadline,
  });

  if (!task) {
    await ctx.reply('Gagal membuat task. Coba lagi dengan /task');
    return;
  }

  await ctx.reply(
    taskCreatedCard({
      title: state.title!,
      board: state.boardName!,
      column: state.columnName!,
      priority: state.priority!,
      deadline,
    }),
    { parse_mode: 'Markdown' }
  );
}

export function cancelSession(userId: number) {
  sessions.delete(userId);
}
