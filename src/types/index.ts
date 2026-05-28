export type HoldType = "start" | "inter" | "top" | "hand" | "foot";

export type ProblemGradeColor =
  | "blanc"
  | "vert"
  | "bleu"
  | "rose"
  | "orange"
  | "jaune"
  | "noir";

export interface HoldPoint {
  x: number;
  y: number;
  type: HoldType;
}

export interface WallSubscription {
  id?: string;
  userId: string;
  wallId: string;
  createdAt: number;
}

export type AppNotificationType = "new_problem" | "new_comment" | "new_version";

export interface AppNotification {
  id?: string;
  userId: string;
  type: AppNotificationType;
  title: string;
  message: string;
  wallId?: string;
  problemId?: string;
  version?: string;
  isRead: boolean;
  createdAt: number;
}

export interface Wall {
  id?: string;
  name: string;
  createdBy: string;
  createdByName: string;
  createdByPhotoURL?: string;
  photoURL?: string;
  locationLabel?: string;
  mapsUrl?: string;
  blocksCount?: number;
  climbersCount?: number;
  createdAt: number;
}

export interface Problem {
  id?: string;
  wallId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  name: string;
  grade: ProblemGradeColor;
  description?: string;
  imageUrl: string;
  holds: HoldPoint[];
  markerSize?: number;
  createdAt: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
}

export interface ProblemComment {
  id?: string;
  problemId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  text: string;
  createdAt: number;
}

export interface ProblemRating {
  id?: string;
  problemId: string;
  authorId: string;
  proposedGrade: ProblemGradeColor;
  createdAt: number;
}