import { Context } from 'telegraf';
import { sm } from '../sm';

export async function handleSnapCommand(ctx: Context) {
  await ctx.reply('📊 Mengambil snapshot...');

  const boards = await sm.getBoards();
  const parts: string[] = ['📊 *Project Snapshot*\n'];

  for (const b of boards) {
    const detail = await sm.getBoard(b.id);
    const tasks: any[] = detail.tasks ?? [];
    const total = tasks.length;
    const done = tasks.filter((t: any) => {
      const doneCol = detail.columns.find((c: any) => c.name.toLowerCase() === 'done');
      return doneCol && t.columnId === doneCol.id;
    }).length;

    parts.push(`📋 *${b.name}*`);
    parts.push(`  Total: ${total} task, Done: ${done}`);

    for (const col of detail.columns) {
      const count = tasks.filter((t: any) => t.columnId === col.id).length;
      if (count > 0) parts.push(`  ${col.name}: ${count}`);
    }
    parts.push('');
  }

  await ctx.reply(parts.join('\n'), { parse_mode: 'Markdown' });
}
