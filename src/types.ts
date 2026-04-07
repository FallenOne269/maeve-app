export interface RFAIMetrics {
  resonance: number;
  recursion_depth: number;
  coherence: number;
  ignition: boolean;
  fractal_branches: string[];
  meta_reflection: string;
  self_question: string;
  tensions: string[];
  confidence: number;
  dominant_lens: string;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  // base64-encoded data (without prefix)
  data: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "text/plain" | "application/pdf";
  isImage: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
  metrics?: RFAIMetrics;
  timestamp: Date;
  streaming?: boolean;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: string; data: string }; title?: string };
