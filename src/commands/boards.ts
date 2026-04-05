import { Context, Markup } from 'telegraf';
import { sm } from '../sm';

export async function handleBoardsCommand(ctx: Context) {
  const boards = await sm.getBoards();
  if (!boards.length) {
    await ctx.reply('Tidak ada board tersedia.');
    return;
  }

  const lines = boards.map((b) => `📋 *${b.name}*`).join('\n');
  const buttons = boards.map((b) => [
    Markup.button.callback(`Lihat Tasks — ${b.name}`, `view:${b.id}:${b.name}`),
  ]);

  await ctx.reply(`*Boards kamu:*\n\n${lines}`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(buttons),
  });
}

export async function handleViewBoardCallback(ctx: Context, boardId: string, boardName: string) {
  const detail = await sm.getBoard(boardId);

  const parts: string[] = [`📋 *${boardName}*\n`];
  for (const col of detail.columns) {
    const tasks: any[] = detail.tasks?.filter((t: any) => t.columnId === col.id) ?? [];
    if (!tasks.length) continue;
    parts.push(`*${col.name}* (${tasks.length})`);
    for (const t of tasks.slice(0, 5)) {
      parts.push(`  • ${t.title}`);
    }
    if (tasks.length > 5) parts.push(`  _...dan ${tasks.length - 5} lainnya_`);
  }

  await ctx.editMessageText(parts.join('\n'), { parse_mode: 'Markdown' });
}
