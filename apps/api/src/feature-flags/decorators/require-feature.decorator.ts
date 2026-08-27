import { SetMetadata } from '@nestjs/common';
import { FeatureFlagKey } from '@petflow/types';

export const REQUIRE_FEATURE_KEY = 'require_feature';

export const RequireFeature = (featureKey: FeatureFlagKey | string) =>
  SetMetadata(REQUIRE_FEATURE_KEY, featureKey);
