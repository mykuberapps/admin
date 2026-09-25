"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './toast-provider';

export interface UploadTask {
  id: string;
  title: string;
  type: 'MOVIE' | 'SERIES';
  status: 'PENDING' | 'UPLOADING_ASSETS' | 'UPLOADING_VIDEO' | 'SYNCING_METADATA' | 'TRANSCODING' | 'COMPLETED' | 'FAILED';
  progress: number;
  overallProgress: number;
  error?: string;
  mediaId?: string;
  startTime: number;
}

interface UploadContextType {
  tasks: UploadTask[];
  addTask: (params: any) => Promise<void>;
  removeTask: (id: string) => void;
  cancelTask: (id: string) => Promise<void>;
  isIdle: boolean;
  isWidgetHidden: boolean;
  setWidgetHidden: (hidden: boolean) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) throw new Error('useUpload must be used within UploadProvider');
  return context;
};

// Deduce MIME type safely if browser leaves file.type empty (common for .mkv, .ts, .srt on Windows)
const resolveMimeType = (file: File): string => {
  if (file.type && file.type.trim() !== '') return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    ts: 'video/mp2t',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    vtt: 'text/vtt',
    srt: 'application/x-subrip',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    wav: 'audio/wav',
  };
  return (ext && map[ext]) || 'application/octet-stream';
};

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isWidgetHidden, setWidgetHidden] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { showToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const activeIntervals = useRef<Record<string, any>>({});
  const activeXhrs = useRef<Record<string, XMLHttpRequest>>({});

  const getAdminHeaders = useCallback(() => {
    const adminKey = typeof window !== 'undefined' 
      ? (localStorage.getItem('admin_api_key') || process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'kuber_admin_secret_key_2026')
      : (process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'kuber_admin_secret_key_2026');
    const adminUsername = typeof window !== 'undefined'
      ? (localStorage.getItem('admin_api_username') || 'Administrator')
      : 'Administrator';

    return {
      'Content-Type': 'application/json',
      'X-Admin-API-Key': adminKey,
      'X-Admin-Username': adminUsername
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(activeIntervals.current).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('kuber_upload_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((t: UploadTask) => {
          if (['UPLOADING_ASSETS', 'UPLOADING_VIDEO', 'SYNCING_METADATA'].includes(t.status)) {
            const targetId = t.mediaId || t.id;
            if (targetId) {
              fetch(`${apiUrl}/admin/videos/${targetId}/fail-upload`, {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify({ error: 'Upload interrupted by browser refresh.' })
              }).catch(() => {});
            }
            return { ...t, status: 'FAILED' as const, error: 'Upload interrupted by browser refresh.' };
          }
          return t;
        });
        setTasks(updated);
      } catch (e) { console.error("Hydration error:", e); }
    }
    setHydrated(true);
  }, [apiUrl, getAdminHeaders]);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('kuber_upload_tasks', JSON.stringify(tasks));
    }
  }, [tasks, hydrated]);

  const updateTask = useCallback((id: string, updates: Partial<UploadTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  // removeTask removes a task from the list/notification view.
  // CRITICAL: It does NOT abort background uploads! The transfer continues safely in the background.
  const removeTask = (id: string) => {
    if (activeIntervals.current[id]) {
      clearInterval(activeIntervals.current[id]);
      delete activeIntervals.current[id];
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // cancelTask explicitly cancels an active upload when the user confirms cancellation.
  const cancelTask = async (id: string) => {
    if (activeIntervals.current[id]) {
      clearInterval(activeIntervals.current[id]);
      delete activeIntervals.current[id];
    }
    if (activeXhrs.current[id]) {
      try {
        activeXhrs.current[id].abort();
      } catch (e) {}
      delete activeXhrs.current[id];
    }
    const task = tasks.find(t => t.id === id);
    const targetId = task?.mediaId || id;
    if (targetId) {
      try {
        await fetch(`${apiUrl}/admin/videos/${targetId}/fail-upload`, {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({ error: 'Upload cancelled by administrator.' })
        });
      } catch (e) {}
    }
    updateTask(id, {
      status: 'FAILED',
      error: 'Upload cancelled by administrator. You can re-upload the master video in Ingestion Studio.'
    });
    showToast(`Upload cancelled: ${task?.title || 'Entity'}`, "info");
  };

  const resumeTranscodingPoll = (taskId: string, mediaId: string) => {
    if (activeIntervals.current[taskId]) return;

    const poll = setInterval(async () => {
      try {
        const pRes = await fetch(`${apiUrl}/videos/${mediaId}`);
        const pData = await pRes.json();
        if (pData.success) {
          const item = pData.data;
          const currentProgress = 90 + ((item.processingProgress || 0) * 0.1);
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, overallProgress: Math.min(100, currentProgress) } : t));
          
          if (item.processingStatus === 'READY') {
            clearInterval(poll);
            delete activeIntervals.current[taskId];
            updateTask(taskId, { status: 'COMPLETED', overallProgress: 100 });
            showToast(`Asset ingestion & packaging complete: ${item.title}`, "success");
            setTimeout(() => removeTask(taskId), 8000);
          } else if (item.processingStatus === 'FAILED') {
            clearInterval(poll);
            delete activeIntervals.current[taskId];
            updateTask(taskId, { status: 'FAILED', error: item.processingLog || 'Transcoder job faulted' });
            showToast(`Transcoding faulted for: ${item.title}`, "error");
          }
        }
      } catch (e) { console.error("Transcoding poll error:", e); }
    }, 4000);

    activeIntervals.current[taskId] = poll;
  };

  useEffect(() => {
    if (!hydrated) return;
    tasks.forEach(task => {
      if (task.status === 'TRANSCODING' && task.mediaId) {
        resumeTranscodingPoll(task.id, task.mediaId);
      }
    });
  }, [hydrated]);

  const uploadToS3 = async (file: File, type: string, onProgress: (p: number) => void, taskId?: string): Promise<string> => {
    const contentType = resolveMimeType(file);
    const res = await fetch(`${apiUrl}/admin/upload/presigned-url`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ fileName: file.name, contentType, type })
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Failed to obtain upload ticket (${res.status}): ${errBody || res.statusText}`);
    }

    const data = await res.json();
    if (!data.success || !data.uploadUrl) {
      throw new Error(data.message || 'Failed to retrieve presigned URL from storage coordinator');
    }

    const { uploadUrl, publicUrl, contentType: backendContentType } = data;
    const finalContentType = backendContentType || contentType;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (taskId) activeXhrs.current[taskId] = xhr;
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', finalContentType);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (taskId) delete activeXhrs.current[taskId];
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(publicUrl);
        } else {
          reject(new Error(`S3 storage rejected payload: HTTP ${xhr.status} - ${xhr.responseText || xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        if (taskId) delete activeXhrs.current[taskId];
        reject(new Error(`Transport error uploading to S3 (status: ${xhr.status})`));
      };

      xhr.onabort = () => {
        if (taskId) delete activeXhrs.current[taskId];
        reject(new Error(`Upload cancelled by administrator.`));
      };

      xhr.send(file);
    });
  };

  const processTask = async (task: UploadTask, params: any) => {
    const { formData, poster, backdrop, master, episodes, movieSubtitles, movieAudioTracks } = params;
    const taskId = task.id;

    try {
      updateTask(taskId, { status: 'SYNCING_METADATA', progress: 0, overallProgress: 2 });
      
      const isEdit = !!params.mediaId;
      const isSeries = formData.type === 'SERIES';

      // Pre-filter valid tracks that have existing URLs (files will be attached after upload)
      const existingMovieSubs = (movieSubtitles || []).filter((s: any) => !s.file && s.url);
      const existingMovieAudios = (movieAudioTracks || []).filter((a: any) => !a.file && a.url);

      const hasAnyVideoUploaded = isSeries 
        ? episodes.some((ep: any) => ep.file) 
        : Boolean(master?.file);

      const initialPayload = {
        ...formData,
        // Only request transcoding when a new video file is actually uploaded
        qualitiesToCreate: hasAnyVideoUploaded ? params.selectedQualities : undefined,
        posterUrl: poster.file ? null : (poster.url || null),
        backdropUrl: backdrop.file ? null : (backdrop.url || null),
        url: (isEdit && !master?.file) ? (master?.url || null) : null,
        // NEVER assign an HLS .m3u8 playlist URL as masterUrl
        masterUrl: isSeries ? undefined : (master?.file ? null : undefined),
        processingStatus: (!isSeries && !master?.file) ? undefined : (isSeries && !episodes.some((ep: any) => ep.file)) ? undefined : 'UPLOADING',
        processingProgress: hasAnyVideoUploaded ? 0 : undefined,
        episodes: isSeries ? episodes.map((ep: any) => ({
          id: ep.id,
          title: ep.title,
          description: ep.description || '',
          seasonNumber: ep.seasonNumber ? Number(ep.seasonNumber) : 1,
          episodeNumber: ep.episodeNumber ? Number(ep.episodeNumber) : 1,
          processingStatus: ep.file ? 'UPLOADING' : undefined,
          processingProgress: ep.file ? 0 : undefined,
          url: ep.file ? null : (ep.url || (ep.masterUrl?.includes('.m3u8') ? ep.masterUrl : null)),
          masterUrl: ep.file ? null : (ep.masterUrl && !ep.masterUrl.includes('.m3u8') ? ep.masterUrl : undefined),
          thumbnail: ep.thumbnailFile ? null : (ep.thumbnailUrl || ep.thumbnail || null),
          subtitleTracks: (ep.subtitles || []).filter((s: any) => !s.file && s.url),
          audioTracks: (ep.audioTracks || []).filter((a: any) => !a.file && a.url)
        })) : [],
        audioTracks: !isSeries ? existingMovieAudios : [],
        subtitleTracks: !isSeries ? existingMovieSubs : [],
      };

      const initRes = await fetch(isEdit ? `${apiUrl}/admin/videos/${params.mediaId}` : `${apiUrl}/admin/videos`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(initialPayload)
      });

      if (!initRes.ok) {
        const errText = await initRes.text().catch(() => 'Unknown server error');
        throw new Error(`Database synchronization error: ${initRes.status} - ${errText}`);
      }
      const initResult = await initRes.json();
      const mediaId = initResult.data.id;
      const dbEpisodes = initResult.data.episodes || [];

      updateTask(taskId, { mediaId, status: 'UPLOADING_ASSETS', overallProgress: 5 });

      // 1. Upload Visual Assets
      if (poster?.file) {
        const posterUrl = await uploadToS3(poster.file, 'POSTER', (p) => 
          updateTask(taskId, { progress: p, overallProgress: 5 + (p * 0.04) }),
          taskId
        );
        await fetch(`${apiUrl}/admin/videos/${mediaId}/assets`, { 
          method: 'PATCH', 
          headers: getAdminHeaders(), 
          body: JSON.stringify({ posterUrl, processingProgress: 5 }) 
        });
      }
      
      if (backdrop?.file) {
        const backdropUrl = await uploadToS3(backdrop.file, 'BACKDROP', (p) => 
          updateTask(taskId, { progress: p, overallProgress: 9 + (p * 0.04) }),
          taskId
        );
        await fetch(`${apiUrl}/admin/videos/${mediaId}/assets`, { 
          method: 'PATCH', 
          headers: getAdminHeaders(), 
          body: JSON.stringify({ backdropUrl, processingProgress: 10 }) 
        });
      }

      // 2. Upload Movie Sidecar Subtitles & Audio (if Movie)
      if (!isSeries) {
        const pendingSubs = (movieSubtitles || []).filter((s: any) => Boolean(s.file));
        if (pendingSubs.length > 0) {
          const uploadedSubs: any[] = [];
          for (const sub of pendingSubs) {
            const subUrl = await uploadToS3(sub.file, 'SUBTITLE', () => {}, taskId);
            uploadedSubs.push({
              name: sub.name || sub.lang || 'Subtitle',
              language: sub.lang || 'en',
              url: subUrl,
              format: sub.file.name.endsWith('.srt') ? 'srt' : 'vtt'
            });
          }
          await fetch(`${apiUrl}/admin/videos/${mediaId}/assets`, {
            method: 'PATCH',
            headers: getAdminHeaders(),
            body: JSON.stringify({ subtitleTracks: uploadedSubs })
          });
        }

        const pendingAudios = (movieAudioTracks || []).filter((a: any) => Boolean(a.file));
        if (pendingAudios.length > 0) {
          const uploadedAudios: any[] = [];
          for (const aud of pendingAudios) {
            const audUrl = await uploadToS3(aud.file, 'AUDIO', () => {}, taskId);
            uploadedAudios.push({
              name: aud.name || aud.lang || 'Audio Track',
              language: aud.lang || 'hi',
              url: audUrl,
              isDefault: false
            });
          }
          await fetch(`${apiUrl}/admin/videos/${mediaId}/assets`, {
            method: 'PATCH',
            headers: getAdminHeaders(),
            body: JSON.stringify({ audioTracks: uploadedAudios })
          });
        }
      }

      // 3. Upload Video Ops
      updateTask(taskId, { status: 'UPLOADING_VIDEO', progress: 0, overallProgress: 15 });
      
      if (isSeries) {
        for (let i = 0; i < episodes.length; i++) {
          const ep = episodes[i];
          const dbEp = dbEpisodes.find((d: any) => 
            Number(d.episodeNumber) === Number(ep.episodeNumber) && 
            Number(d.seasonNumber) === Number(ep.seasonNumber)
          ) || dbEpisodes[i];
          const episodeId = dbEp?.id;

          if (!episodeId) {
            console.warn(`⚠️ Episode match missing for S${ep.seasonNumber}E${ep.episodeNumber}`);
            continue;
          }

          // Episode Thumbnail
          if (ep.thumbnailFile) {
            const thumbUrl = await uploadToS3(ep.thumbnailFile, 'THUMBNAIL', () => {}, taskId);
            await fetch(`${apiUrl}/admin/videos/${mediaId}/assets`, {
              method: 'PATCH',
              headers: getAdminHeaders(),
              body: JSON.stringify({ episodeId, thumbnail: thumbUrl, thumbnailUrl: thumbUrl })
            });
          }

          // Episode Subtitles
          const pendingEpSubs = (ep.subtitles || []).filter((s: any) => Boolean(s.file));
          if (pendingEpSubs.length > 0) {
            const uploadedSubs: any[] = [];
            for (const sub of pendingEpSubs) {
              const subUrl = await uploadToS3(sub.file, 'SUBTITLE', () => {}, taskId);
              uploadedSubs.push({
                name: sub.name || sub.lang || 'Subtitle',
                language: sub.lang || 'en',
                url: subUrl,
                format: sub.file.name.endsWith('.srt') ? 'srt' : 'vtt'
              });
            }
            await fetch(`${apiUrl}/admin/videos/${mediaId}/assets`, {
              method: 'PATCH',
              headers: getAdminHeaders(),
              body: JSON.stringify({ episodeId, subtitleTracks: uploadedSubs })
            });
          }

          // Episode Master Video
          if (ep.file) {
            const epUrl = await uploadToS3(ep.file, 'MOVIE', (p) => {
              const episodeSlice = 70 / Math.max(episodes.length, 1);
              updateTask(taskId, { 
                progress: p, 
                overallProgress: 15 + (i * episodeSlice) + (p * 0.01 * episodeSlice) 
              });
            }, taskId);
            await fetch(`${apiUrl}/admin/videos/${mediaId}/assets`, { 
              method: 'PATCH', 
              headers: getAdminHeaders(), 
              body: JSON.stringify({ 
                episodeId, 
                masterUrl: epUrl, 
                processingStatus: 'UPLOADED', 
                processingProgress: 100 
              }) 
            });
          }
        }
      } else if (master?.file) {
        const videoUrl = await uploadToS3(master.file, 'MOVIE', (p) => {
          updateTask(taskId, { progress: p, overallProgress: 15 + (p * 0.72) });
        }, taskId);
        await fetch(`${apiUrl}/admin/videos/${mediaId}/assets`, { 
          method: 'PATCH', 
          headers: getAdminHeaders(), 
          body: JSON.stringify({ 
            masterUrl: videoUrl, 
            processingStatus: 'UPLOADED', 
            processingProgress: 100 
          }) 
        });
      }

      // Transcoding state
      if (hasAnyVideoUploaded) {
        updateTask(taskId, { status: 'TRANSCODING', mediaId, overallProgress: 90 });
        resumeTranscodingPoll(taskId, mediaId);
      } else {
        // Metadata / visual only update completed
        updateTask(taskId, { status: 'COMPLETED', mediaId, overallProgress: 100 });
        showToast(`Entity updated successfully: ${formData.title}`, "success");
        setTimeout(() => removeTask(taskId), 4000);
      }

    } catch (err: any) {
      console.error(err);
      updateTask(taskId, { status: 'FAILED', error: err.message || 'Execution error' });
      showToast(`Ingestion pipeline halted: ${formData.title}`, "error");
    }
  };

  const addTask = async (params: any) => {
    const id = crypto.randomUUID();
    const newTask: UploadTask = {
      id,
      title: params.formData.title,
      type: params.formData.type,
      status: 'PENDING',
      progress: 0,
      overallProgress: 0,
      startTime: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
    setWidgetHidden(false);
    processTask(newTask, params);
  };

  return (
    <UploadContext.Provider value={{ tasks, addTask, removeTask, cancelTask, isIdle: tasks.length === 0, isWidgetHidden, setWidgetHidden }}>
      {children}
    </UploadContext.Provider>
  );
};
