import axios, { AxiosError, AxiosInstance } from "axios";
import Cookies from "js-cookie";
import {
  AnimeRequest,
  AnimeResponse,
  EpisodeRequest,
  EpisodeResponse,
  ErrorResponse,
  JwtResponse,
  LoginRequest,
  PageResponse,
  RegisterRequest,
  WatchHistoryResponse,
  WatchProgressRequest,
} from "@/types/api";

// ─── Axios instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Injeta o JWT em todo request automaticamente
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      Cookies.remove("user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (data: LoginRequest): Promise<JwtResponse> => {
    const res = await api.post<JwtResponse>("/api/auth/login", data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<JwtResponse> => {
    const res = await api.post<JwtResponse>("/api/auth/register", data);
    return res.data;
  },
};

// ─── Animes ───────────────────────────────────────────────────────────────────

export const animeApi = {
  getAll: async (page = 0, size = 20): Promise<PageResponse<AnimeResponse>> => {
    const res = await api.get<PageResponse<AnimeResponse>>("/api/animes", {
      params: { page, size },
    });
    return res.data;
  },

  search: async (
    params: {
      title?: string;
      genre?: string;
      status?: string;
      year?: number;
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<AnimeResponse>> => {
    const res = await api.get<PageResponse<AnimeResponse>>("/api/animes/search", { params });
    return res.data;
  },

  getById: async (id: number): Promise<AnimeResponse> => {
    const res = await api.get<AnimeResponse>(`/api/animes/${id}`);
    return res.data;
  },

  getGenres: async (): Promise<string[]> => {
    const res = await api.get<string[]>("/api/animes/genres");
    return res.data;
  },

  create: async (data: AnimeRequest): Promise<AnimeResponse> => {
    const res = await api.post<AnimeResponse>("/api/animes", data);
    return res.data;
  },

  update: async (id: number, data: AnimeRequest): Promise<AnimeResponse> => {
    const res = await api.put<AnimeResponse>(`/api/animes/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/animes/${id}`);
  },

  uploadCover: async (id: number, file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    await api.post(`/api/animes/${id}/cover`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadBanner: async (id: number, file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    await api.post(`/api/animes/${id}/banner`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ─── Episodes ─────────────────────────────────────────────────────────────────

export const episodeApi = {
  getByAnime: async (animeId: number): Promise<EpisodeResponse[]> => {
    const res = await api.get<EpisodeResponse[]>(`/api/animes/${animeId}/episodes`);
    return res.data;
  },

  getById: async (animeId: number, episodeId: number): Promise<EpisodeResponse> => {
    const res = await api.get<EpisodeResponse>(`/api/animes/${animeId}/episodes/${episodeId}`);
    return res.data;
  },

  create: async (animeId: number, data: EpisodeRequest): Promise<EpisodeResponse> => {
    const res = await api.post<EpisodeResponse>(`/api/animes/${animeId}/episodes`, data);
    return res.data;
  },

  update: async (animeId: number, episodeId: number, data: EpisodeRequest): Promise<EpisodeResponse> => {
    const res = await api.put<EpisodeResponse>(`/api/animes/${animeId}/episodes/${episodeId}`, data);
    return res.data;
  },

  delete: async (animeId: number, episodeId: number): Promise<void> => {
    await api.delete(`/api/animes/${animeId}/episodes/${episodeId}`);
  },

  uploadVideo: async (animeId: number, episodeId: number, file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    await api.post(`/api/animes/${animeId}/episodes/${episodeId}/video`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadThumbnail: async (animeId: number, episodeId: number, file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    await api.post(`/api/animes/${animeId}/episodes/${episodeId}/thumbnail`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getVideoUploadSignature: async (
    animeId: number,
    episodeId: number
  ): Promise<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    publicId: string;
  }> => {
    const res = await api.post(`/api/animes/${animeId}/episodes/${episodeId}/video-signature`);
    return res.data;
  },

  confirmVideoUpload: async (
    animeId: number,
    episodeId: number,
    publicId: string
  ): Promise<void> => {
    await api.post(`/api/animes/${animeId}/episodes/${episodeId}/video-confirm`, { publicId });
  },
};

// ─── Favorites ────────────────────────────────────────────────────────────────

export const favoriteApi = {
  getAll: async (page = 0, size = 20): Promise<PageResponse<AnimeResponse>> => {
    const res = await api.get<PageResponse<AnimeResponse>>("/api/favorites", {
      params: { page, size },
    });
    return res.data;
  },

  add: async (animeId: number): Promise<void> => {
    await api.post(`/api/favorites/${animeId}`);
  },

  remove: async (animeId: number): Promise<void> => {
    await api.delete(`/api/favorites/${animeId}`);
  },

  check: async (animeId: number): Promise<boolean> => {
    const res = await api.get<boolean>(`/api/favorites/${animeId}/check`);
    return res.data;
  },
};

// ─── Watch History ────────────────────────────────────────────────────────────

export const historyApi = {
  getAll: async (page = 0, size = 20): Promise<PageResponse<WatchHistoryResponse>> => {
    const res = await api.get<PageResponse<WatchHistoryResponse>>("/api/history", {
      params: { page, size },
    });
    return res.data;
  },

  saveProgress: async (data: WatchProgressRequest): Promise<WatchHistoryResponse> => {
    const res = await api.post<WatchHistoryResponse>("/api/history", data);
    return res.data;
  },
};

// ─── Video streaming URL ──────────────────────────────────────────────────────

export const getStreamUrl = (episodeId: number): string => {
  return `${process.env.NEXT_PUBLIC_API_URL}/api/videos/stream/${episodeId}`;
};

export default api;