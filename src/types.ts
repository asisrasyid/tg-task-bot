export type ConversationStep =
  | 'idle'
  | 'await_board'
  | 'await_column'
  | 'await_title'
  | 'await_priority'
  | 'await_deadline';

export interface ConversationState {
  step: ConversationStep;
  boardId?: string;
  boardName?: string;
  columnId?: string;
  columnName?: string;
  title?: string;
  priority?: string;
}
