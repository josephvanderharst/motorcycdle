export type Year = number;
export type YearRange = [Year, Year];

/** Makes and models, with model years */
export type MakeModelYearMetadata = {
  [make: string]: {
    [model: string]: YearRange[],
  },
};

/** Just makes and models, without model years */
export type MakeModelMetadata = {
  [make: string] : string[],
};
