import { Timestamp } from 'firebase/firestore';

export type NotificationType =
  | 'report_created'
  | 'report_verified'
  | 'report_upvoted'
  | 'status_updated'
  | 'resolved'
  | 'admin_message'
  | 'emergency_alert';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface GeoPointLite {
  lat: number;
  lng: number;
}

export interface CivicNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  relatedReportId?: string | null;
  createdAt: Date;
  severity?: AlertSeverity;
  area?: string;
  distanceKm?: number;
}

export interface NotificationDocument {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  relatedReportId?: string | null;
  createdAt: Timestamp;
  severity?: AlertSeverity;
  area?: string;
  distanceKm?: number;
}

export interface EmergencyAlertInput {
  title: string;
  description: string;
  severity: AlertSeverity;
  area: string;
  center: GeoPointLite;
  radiusKm: 1 | 5 | 10;
}

export interface PushMessagePayload {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  relatedReportId?: string | null;
}
