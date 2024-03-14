export const predefinedModelNames = {
  GPT_3_5_TURBO_1106: "gpt-3.5-turbo-1106",
  GPT_4_0613: "gpt-4-0613",
  GPT_4_1106_PREVIEW: "gpt-4-1106-preview",
  GPT_4_0125_PREVIEW: "gpt-4-0125-preview",
};

export type externalModel = {
  id: string;
  name: string;
  slug: string;
};

export const predefinedExternalModels: externalModel[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: predefinedModelNames.GPT_3_5_TURBO_1106,
    slug: "GPT-3.5 Turbo (-1106)",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: predefinedModelNames.GPT_4_0613,
    slug: "GPT-4 (-0613)",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: predefinedModelNames.GPT_4_1106_PREVIEW,
    slug: "GPT-4 Turbo (-1106)",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: predefinedModelNames.GPT_4_0125_PREVIEW,
    slug: "GPT-4 Turbo (-0125)",
  },
];
