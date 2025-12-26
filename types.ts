
export interface PreviousDecision {
  id: string;
  title: string;
  content: string;
  dateAdded: string;
  tags?: string[];
}

export interface CaseInput {
  parties: string;
  charges: string;
  facts: string;
  mitigatingFactors: string;
  aggravatingFactors: string;
}

export interface AnalysisResult {
  suggestedSentence: string;
  reasoning: string;
  comparativePrecedents: string[];
  draftJudgment: string;
}
