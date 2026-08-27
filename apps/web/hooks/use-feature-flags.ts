'use client';

import { useState, useEffect } from 'react';
import { FeatureFlagKey, EvaluatedFeatureFlag } from '@petflow/types';

// Default Fallback Flags
const DEFAULT_EVALUATED_FLAGS: Record<string, boolean> = {
  CLINICAL_SOAP: true,
  VACCINATION_REGISTRY: true,
  LINE_MESSAGING: true,
  ADVANCED_INVENTORY: true,
  COMMISSION_ENGINE: true,
  MULTI_BRANCH_HQ: false,
  API_ACCESS: false,
  TELE_MED_BETA: false,
  AI_ASSISTANT: false,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>(DEFAULT_EVALUATED_FLAGS);
  const [loading, setLoading] = useState(false);

  const isEnabled = (key: FeatureFlagKey | string): boolean => {
    return flags[key.toUpperCase()] ?? false;
  };

  return {
    flags,
    loading,
    isEnabled,
  };
}
