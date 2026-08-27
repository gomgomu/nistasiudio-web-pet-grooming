export type TimelineEventType =
  | 'APPOINTMENT'
  | 'CLINIC_VISIT'
  | 'MEDICAL_RECORD'
  | 'VACCINATION'
  | 'GROOMING'
  | 'NOTE'
  | 'INVOICE';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date | string;
  title: string;
  description?: string;
  actorName?: string;
  status?: string;
  metadata?: Record<string, any>;
}
