export interface LineTextMessage {
  type: 'text';
  text: string;
}

export interface LineFlexMessage {
  type: 'flex';
  altText: string;
  contents: Record<string, any>;
}

export type LineMessage = LineTextMessage | LineFlexMessage;

export interface LinePushOptions {
  to: string;
  messages: LineMessage[];
}

export interface LinePushResult {
  success: boolean;
  messageId?: string;
  timestamp: string;
  error?: string;
}

export interface LineWebhookEvent {
  type: string;
  mode?: string;
  timestamp: number;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
  };
  replyToken?: string;
  message?: {
    id: string;
    type: string;
    text?: string;
  };
  postback?: {
    data: string;
    params?: Record<string, any>;
  };
}

export interface LineWebhookPayload {
  destination?: string;
  events: LineWebhookEvent[];
}
