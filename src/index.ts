import 'dotenv/config';
import { Telegraf, Context } from 'telegraf';
import {
  sessions,
  handleTaskCommand,
  handleBoardCallback,
  handleColumnCallback,
  handleTitleMessage,
  handlePriorityCallback,
  handleDeadlineMessage,
  cancelSession,
} from './commands/task';
import { handleTaskClaudeCommand } from './commands/taskClaude';
import { handleBoardsCommand, handleViewBoardCallback } from './commands/boards';
import { handleDoneCommand, handleDoneCallback } from './commands/done';
import { handleSnapCommand } from './commands/snap';

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_USER_ID = process.env.ALLOWED_USER_ID
  ? parseInt(process.env.ALLOWED_USER_ID)
  : null;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is required');

const bot = new Telegraf(BOT_TOKEN);

// Auth guard
bot.use((ctx, next) => {
  if (ALLOWED_USER_ID && ctx.from?.id !== ALLOWED_USER_ID) {
    ctx.reply('Akses ditolak.');
    return;
  }
  return next();
});

// Commands
bot.start((ctx) =>
  ctx.reply(
    `👋 Halo! Saya bot task manager kamu.\n\n` +
      `/task — buat task baru (manual)\n` +
      `/task-claude — buat task via AI\n` +
      `/boards — lihat semua board\n` +
      `/done — tandai task selesai\n` +
      `/snap — snapshot semua project`
  )
);

bot.command('task', handleTaskCommand);
bot.command('task_claude', handleTaskClaudeCommand);
bot.on('text', async (ctx) => {
  const text = (ctx.message as any).text as string;

  // Handle /task-claude dengan tanda hubung (Telegram strips it to text sometimes)
  if (text.startsWith('/task-claude')) {
    await handleTaskClaudeCommand(ctx);
    return;
  }

  const state = sessions.get(ctx.from.id);
  if (!state) return;

  if (state.step === 'await_title') {
    await handleTitleMessage(ctx);
    return;
  }
  if (state.step === 'await_deadline') {
    await handleDeadlineMessage(ctx);
  }
});

bot.command('boards', handleBoardsCommand);
bot.command('done', handleDoneCommand);
bot.command('snap', handleSnapCommand);

// Callback queries
bot.on('callback_query', async (ctx) => {
  const data = (ctx.callbackQuery as any).data as string;
  await ctx.answerCbQuery();

  if (data === 'cancel') {
    cancelSession(ctx.from!.id);
    await ctx.editMessageText('❌ Dibatalkan.');
    return;
  }

  if (data.startsWith('board:')) {
    const [, boardId, boardName] = data.split(':');
    await handleBoardCallback(ctx, boardId, boardName);
    return;
  }

  if (data.startsWith('col:')) {
    const [, colId, colName] = data.split(':');
    await handleColumnCallback(ctx, colId, colName);
    return;
  }

  if (data.startsWith('priority:')) {
    const [, priority] = data.split(':');
    await handlePriorityCallback(ctx, priority);
    return;
  }

  if (data.startsWith('view:')) {
    const [, boardId, boardName] = data.split(':');
    await handleViewBoardCallback(ctx, boardId, boardName);
    return;
  }

  if (data.startsWith('done:')) {
    const [, taskId, doneColumnId] = data.split(':');
    await handleDoneCallback(ctx, taskId, doneColumnId);
    return;
  }
});

bot.launch(() => console.log('Bot running...'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
