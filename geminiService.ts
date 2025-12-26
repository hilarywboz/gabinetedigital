
import { GoogleGenAI, Type } from "@google/genai";
import { PreviousDecision, CaseInput, AnalysisResult } from "../types";

export const analyzeCaseWithAI = async (
  newCase: CaseInput,
  corpus: PreviousDecision[]
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const corpusContext = corpus.length > 0 
    ? corpus.map(d => `[ID da Decisão: ${d.id}]\nTítulo: ${d.title}\nConteúdo: ${d.content}`).join("\n\n---\n\n")
    : "Nenhuma decisão anterior enviada ainda.";

  const prompt = `
    Você é um Assessor Jurídico experiente (Clerks de magistrados). 
    Sua tarefa é analisar um NOVO CASO e sugerir uma sentença e o rascunho de uma decisão/acórdão baseando-se nas DECISÕES ANTERIORES fornecidas pelo Juiz.
    
    Mantenha a consistência no raciocínio jurídico, terminologia técnica, estilo de escrita e o rigor/lenidade encontrados nas decisões anteriores do corpus.
    
    ### CONTEXTO DE DECISÕES ANTERIORES (ESTILO DO JUIZ):
    ${corpusContext}
    
    ### DETALHES DO NOVO CASO:
    Partes: ${newCase.parties}
    Acusações/Capitulação: ${newCase.charges}
    Fatos do Caso: ${newCase.facts}
    Atenuantes/Causas de Diminuição: ${newCase.mitigatingFactors}
    Agravantes/Causas de Aumento: ${newCase.aggravatingFactors}
    
    Forneça sua saída estritamente em formato JSON e em PORTUGUÊS (Brasil).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedSentence: {
            type: Type.STRING,
            description: "A recomendação específica de pena (ex: multa, tempo de reclusão, regime, serviços comunitários)."
          },
          reasoning: {
            type: Type.STRING,
            description: "Raciocínio jurídico detalhado conectando o novo caso aos padrões encontrados nas decisões anteriores."
          },
          comparativePrecedents: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de títulos ou referências do corpus que foram mais relevantes para esta decisão."
          },
          draftJudgment: {
            type: Type.STRING,
            description: "Um rascunho formal da decisão judicial no estilo estabelecido pelo juiz."
          }
        },
        required: ["suggestedSentence", "reasoning", "comparativePrecedents", "draftJudgment"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return result as AnalysisResult;
  } catch (error) {
    console.error("Falha ao processar resposta da IA:", error);
    throw new Error("Não foi possível gerar a sugestão de sentença.");
  }
};
