import { Context, Markup } from 'telegraf';
import { sm } from '../sm';

export async function handleDoneCommand(ctx: Context) {
  const boards = await sm.getBoards();
  if (!boards.length) {
    await ctx.reply('Tidak ada board tersedia.');
    return;
  }

  // Kumpulkan semua task yang bukan di kolom Done
  const pending: { taskId: string; title: string; board: string; doneColumnId: string }[] = [];

  for (const b of boards) {
    const detail = await sm.getBoard(b.id);
    const doneCol = detail.columns.find(
      (c: any) => c.name.toLowerCase() === 'done'
    );
    if (!doneCol) continue;

    const nonDoneTasks = (detail.tasks ?? []).filter(
      (t: any) => t.columnId !== doneCol.id
    );
    for (const t of nonDoneTasks) {
      pending.push({ taskId: t.id, title: t.title, board: b.name, doneColumnId: doneCol.id });
    }
  }

  if (!pending.length) {
    await ctx.reply('Tidak ada task yang pending. Semua sudah Done!');
    return;
  }

  const buttons = pending.slice(0, 10).map((t) => [
    Markup.button.callback(
      `✅ ${t.title.slice(0, 40)}`,
      `done:${t.taskId}:${t.doneColumnId}`
    ),
  ]);
  buttons.push([Markup.button.callback('❌ Batal', 'cancel')]);

  await ctx.reply('*Pilih task yang selesai:*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(buttons),
  });
}

export async function handleDoneCallback(ctx: Context, taskId: string, doneColumnId: string) {
  await sm.moveTask(taskId, doneColumnId);
  await ctx.editMessageText('✅ Task dipindahkan ke *Done*!', { parse_mode: 'Markdown' });
}
