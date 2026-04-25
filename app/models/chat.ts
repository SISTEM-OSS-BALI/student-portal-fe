type MessageAttachment = {
  id?: string;
  name: string;
  url: string;
  mime_type?: string;
  size?: number;
};

type SendMessageAttachment = {
  url: string;
  name: string;
  mime_type?: string;
  size?: number;
};

export type ChatConversationApiModel = {
  id: string;
  type: string;
  title?: string | null;
  created_by_id: string;
  member_ids: string[];
  attachments?: MessageAttachment[];
  created_at: string;
  updated_at: string;
};

export type ChatConversation = ChatConversationApiModel;

export type ChatMessageApiModel = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string | null;
  sender_role?: string | null;
  type: string;
  text?: string | null;
  reply_to_id?: string | null;
  mention_user_ids?: string[];
  attachments?: MessageAttachment[];
  context_user_id?: string | null;
  context_type?: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
};

export type ChatMessage = ChatMessageApiModel;

export type ChatSendPayload = {
  conversation_id: string;
  type?: string;
  text?: string;
  reply_to_id?: string;
  mention_user_ids?: string[];
  attachments?: SendMessageAttachment[];
  context_user_id?: string | null;
  context_type?: string | null;
};

export type MentionMessageApiModel = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string | null;
  type: string;
  text?: string | null;
  created_at: string;
  context_user_id?: string | null;
  context_type?: string | null;
  context_user_name?: string | null;
  is_read: boolean;
};

export type MentionMessage = MentionMessageApiModel;
