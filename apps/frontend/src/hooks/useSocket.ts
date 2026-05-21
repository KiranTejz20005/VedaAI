'use client';
import { useEffect, useRef } from 'react';
import { getSocket, subscribeToAssignment, unsubscribeFromAssignment } from '../sockets/socket.client';
import { useGenerationStore } from '../store/generation.store';
import { useAssignmentStore } from '../store/assignment.store';
import type { GenerationProgressPayload, GenerationCompletedPayload, GenerationFailedPayload, GenerationQueuedPayload } from '../types/socket.types';

export function useGenerationSocket(assignmentId: string | null) {
  const setProgress = useGenerationStore((s) => s.setProgress);
  const setCompleted = useGenerationStore((s) => s.setCompleted);
  const setFailed = useGenerationStore((s) => s.setFailed);
  const setQueued = useGenerationStore((s) => s.setQueued);
  const updateAssignmentStatus = useAssignmentStore((s) => s.updateAssignmentStatus);
  const callbacksRef = useRef({ setProgress, setCompleted, setFailed, setQueued, updateAssignmentStatus });
  callbacksRef.current = { setProgress, setCompleted, setFailed, setQueued, updateAssignmentStatus };
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!assignmentId) return;

    const socket = getSocket();

    if (!subscribedRef.current) {
      subscribeToAssignment(assignmentId);
      subscribedRef.current = true;
    }

    const onQueued = (payload: GenerationQueuedPayload) => {
      if (payload.assignmentId !== assignmentId) return;
      callbacksRef.current.setQueued();
      callbacksRef.current.updateAssignmentStatus(assignmentId, 'queued');
    };

    const onProgress = (payload: GenerationProgressPayload) => {
      if (payload.assignmentId !== assignmentId) return;
      callbacksRef.current.setProgress(payload.progress, payload.stage, payload.message);
    };

    const onCompleted = (payload: GenerationCompletedPayload) => {
      if (payload.assignmentId !== assignmentId) return;
      callbacksRef.current.setCompleted(payload.paperId);
      callbacksRef.current.updateAssignmentStatus(assignmentId, 'completed');
    };

    const onFailed = (payload: GenerationFailedPayload) => {
      if (payload.assignmentId !== assignmentId) return;
      callbacksRef.current.setFailed(payload.error);
      callbacksRef.current.updateAssignmentStatus(assignmentId, 'failed');
    };

    socket.on('generation:queued', onQueued);
    socket.on('generation:progress', onProgress);
    socket.on('generation:processing', onProgress);
    socket.on('generation:completed', onCompleted);
    socket.on('generation:failed', onFailed);

    return () => {
      socket.off('generation:queued', onQueued);
      socket.off('generation:progress', onProgress);
      socket.off('generation:processing', onProgress);
      socket.off('generation:completed', onCompleted);
      socket.off('generation:failed', onFailed);
      unsubscribeFromAssignment(assignmentId);
      subscribedRef.current = false;
    };
  }, [assignmentId]);
}
