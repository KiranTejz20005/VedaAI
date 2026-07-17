import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '../common/response';
import { getRequestUserId, requireRequestOrgId } from '../../security/request-context';
import { CurriculumGraphService } from '../../services/obe/curriculum-graph.service';
import { BlueprintService } from '../../services/obe/blueprint.service';
import { AttainmentService } from '../../services/obe/attainment.service';
import { MappingReviewService } from '../../services/obe/mapping-review.service';

export const listCourses = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const departmentId = req.query.departmentId as string | undefined;
  const courses = await CurriculumGraphService.listCourses(orgId, departmentId);
  sendSuccess(res, { data: courses });
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { name, code, description, departmentId } = req.body;
  const course = await CurriculumGraphService.createCourse({ name, code, description, departmentId, organizationId: orgId });
  sendCreated(res, course);
};

export const listPrograms = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const programs = await CurriculumGraphService.listPrograms(orgId);
  sendSuccess(res, { data: programs });
};

export const createProgram = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { name, code, description } = req.body;
  const program = await CurriculumGraphService.createProgram({ name, code, description, organizationId: orgId });
  sendCreated(res, program);
};

export const createCourseOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const { code, description, bloomLevel } = req.body;
  const co = await CurriculumGraphService.createCourseOutcome({ code, description, bloomLevel, courseId, organizationId: orgId });
  sendCreated(res, co);
};

export const updateCourseOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const co = await CurriculumGraphService.updateCourseOutcome(id, orgId, req.body);
  sendSuccess(res, { data: co });
};

export const deleteCourseOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  await CurriculumGraphService.deleteCourseOutcome(id, orgId);
  sendNoContent(res);
};

export const createProgramOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { programId } = req.params;
  const { code, description } = req.body;
  const po = await CurriculumGraphService.createProgramOutcome({ code, description, programId, organizationId: orgId });
  sendCreated(res, po);
};

export const updateProgramOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const po = await CurriculumGraphService.updateProgramOutcome(id, orgId, req.body);
  sendSuccess(res, { data: po });
};

export const deleteProgramOutcome = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  await CurriculumGraphService.deleteProgramOutcome(id, orgId);
  sendNoContent(res);
};

export const upsertCoPoMapping = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { coId, poId, weightage, reason } = req.body;
  const mapping = await CurriculumGraphService.upsertCoPoMapping({
    coId, poId, weightage, organizationId: orgId, changedById: userId, reason,
  });
  sendSuccess(res, { data: mapping });
};

export const bulkUpsertCoPoMappings = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { mappings, reason } = req.body;
  const results = await CurriculumGraphService.bulkUpsertCoPoMappings({
    mappings, organizationId: orgId, changedById: userId, reason,
  });
  sendSuccess(res, { data: results });
};

export const getCurriculumGraph = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const graph = await CurriculumGraphService.getCurriculumGraph(courseId, orgId);
  sendSuccess(res, { data: graph });
};

export const validateMappingIntegrity = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const result = await CurriculumGraphService.validateMappingIntegrity(courseId, orgId);
  sendSuccess(res, { data: result });
};

export const getMappingHistory = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { coId, poId } = req.params;
  const history = await CurriculumGraphService.getMappingHistory(coId, poId, orgId);
  sendSuccess(res, { data: history });
};

export const listCourseOutcomes = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const graph = await CurriculumGraphService.getCurriculumGraph(courseId, orgId);
  sendSuccess(res, { data: graph.courseOutcomes });
};

export const listProgramOutcomes = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { programId } = req.params;
  const programs = await CurriculumGraphService.listPrograms(orgId);
  const program = programs.find((p) => p.id === programId);
  if (!program) {
    const { ApiError } = await import('../common/errors');
    throw ApiError.notFound('Program not found');
  }
  const outcomes = await CurriculumGraphService.listProgramOutcomes(programId, orgId);
  sendSuccess(res, { data: outcomes });
};

export const listPendingBlueprints = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const blueprints = await BlueprintService.listPendingBlueprints(orgId);
  sendSuccess(res, { data: blueprints });
};

export const listBlueprints = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const blueprints = await BlueprintService.listBlueprints(courseId, orgId);
  sendSuccess(res, { data: blueprints });
};

export const createBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const blueprint = await BlueprintService.createBlueprint({ ...req.body, organizationId: orgId, createdBy: userId });
  sendCreated(res, blueprint);
};

export const getBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const blueprint = await BlueprintService.getBlueprint(id, orgId);
  sendSuccess(res, { data: blueprint });
};

export const addBlueprintItem = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const item = await BlueprintService.addItem(id, orgId, req.body);
  sendCreated(res, item);
};

export const updateBlueprintItem = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { blueprintId, itemId } = req.params;
  const item = await BlueprintService.updateItem(itemId, blueprintId, orgId, req.body);
  sendSuccess(res, { data: item });
};

export const removeBlueprintItem = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { blueprintId, itemId } = req.params;
  await BlueprintService.removeItem(itemId, blueprintId, orgId);
  sendNoContent(res);
};

export const validateBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const result = await BlueprintService.validateBlueprintById(id, orgId);
  sendSuccess(res, { data: result });
};

export const approveBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { id } = req.params;
  const { comments } = req.body;
  const blueprint = await BlueprintService.approveBlueprint(id, orgId, userId, comments);
  sendSuccess(res, { data: blueprint });
};

export const rejectBlueprint = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const userId = getRequestUserId(req);
  const { id } = req.params;
  const { reason } = req.body;
  const blueprint = await BlueprintService.rejectBlueprint(id, orgId, userId, reason);
  sendSuccess(res, { data: blueprint });
};

export const submitBlueprintForReview = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { id } = req.params;
  const blueprint = await BlueprintService.submitForReview(id, orgId);
  sendSuccess(res, { data: blueprint });
};

export const getCoAttainment = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const threshold = Number(req.query.threshold) || 0.6;
  const result = await AttainmentService.calculateCoAttainment(courseId, orgId, threshold);
  sendSuccess(res, { data: result });
};

export const getPoAttainment = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const threshold = Number(req.query.threshold) || 0.6;
  const result = await AttainmentService.calculatePoAttainment(orgId, threshold);
  sendSuccess(res, { data: result });
};

export const getAttainmentDashboard = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const result = await AttainmentService.getAttainmentDashboard(courseId, orgId);
  sendSuccess(res, { data: result });
};

export const getFlaggedCos = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { courseId } = req.params;
  const threshold = Number(req.query.threshold) || 0.6;
  const result = await AttainmentService.getFlaggedCos(courseId, orgId, threshold);
  sendSuccess(res, { data: result });
};

export const getMappingChangeHistory = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const { mappingId } = req.params;
  const history = await MappingReviewService.getChangeHistory(mappingId, orgId);
  sendSuccess(res, { data: history });
};

export const getRecentMappingChanges = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const from = req.query.from ? new Date(req.query.from as string) : undefined;
  const to = req.query.to ? new Date(req.query.to as string) : undefined;
  if (from && isNaN(from.getTime())) throw (await import('../common/errors')).ApiError.badRequest('Invalid "from" date');
  if (to && isNaN(to.getTime())) throw (await import('../common/errors')).ApiError.badRequest('Invalid "to" date');
  const changes = await MappingReviewService.getRecentChanges(orgId, { from, to });
  sendSuccess(res, { data: changes });
};

export const getMappingChangeStats = async (req: Request, res: Response): Promise<void> => {
  const orgId = requireRequestOrgId(req);
  const stats = await MappingReviewService.getChangeStats(orgId);
  sendSuccess(res, { data: stats });
};
