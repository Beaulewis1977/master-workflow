import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient, createOptimisticUpdate, type PaginatedResponse } from './client';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import type { Profile } from '@/store/auth-store';

// Query Keys
export const queryKeys = {
  // Auth
  profile: () => ['profile'] as const,
  
  // Users
  users: () => ['users'] as const,
  user: (id: string) => ['users', id] as const,
  
  // Posts
  posts: () => ['posts'] as const,
  post: (id: string) => ['posts', id] as const,
  userPosts: (userId: string) => ['posts', 'user', userId] as const,
  
  // Chat
  chats: () => ['chats'] as const,
  chat: (id: string) => ['chats', id] as const,
  messages: (chatId: string) => ['chats', chatId, 'messages'] as const,
  
  // Notifications
  notifications: () => ['notifications'] as const,
} as const;

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author: User;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  participants: User[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file';
  metadata?: any;
  created_at: string;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  created_at: string;
}

// Profile Queries
export function useProfile() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => apiClient.get<Profile>('/profile'),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((state) => state.setProfile);
  const addToast = useAppStore((state) => state.addToast);
  
  return useMutation({
    mutationFn: (data: Partial<Profile>) => 
      apiClient.put<Profile>('/profile', data),
    ...createOptimisticUpdate<Profile>(
      queryKeys.profile(),
      (oldData) => oldData ? { ...oldData, ...data } : oldData!
    ),
    onSuccess: (data) => {
      setProfile(data);
      addToast({
        type: 'success',
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: 'Update failed',
        description: error.message || 'Failed to update profile.',
      });
    },
  });
}

// User Queries
export function useUsers(params?: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: [...queryKeys.users(), params],
    queryFn: () => apiClient.get<PaginatedResponse<User>>('/users', params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => apiClient.get<User>(`/users/${id}`),
    enabled: !!id,
  });
}

// Post Queries
export function usePosts(params?: { page?: number; limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.posts(), params],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PaginatedResponse<Post>>('/posts', {
        ...params,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => apiClient.get<Post>(`/posts/${id}`),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const addToast = useAppStore((state) => state.addToast);
  
  return useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      apiClient.post<Post>('/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts() });
      addToast({
        type: 'success',
        title: 'Post created',
        description: 'Your post has been published successfully.',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: 'Creation failed',
        description: error.message || 'Failed to create post.',
      });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      isLiked 
        ? apiClient.delete(`/posts/${postId}/like`)
        : apiClient.post(`/posts/${postId}/like`),
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.post(postId) });
      
      const previousPost = queryClient.getQueryData<Post>(queryKeys.post(postId));
      
      if (previousPost) {
        queryClient.setQueryData<Post>(queryKeys.post(postId), {
          ...previousPost,
          is_liked: !isLiked,
          likes_count: isLiked 
            ? previousPost.likes_count - 1 
            : previousPost.likes_count + 1,
        });
      }
      
      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(queryKeys.post(postId), context.previousPost);
      }
    },
    onSettled: (data, error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
    },
  });
}

// Chat Queries
export function useChats() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: queryKeys.chats(),
    queryFn: () => apiClient.get<Chat[]>('/chats'),
    enabled: !!user,
  });
}

export function useChat(id: string) {
  return useQuery({
    queryKey: queryKeys.chat(id),
    queryFn: () => apiClient.get<Chat>(`/chats/${id}`),
    enabled: !!id,
  });
}

export function useMessages(chatId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(chatId),
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PaginatedResponse<Message>>(`/chats/${chatId}/messages`, {
        page: pageParam,
        limit: 50,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    enabled: !!chatId,
    initialPageParam: 1,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, content, type = 'text' }: { 
      chatId: string; 
      content: string; 
      type?: 'text' | 'image' | 'file' 
    }) =>
      apiClient.post<Message>(`/chats/${chatId}/messages`, { content, type }),
    onSuccess: (data, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
}

// Notification Queries
export function useNotifications() {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => apiClient.get<NotificationData[]>('/notifications'),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.patch(`/notifications/${notificationId}`, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}

// File Upload
export function useUploadFile() {
  const addToast = useAppStore((state) => state.addToast);
  
  return useMutation({
    mutationFn: ({ file, path }: { file: File; path?: string }) =>
      apiClient.upload<{ url: string; path: string }>('/upload', file, { path }),
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: 'Upload failed',
        description: error.message || 'Failed to upload file.',
      });
    },
  });
}