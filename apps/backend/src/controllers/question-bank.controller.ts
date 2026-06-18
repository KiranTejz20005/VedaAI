import { Request, Response } from 'express';
import {
  saveToQuestionBank,
  searchQuestionBank,
  updateQuestionBankQuestion,
  createQuestionCollection,
  listQuestionCollections,
  getQuestionCollection,
} from '../services/question-bank.service';
import prisma from '../config/prisma';

export const addToBank = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, options, answer, hint, subject, topic, difficulty, bloomLevel, tags } = req.body;
    const question = await saveToQuestionBank({
      content,
      options,
      answer,
      hint,
      subject,
      topic,
      difficulty,
      bloomLevel,
      tags,
    });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add question to bank' });
  }
};

export const searchBank = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, subject, topic, difficulty, bloomLevel, tags } = req.query;
    const filterTags = tags ? (tags as string).split(',') : undefined;

    const questions = await searchQuestionBank(q as string, {
      subject: subject as string,
      topic: topic as string,
      difficulty: difficulty as string,
      bloomLevel: bloomLevel as string,
      tags: filterTags,
    });

    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};

export const updateBankQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, options, answer } = req.body;
    const userId = req.user?.id || 'demo-faculty-id';

    const question = await updateQuestionBankQuestion({
      id,
      content,
      options,
      answer,
      userId,
    });

    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Update failed' });
  }
};

export const getQuestionVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const versions = await prisma.questionVersion.findMany({
      where: { questionId: id },
      orderBy: { versionNumber: 'desc' },
    });
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch version history' });
  }
};

export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, questionIds } = req.body;
    const userId = req.user?.id || 'demo-faculty-id';

    const collection = await createQuestionCollection({
      name,
      description,
      userId,
      questionIds,
    });

    res.status(201).json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create collection' });
  }
};

export const listCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'demo-faculty-id';
    const collections = await listQuestionCollections(userId);
    res.json({ success: true, data: collections });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list collections' });
  }
};

export const getCollectionDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const collection = await getQuestionCollection(id);
    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get collection details' });
  }
};
