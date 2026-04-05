import { Markup } from 'telegraf';

const PRIORITY_EMOJI: Record<string, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
  urgent: '🚨',
};

export function boardListCard(boards: { id: string; name: string }[]) {
  const buttons = boards.map((b) =>
    [Markup.button.callback(b.name, `board:${b.id}:${b.name}`)]
  );
  buttons.push([Markup.button.callback('❌ Batal', 'cancel')]);
  return {
    text: '📋 *Pilih board:*',
    keyboard: Markup.inlineKeyboard(buttons),
  };
}

export function columnListCard(
  columns: { id: string; name: string }[],
  boardName: string
) {
  const buttons = columns.map((c) =>
    [Markup.button.callback(c.name, `col:${c.id}:${c.name}`)]
  );
  buttons.push([Markup.button.callback('❌ Batal', 'cancel')]);
  return {
    text: `📌 *${boardName}*\n\nPilih kolom:`,
    keyboard: Markup.inlineKeyboard(buttons),
  };
}

export function priorityCard() {
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const buttons = [
    priorities.map((p) =>
      Markup.button.callback(`${PRIORITY_EMOJI[p]} ${p}`, `priority:${p}`)
    ),
    [Markup.button.callback('❌ Batal', 'cancel')],
  ];
  return {
    text: '⚡ *Pilih prioritas:*',
    keyboard: Markup.inlineKeyboard(buttons),
  };
}

export function taskCreatedCard(params: {
  title: string;
  board: string;
  column: string;
  priority: string;
  deadline?: string;
}) {
  const { title, board, column, priority, deadline } = params;
  const p = PRIORITY_EMOJI[priority] ?? '🟡';
  const dl = deadline ? `\n📅 *Deadline:* ${deadline}` : '';
  return (
    `✅ *Task dibuat!*\n\n` +
    `📝 ${title}\n` +
    `📋 *Board:* ${board}\n` +
    `📌 *Kolom:* ${column}\n` +
    `${p} *Prioritas:* ${priority}` +
    dl
  );
}
