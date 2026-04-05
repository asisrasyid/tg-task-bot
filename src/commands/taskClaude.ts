import { Context } from 'telegraf';
import Anthropic from '@anthropic-ai/sdk';
import { sm } from '../sm';
import { taskCreatedCard } from '../card';

interface ParsedTask {
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  boardHint?: string;
  columnHint?: string;
}

async function parseWithClaude(message: string): Promise<ParsedTask | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Ekstrak informasi task dari pesan ini dan kembalikan sebagai JSON.

Pesan: "${message}"

Format JSON (isi null jika tidak disebutkan):
{
  "title": "judul task yang jelas dan ringkas",
  "priority": "low|medium|high|urgent",
  "deadline": "YYYY-MM-DD atau null",
  "boardHint": "nama board yang relevan atau null",
  "columnHint": "nama kolom/status yang relevan atau null"
}

Hanya kembalikan JSON, tidak ada teks lain.`,
        },
      ],
    });

    const raw = (response.content[0] as any).text as string;
    return JSON.parse(raw.trim()) as ParsedTask;
  } catch {
    return null;
  }
}

export async function handleTaskClaudeCommand(ctx: Context) {
  const args = (ctx.message as any).text?.replace('/task-claude', '').trim() as string;

  if (!args) {
    await ctx.reply(
      '📝 Kirim pesan setelah /task-claude\n\nContoh:\n`/task-claude Fix bug login page, urgent, deadline besok`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.reply('🤖 Menganalisis pesan...');

  const parsed = await parseWithClaude(args);

  if (!parsed) {
    await ctx.reply(
      '⚠️ Claude tidak tersedia. Gunakan /task untuk membuat task secara manual.'
    );
    return;
  }

  // Ambil board pertama atau cari berdasarkan hint
  const boards = await sm.getBoards();
  if (!boards.length) {
    await ctx.reply('Tidak ada board di SheetMaster.');
    return;
  }

  let board = boards[0];
  if (parsed.boardHint) {
    const hint = parsed.boardHint.toLowerCase();
    const match = boards.find((b) => b.name.toLowerCase().includes(hint));
    if (match) board = match;
  }

  const detail = await sm.getBoard(board.id);
  let column = detail.columns[0];
  if (parsed.columnHint) {
    const hint = parsed.columnHint.toLowerCase();
    const match = detail.columns.find((c: any) =>
      c.name.toLowerCase().includes(hint)
    );
    if (match) column = match;
  }

  const task = await sm.createTask(board.id, column.id, parsed.title, {
    priority: parsed.priority,
    deadline: parsed.deadline ?? undefined,
  });

  if (!task) {
    await ctx.reply('Gagal membuat task. Coba lagi.');
    return;
  }

  await ctx.reply(
    taskCreatedCard({
      title: parsed.title,
      board: board.name,
      column: column.name,
      priority: parsed.priority,
      deadline: parsed.deadline ?? undefined,
    }),
    { parse_mode: 'Markdown' }
  );
}
