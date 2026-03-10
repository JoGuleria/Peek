"use client";

/**
 * Records a short video from the user's camera and uploads it to Supabase Storage.
 * Uses the browser MediaRecorder API; max 15 seconds. Calls onUploadComplete with
 * the public URL when done.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MirroredVideo } from "@/components/MirroredVideo";

const MAX_DURATION_SEC = 15;

type Status =
  | "idle"
  | "loading"
  | "ready"
  | "recording"
  | "stopping"
  | "uploading"
  | "done"
  | "error";

export function VideoRecorder({
  userId,
  onUploadComplete,
  currentVideoUrl,
}: {
  userId: string;
  onUploadComplete: (url: string) => void;
  /** When set (e.g. from profile), show this video so the user can watch it and optionally replace it. */
  currentVideoUrl?: string | null;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 720, height: 1280 }, // portrait for mobile-style intro
        audio: true,
      });
      streamRef.current = stream;
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Could not access camera"
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp9,opus",
      videoBitsPerSecond: 2_500_000,
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      // Upload will be triggered in the same flow after state update
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setStatus("recording");
  }, []);

  const stopRecordingAndUpload = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || status !== "recording") return;
    setStatus("stopping");
    recorder.stop();
    recorderRef.current = null;
    stopCamera();

    // Wait a tick for ondataavailable to fire
    await new Promise((r) => setTimeout(r, 300));

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    if (blob.size === 0) {
      setStatus("error");
      setErrorMessage("Recording failed (no data). Try again.");
      return;
    }

    setStatus("uploading");
    const supabase = createClient();
    const path = `${userId}/intro.webm`;

    const { error: uploadError } = await supabase.storage
      .from("intros")
      .upload(path, blob, { upsert: true, contentType: "video/webm" });

    if (uploadError) {
      setStatus("error");
      setErrorMessage(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("intros").getPublicUrl(path);
    // Cache-bust so re-recording shows the new video instead of cached old one
    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
    setRecordedUrl(urlWithCacheBust);
    onUploadComplete(publicUrl);
    setStatus("done");
  }, [userId, status, stopCamera, onUploadComplete]);

  // Auto-stop after 15 seconds
  useEffect(() => {
    if (status !== "recording") return;
    const t = setTimeout(() => {
      stopRecordingAndUpload();
    }, MAX_DURATION_SEC * 1000);
    return () => clearTimeout(t);
  }, [status, stopRecordingAndUpload]);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach stream to video for live preview
  const setVideoSrc = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-300">Video intro (up to 15 sec)</p>

      {(recordedUrl || currentVideoUrl) && (
        <div className="space-y-2">
          <MirroredVideo src={recordedUrl || currentVideoUrl!} />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                const path = `${userId}/intro.webm`;
                await supabase.storage.from("intros").remove([path]);
                setRecordedUrl(null);
                onUploadComplete("");
                setStatus("idle");
                setErrorMessage(null);
              }}
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Delete and re-record
            </button>
            {recordedUrl && <p className="text-xs text-zinc-500">Video saved.</p>}
          </div>
        </div>
      )}

      {status === "idle" && (
        <button
          type="button"
          onClick={startCamera}
          className="w-full rounded-xl border-2 border-dashed border-zinc-600 py-6 text-zinc-400 transition-colors hover:border-cyan-500 hover:text-cyan-400"
        >
          {currentVideoUrl || recordedUrl ? "Record a new video" : "Allow camera and start"}
        </button>
      )}

      {status === "loading" && (
        <div className="flex h-48 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
          Asking for camera access…
        </div>
      )}

      {(status === "ready" || status === "recording") && (
        <div className="space-y-2">
          <div className="video-container relative w-full overflow-hidden rounded-xl bg-black">
            <video
              ref={setVideoSrc}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
            {status === "recording" && (
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-red-500/90 px-2 py-1 text-sm font-medium text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Recording (max {MAX_DURATION_SEC}s)
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {status === "ready" && (
              <button
                type="button"
                onClick={startRecording}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black"
              >
                Start recording
              </button>
            )}
            {status === "recording" && (
              <button
                type="button"
                onClick={stopRecordingAndUpload}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Stop and upload
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setStatus("idle");
                setErrorMessage(null);
              }}
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === "stopping" && (
        <div className="flex h-48 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
          Preparing…
        </div>
      )}

      {status === "uploading" && (
        <div className="flex h-48 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
          Uploading…
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
