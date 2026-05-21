'use client';
import { useEffect } from 'react';
import { getSocket, subscribeToAssignment, unsubscribeFromAssignment } from '../sockets/socket.client';
import { useGenerationStore } from '../store/generation.store';
import { useAssignmentStore } from '../store/assignment.store';
import type { GenerationProgressPayload, GenerationCompletedPayload, GenerationFailedPayload } from '../types/socket.types';

export function useGenerationSocket(assignmentId: string | null) {
  const { setProgress, setCompleted, setFailed } = useGenerationStore();
  const { updateAssignmentStatus } = useAssignmentStore();

  useEffect(() => {
    if (!assignmentId) return;

    const socket = getSocket();
    subscribeToAssignment(assignmentId);

    const onProgress = (payload: GenerationProgressPayload) => {
      if (payload.assignmentId !== assignmentId) return;
      setProgress(payload.progress, payload.stage, payload.message);
    };

    const onCompleted = (payload: GenerationCompletedPayload) => {
      if (payload.assignmentId !== assignmentId) return;
      setCompleted(payload.paperId);
      updateAssignmentStatus(assignmentId, 'completed');
    };

    const onFailed = (payload: GenerationFailedPayload) => {
      if (payload.assignmentId !== assignmentId) return;
      setFailed(payload.error);
      updateAssignmentStatus(assignmentId, 'failed');
    };

    socket.on('generation:progress', onProgress);
    socket.on('generation:processing', onProgress);
    socket.on('generation:completed', onCompleted);
    socket.on('generation:failed', onFailed);

    return () => {
      socket.off('generation:progress', onProgress);
      socket.off('generation:processing', onProgress);
      socket.off('generation:completed', onCompleted);
      socket.off('generation:failed', onFailed);
      unsubscribeFromAssignment(assignmentId);
    };
  }, [assignmentId, setProgress, setCompleted, setFailed, updateAssignmentStatus]);
}
