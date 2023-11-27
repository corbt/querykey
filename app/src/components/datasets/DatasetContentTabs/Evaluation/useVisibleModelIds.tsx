import { useMemo } from "react";
import { useQueryParam, JsonParam, withDefault, encodeQueryParams } from "use-query-params";
import { ORIGINAL_MODEL_ID } from "~/types/dbColumns.types";

import { useDataset } from "~/utils/hooks";

export const EMPTY_MODELS_KEY = "_empty_";

export const useVisibleModelIds = () => {
  const dataset = useDataset().data;
  const [visibleModelIds, setVisibleModelIds] = useQueryParam<string[]>(
    "modelIds",
    withDefault(JsonParam, []),
  );

  const allModelIds = useMemo(() => {
    const modelIds: string[] = [ORIGINAL_MODEL_ID];
    if (!dataset) return modelIds;
    modelIds.push(...dataset.enabledComparisonModels);
    modelIds.push(...dataset.deployedFineTunes.map((ft) => ft.id));
    return modelIds;
  }, [dataset]);

  const ensureModelShown = (modelId: string) => {
    if (visibleModelIds.length === 0 || visibleModelIds.includes(modelId)) return;
    if (visibleModelIds.includes(EMPTY_MODELS_KEY)) {
      setVisibleModelIds([modelId]);
    } else {
      setVisibleModelIds([...visibleModelIds, modelId]);
    }
  };

  const toggleModelVisiblity = (modelId: string) => {
    if (visibleModelIds.length === 0) {
      // All models were visible, so we're only hiding this one.
      if (allModelIds.length === 1) {
        // There's only one model, so we're hiding all of them.
        setVisibleModelIds([EMPTY_MODELS_KEY]);
      } else {
        setVisibleModelIds(allModelIds.filter((id) => id != modelId));
      }
    } else if (visibleModelIds.includes(EMPTY_MODELS_KEY)) {
      // All models were hidden, so we're only showing this one.
      setVisibleModelIds([modelId]);
    } else if (
      visibleModelIds.length === allModelIds.length - 1 &&
      !visibleModelIds.includes(modelId)
    ) {
      // This was the only hidden model, so we're now showing all of them
      setVisibleModelIds([]);
    } else if (visibleModelIds.length === 1 && visibleModelIds.includes(modelId)) {
      // This is the only visible model, so we're hiding it.
      setVisibleModelIds([EMPTY_MODELS_KEY]);
    } else if (visibleModelIds.includes(modelId)) {
      // This model was visible, so we're hiding it.
      setVisibleModelIds(visibleModelIds.filter((id) => id !== modelId));
    } else if (!visibleModelIds.includes(modelId)) {
      // This model was hidden, so we're showing it.
      setVisibleModelIds([...visibleModelIds, modelId]);
    }
  };

  let completeVisibleModelIds = visibleModelIds;
  if (visibleModelIds.includes(EMPTY_MODELS_KEY)) {
    completeVisibleModelIds = [];
  } else if (visibleModelIds.length === 0) {
    completeVisibleModelIds = allModelIds;
  }

  return {
    visibleModelIds: completeVisibleModelIds,
    toggleModelVisiblity,
    ensureModelShown,
  };
};

export const constructVisibleModelIdsQueryParams = (modelIds: string[]): Record<string, any> => {
  const queryParams = {
    modelIds,
  };

  const encodedParams = encodeQueryParams({ modelIds: JsonParam }, queryParams);

  return Object.fromEntries(
    Object.entries(encodedParams).map(([key, value]) => [key, value?.toString()]),
  );
};
