export interface RecognizedFood {
  name: string;
  confidence: number;
  quantity: string | null;
}

export interface ImageRecognitionResult {
  foods: RecognizedFood[];
  uncertain: string[];
}

export interface FodmapAnalysisFood {
  name: string;
  fodmapLevel: 'low' | 'medium' | 'high';
  score: number;
  mainFodmaps: string[];
  notes: string;
}

export interface FodmapAnalysisResult {
  foods: FodmapAnalysisFood[];
  globalScore: number;
  globalLevel: 'low' | 'medium' | 'high';
  advice: string;
}
