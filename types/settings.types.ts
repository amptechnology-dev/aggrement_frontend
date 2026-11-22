export interface SavedTerm {
  id: string;
  text: string;
}

export interface AgreementRules {
  lateFineAmountPerDay: number;
  lateFineAfterDay: number;
  rentIncreaseEveryYears: number;
  rentIncreasePercent: number;
  validityYears: number;
  stallCannotCloseForDays: number;
  noticePeriodMonths: number;
}

export interface OwnerSettings extends AgreementRules {
  officeName: string;
  officeAddress: string;
  savedTerms: SavedTerm[];
}

export type UpdateSettingsPayload = Partial<AgreementRules> & {
  officeName?: string;
  officeAddress?: string;
};

export interface SettingsResponse {
  success: boolean;
  message?: string;
  settings: OwnerSettings;
}

export interface TermsResponse {
  success: boolean;
  message: string;
  savedTerms: SavedTerm[];
}