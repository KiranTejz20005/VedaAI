import { useState, useCallback, useEffect } from 'react';
import { copilotService } from '@/services/copilot.service';
import toast from 'react-hot-toast';

export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration: string;
  objectives: string;
  activities: any;
  assessments: any;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useLessonPlanner() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await copilotService.getLessonPlans();
      setPlans(data);
    } catch (e) {
      toast.error('Failed to load lesson plans history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const generatePlan = async (subject: string, topic: string, duration: string, learningOutcomes: string) => {
    if (!subject || !topic || !duration) {
      toast.error('Subject, Topic, and Duration are required');
      return null;
    }
    
    try {
      setIsGenerating(true);
      const plan = await copilotService.generateLessonPlan({
        subject,
        topic,
        duration: parseInt(duration, 10),
        learningOutcomes: learningOutcomes ? learningOutcomes.split('\n').filter(Boolean) : [],
      });
      toast.success('Lesson plan generated successfully!');
      setActivePlan(plan);
      fetchPlans();
      return plan;
    } catch (e) {
      toast.error('Failed to generate lesson plan. AI provider might be unavailable.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePlan = async (id: string, updates: Partial<LessonPlan>) => {
    try {
      await copilotService.updateLessonPlan(id, updates);
      toast.success('Lesson plan updated successfully');
      
      // Update local state
      setActivePlan(prev => prev ? { ...prev, ...updates } : null);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (e) {
      toast.error('Failed to update lesson plan');
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await copilotService.deleteLessonPlan(id);
      toast.success('Lesson plan deleted successfully');
      setPlans(prev => prev.filter(p => p.id !== id));
      if (activePlan?.id === id) setActivePlan(null);
    } catch (e) {
      toast.error('Failed to delete lesson plan');
    }
  };

  return {
    plans,
    loading,
    isGenerating,
    activePlan,
    setActivePlan,
    generatePlan,
    updatePlan,
    deletePlan,
    refresh: fetchPlans
  };
}
