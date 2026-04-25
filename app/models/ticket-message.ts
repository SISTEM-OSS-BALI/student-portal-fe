export interface TicketMessageDataModel {
  id: string;
  name: string;
  user_id: string;
  conversation_id?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessagePayloadCreateModel {
  name: string;
  user_id: string;
  conversation_id?: string;
}

export interface TicketMessagePayloadUpdateModel {
  name?: string;
  user_id?: string;
  conversation_id?: string;
}
