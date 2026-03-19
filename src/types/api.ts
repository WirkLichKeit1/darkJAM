// ─── Enums ────────────────────────────────────────────────────────────────────

export type AnimeStatus = "ONGOING" | "COMPLETED" | "UPCOMING" | "CANCELLED";
export type VideoStatus = "PROCESSING" | "READY" | "ERROR";
export type Role = "USER" | "ADMIN";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface JwtResponse {
    token: string;
    type: string;
    username: string;
    role: Role;
}

// ─── Anime ────────────────────────────────────────────────────────────────────

export interface AnimeResponse {
    id: number;
    title: string;
    originalTitle: string | null;
    synopsis: string | null;
    genre: string | null;
    studio: string | null;
    releaseYear: number | null;
    status: AnimeStatus;
    coverImageUrl: string | null;
    bannerImageUrl: string | null;
    rating: number | null;
    totalEpisodes: number;
    createdAt: string;
    updatedAt: string;
}

export interface AnimeRequest {
    title: string;
    originalTitle?: string;
    synopsis?: string;
    genre?: string;
    studio?: string;
    releaseYear?: number;
    status?: AnimeStatus;
    rating?: number;
}

// ─── Episode ────────────────────────────────────────────────────────────────────

export interface EpisodeResponse {
  id: number;
  animeId: number;
  animeTitle: string;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  synopsis: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  streamUrl: string | null;
  videoStatus: VideoStatus;
  views: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeRequest {
  title: string;
  episodeNumber: number;
  seasonNumber?: number;
  synopsis?: string;
  durationSeconds?: number;
  published?: boolean;
}

// ─── Watch History ────────────────────────────────────────────────────────────

export interface WatchHistoryResponse {
  id: number;
  episodeId: number;
  episodeTitle: string;
  episodeNumber: number;
  seasonNumber: number;
  animeId: number;
  animeTitle: string;
  animeCoverImageUrl: string | null;
  progressSeconds: number;
  completed: boolean;
  watchedAt: string;
}

export interface WatchProgressRequest {
  episodeId: number;
  progressSeconds: number;
  completed: boolean;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

// ─── Error ───────────────────────────────────────────────────────────────

export interface ErrorResponse {
    status: number;
    message: string;
    timestamp: string;
    errors?: Record<string, string>;
}