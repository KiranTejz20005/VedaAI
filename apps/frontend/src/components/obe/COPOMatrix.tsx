'use client';

import React, { useState, useEffect } from 'react';
import { BloomClassificationBadge, BloomLevel } from './BloomClassificationBadge';
import { BloomOverrideSelect } from './BloomOverrideSelect';
import { AccreditationExport } from './AccreditationExport';
import { Button } from '@/design-system/Button';
import { Loader2, Save, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export interface CourseOutcomeItem {
  id: string;
  code: string;
  description: string;
  bloomLevel: BloomLevel;
}

export interface ProgramOutcomeItem {
  id: string;
  code: string;
  description: string;
}

export interface BloomClassificationItem {
  coId: string;
  coCode: string;
  predictedLevel: BloomLevel;
  effectiveLevel: BloomLevel;
  confidence: number;
  cues: {
    verbs: string[];
    operations: string[];
    responseType: string;
  };
  explanation: string;
}

export interface MatrixRowItem {
  coId: string;
  coCode: string;
  bloomLevel: BloomLevel;
  mappings: Array<{ poId: string; poCode: string; weightage: number }>;
}

export interface COPOMatrixData {
  course: { id: string; name: string; code: string; description?: string };
  cos: CourseOutcomeItem[];
  pos: ProgramOutcomeItem[];
  matrix: MatrixRowItem[];
  bloomClassifications: BloomClassificationItem[];
}

interface COPOMatrixProps {
  data: COPOMatrixData;
  onSaveMatrix: (payload: {
    mappings: Array<{ coId: string; poId: string; weightage: number }>;
    bloomOverrides: Array<{ coId: string; bloomLevel: BloomLevel }>;
  }) => Promise<void>;
  onRefresh?: () => void;
}

const WEIGHTAGE_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: 'bg-slate-100 hover:bg-slate-200 border-slate-200', text: 'text-slate-400', label: '-' },
  1: { bg: 'bg-sky-100 hover:bg-sky-200 border-sky-300', text: 'text-sky-800 font-bold', label: '1 (Slight)' },
  2: { bg: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300', text: 'text-indigo-800 font-bold', label: '2 (Moderate)' },
  3: { bg: 'bg-blue-600 hover:bg-blue-700 border-blue-700', text: 'text-white font-bold', label: '3 (Substantial)' },
};

export function COPOMatrix({ data, onSaveMatrix, onRefresh }: COPOMatrixProps) {
  // Local state for immediate reactive UI updates
  const [localMatrix, setLocalMatrix] = useState<MatrixRowItem[]>(data.matrix || []);
  const [localCos, setLocalCos] = useState<CourseOutcomeItem[]>(data.cos || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalMatrix(data.matrix || []);
    setLocalCos(data.cos || []);
    setHasChanges(false);
  }, [data]);

  // Instant UI update for weightage change
  const handleWeightageCycle = (coId: string, poId: string) => {
    setLocalMatrix((prevMatrix) => {
      return prevMatrix.map((row) => {
        if (row.coId !== coId) return row;
        const updatedMappings = row.mappings.map((m) => {
          if (m.poId !== poId) return m;
          const nextWeight = (m.weightage + 1) % 4; // Cycle 0 -> 1 -> 2 -> 3 -> 0
          return { ...m, weightage: nextWeight };
        });
        return { ...row, mappings: updatedMappings };
      });
    });
    setHasChanges(true);
  };

  // Instant UI update for Bloom override
  const handleBloomOverrideChange = (coId: string, newLevel: BloomLevel) => {
    setLocalCos((prevCos) =>
      prevCos.map((co) => (co.id === coId ? { ...co, bloomLevel: newLevel } : co))
    );
    setHasChanges(true);
  };

  // Save changes to backend with rollback safety
  const handleSave = async () => {
    if (isSaving) return;

    // Collect all mappings
    const mappingsPayload = localMatrix.flatMap((row) =>
      row.mappings.map((m) => ({ coId: row.coId, poId: m.poId, weightage: m.weightage }))
    );

    // Collect Bloom overrides
    const bloomOverridesPayload = localCos.map((co) => ({
      coId: co.id,
      bloomLevel: co.bloomLevel,
    }));

    try {
      setIsSaving(true);
      await onSaveMatrix({ mappings: mappingsPayload, bloomOverrides: bloomOverridesPayload });
      toast.success('CO/PO Matrix & Bloom classifications saved successfully!');
      setHasChanges(false);
    } catch {
      toast.error('Failed to save matrix updates. Rolling back changes.');
      // Rollback to server state
      setLocalMatrix(data.matrix || []);
      setLocalCos(data.cos || []);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!data.cos.length || !data.pos.length) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Incomplete Matrix Data</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Please add at least one Course Outcome (CO) and Program Outcome (PO) to start mapping.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header & Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Interactive CO-PO Mapping &amp; Bloom Classifier Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Click cells to cycle weightage (0 = None, 1 = Slight, 2 = Moderate, 3 = Substantial). Use dropdowns for faculty Bloom level overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AccreditationExport
            data={{
              courseCode: data.course.code,
              courseName: data.course.name,
              cos: localCos,
              pos: data.pos,
              matrix: localMatrix,
            }}
          />

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="text-slate-600">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`min-w-[130px] justify-center ${hasChanges ? 'ring-2 ring-indigo-400 animate-pulse' : ''}`}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-4 h-4 mr-1.5" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Matrix Table with Sticky Column */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="p-3 min-w-[280px] sticky left-0 bg-slate-50 border-r border-slate-200 z-10">
                Course Outcome (CO) &amp; Description
              </th>
              <th className="p-3 min-w-[180px] border-r border-slate-200">
                AI Bloom Classification &amp; Override
              </th>
              {data.pos.map((po) => (
                <th
                  key={po.id}
                  className="p-3 text-center min-w-[75px] max-w-[100px] border-r border-slate-200 group relative"
                  title={`${po.code}: ${po.description}`}
                >
                  <div className="font-bold text-indigo-700">{po.code}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate max-w-[80px]">
                    {po.description}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {localCos.map((co) => {
              const matrixRow = localMatrix.find((m) => m.coId === co.id);
              const bloomInfo = data.bloomClassifications.find((b) => b.coId === co.id);
              const predictedLevel = bloomInfo?.predictedLevel;
              const isOverridden = predictedLevel && co.bloomLevel !== predictedLevel;

              return (
                <tr key={co.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* CO Code & Description */}
                  <td className="p-3 sticky left-0 bg-white border-r border-slate-200 z-10">
                    <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span>{co.code}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {co.description}
                    </p>
                  </td>

                  {/* Bloom Classification Badge & Override Dropdown */}
                  <td className="p-3 border-r border-slate-200 space-y-2 vertical-top">
                    <div>
                      <BloomClassificationBadge
                        level={co.bloomLevel}
                        confidence={bloomInfo?.confidence}
                        isOverride={isOverridden}
                        explanation={bloomInfo?.explanation}
                        size="sm"
                      />
                    </div>
                    <BloomOverrideSelect
                      currentLevel={co.bloomLevel}
                      predictedLevel={predictedLevel}
                      onChange={(newLvl) => handleBloomOverrideChange(co.id, newLvl)}
                    />
                  </td>

                  {/* Matrix Weightage Cell Grid */}
                  {data.pos.map((po) => {
                    const mapping = matrixRow?.mappings.find((m) => m.poId === po.id);
                    const weightage = mapping ? mapping.weightage : 0;
                    const style = WEIGHTAGE_STYLES[weightage] || WEIGHTAGE_STYLES[0];

                    return (
                      <td key={po.id} className="p-2 border-r border-slate-200 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleWeightageCycle(co.id, po.id)}
                          className={`w-10 h-10 rounded-lg text-xs transition-all border ${style.bg} flex items-center justify-center mx-auto shadow-xs active:scale-95`}
                          title={`Click to cycle weightage for ${co.code} -> ${po.code} (Current: ${style.label})`}
                        >
                          {style.label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Matrix Weightage Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-700">Weightage Scale:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 inline-block"></span> 0 = Unmapped</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-200 inline-block"></span> 1 = Slight</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-200 inline-block"></span> 2 = Moderate</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600 inline-block"></span> 3 = Substantial</span>
        </div>
        <div>
          <span>Total COs: <strong>{localCos.length}</strong> | Total POs: <strong>{data.pos.length}</strong></span>
        </div>
      </div>
    </div>
  );
}
