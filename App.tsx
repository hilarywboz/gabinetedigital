
import React, { useState, useEffect } from 'react';
import { PreviousDecision, CaseInput, AnalysisResult } from './types';
import DecisionCard from './components/DecisionCard';
import { analyzeCaseWithAI } from './services/geminiService';

const STORAGE_KEY = 'judicial_corpus_v1';

const App: React.FC = () => {
  const [decisions, setDecisions] = useState<PreviousDecision[]>([]);
  const [activeTab, setActiveTab] = useState<'corpus' | 'new-case' | 'upload'>('corpus');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [newCase, setNewCase] = useState<CaseInput>({
    parties: '',
    charges: '',
    facts: '',
    mitigatingFactors: '',
    aggravatingFactors: ''
  });

  useEffect(() => {
    // Verifica se a chave foi configurada no processo de build
    if (!process.env.API_KEY || process.env.API_KEY === "undefined" || process.env.API_KEY === "") {
      setApiKeyMissing(true);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDecisions(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar decisões salvas", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
  }, [decisions]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newDecision: PreviousDecision = {
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          content,
          dateAdded: new Date().toISOString(),
          tags: ['Enviado']
        };
        setDecisions(prev => [newDecision, ...prev]);
      };
      reader.readAsText(file);
    });
    
    setTimeout(() => setActiveTab('corpus'), 500);
  };

  const deleteDecision = (id: string) => {
    if (confirm("Tem certeza que deseja remover este registro do aprendizado da IA?")) {
      setDecisions(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeCaseWithAI(newCase, decisions);
      setAnalysisResult(result);
    } catch (error: any) {
      const msg = error.message?.includes('401') 
        ? "Chave de API Inválida. Verifique as configurações na Vercel." 
        : "Falha ao analisar o caso. Verifique sua conexão ou a Chave da API.";
      alert(msg);
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setNewCase({
      parties: '',
      charges: '',
      facts: '',
      mitigatingFactors: '',
      aggravatingFactors: ''
    });
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {apiKeyMissing && (
        <div className="bg-amber-100 border-b border-amber-200 p-3 text-center text-amber-800 text-sm font-medium animate-pulse">
          ⚠️ Chave da API não configurada! O sistema não conseguirá analisar casos. 
          <a href="https://aistudio.google.com/app/apikey" target="_blank" className="ml-2 underline hover:text-amber-900">Como obter a chave?</a>
        </div>
      )}

      <header className="bg-slate-900 text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gabinete Digital AI</h1>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Assistente Jurídico</span>
                <span className={`w-2 h-2 rounded-full ${apiKeyMissing ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </div>
            </div>
          </div>
          
          <nav className="flex bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setActiveTab('corpus')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'corpus' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Meu Acervo ({decisions.length})
            </button>
            <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Subir Decisões
            </button>
            <button onClick={() => setActiveTab('new-case')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'new-case' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Analisar Caso
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full p-4 md:p-8">
        {activeTab === 'corpus' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Base de Conhecimento</h2>
                <p className="text-slate-600">Estas são as suas decisões passadas que a IA utiliza para aprender seu estilo.</p>
              </div>
              <button onClick={() => setActiveTab('upload')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-colors w-full md:w-auto">
                + Nova Decisão
              </button>
            </div>

            {decisions.length === 0 ? (
              <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">Sua base está vazia.</p>
                <p className="text-slate-400 text-sm mt-1 mb-6">Envie seus arquivos (.txt) para que o sistema comece a aprender seu estilo.</p>
                <button onClick={() => setActiveTab('upload')} className="text-indigo-600 font-semibold hover:underline">Ir para Upload</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decisions.map(d => (
                  <DecisionCard key={d.id} decision={d} onDelete={deleteDecision} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto py-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Importar Registros Jurídicos</h2>
              <p className="text-slate-600 mb-8">Selecione arquivos de texto (.txt) que contenham suas sentenças anteriores.</p>
              
              <div className="relative group">
                <input type="file" multiple accept=".txt,.md" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-slate-300 group-hover:border-indigo-400 group-hover:bg-indigo-50/50 rounded-xl p-12 text-center transition-all">
                  <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <span className="text-indigo-600 font-semibold text-lg block mb-1">Clique ou arraste arquivos aqui</span>
                  <span className="text-slate-400 text-sm">Apenas arquivos de Texto Puro (.txt)</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Dica de Especialista</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Quanto mais sentenças você subir, melhor a IA entenderá como você dosa as penas e fundamenta suas decisões.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'new-case' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">Detalhes do Novo Processo</h2>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Partes / Número do Processo</label>
                    <input required value={newCase.parties} onChange={e => setNewCase({...newCase, parties: e.target.value})} placeholder="Ex: Justiça Pública vs. Réu Nome" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Capitulação / Acusações</label>
                    <input required value={newCase.charges} onChange={e => setNewCase({...newCase, charges: e.target.value})} placeholder="Ex: Art. 121, § 2º, II e IV do CP" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fatos Provados</label>
                    <textarea required rows={4} value={newCase.facts} onChange={e => setNewCase({...newCase, facts: e.target.value})} placeholder="Descreva os fatos principais conforme a instrução..." className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Atenuantes</label>
                      <textarea rows={3} value={newCase.mitigatingFactors} onChange={e => setNewCase({...newCase, mitigatingFactors: e.target.value})} placeholder="Confissão, menoridade..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Agravantes</label>
                      <textarea rows={3} value={newCase.aggravatingFactors} onChange={e => setNewCase({...newCase, aggravatingFactors: e.target.value})} placeholder="Reincidência, motivo fútil..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isAnalyzing || decisions.length === 0 || apiKeyMissing} 
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 ${isAnalyzing || decisions.length === 0 || apiKeyMissing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'}`}
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Redigindo Decisão...
                      </>
                    ) : decisions.length === 0 ? "Envie sentenças para começar" : "Gerar Proposta de Sentença"}
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              {!analysisResult && !isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm min-h-[500px]">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-600 text-lg">Aguardando Dados</h3>
                  <p className="text-sm mt-2 max-w-xs">A proposta de sentença aparecerá aqui assim que você clicar em "Gerar".</p>
                </div>
              ) : isAnalyzing ? (
                <div className="bg-white p-8 rounded-2xl animate-pulse h-full border border-slate-200 space-y-6 shadow-sm min-h-[500px]">
                  <div className="h-8 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-24 bg-slate-50 rounded"></div>
                  <div className="h-64 bg-slate-50 rounded"></div>
                  <div className="h-32 bg-slate-50 rounded"></div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 min-h-[500px]">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">Resultado da Análise</h2>
                    <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider">Novo Caso</button>
                  </div>

                  <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-inner">
                    <p className="text-xs uppercase tracking-widest font-bold text-indigo-500 mb-1">Dispositivo sugerido</p>
                    <p className="text-xl font-bold text-indigo-900 leading-tight">{analysisResult?.suggestedSentence}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fundamentação Técnica</h4>
                    <p className="text-slate-600 text-sm leading-relaxed italic whitespace-pre-wrap">{analysisResult?.reasoning}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Precedentes Relacionados</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult?.comparativePrecedents.map((pre, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200">
                          {pre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Minuta da Decisão</h4>
                      <button 
                        onClick={() => { if (analysisResult) { navigator.clipboard.writeText(analysisResult.draftJudgment); alert("Copiado com sucesso!"); } }} 
                        className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        COPIAR MINUTA
                      </button>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-serif text-slate-800 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap shadow-inner text-base">
                      {analysisResult?.draftJudgment}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="p-8 text-center bg-white border-t border-slate-100">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">Gabinete Digital AI © {new Date().getFullYear()}</p>
        <p className="text-slate-300 text-[10px] max-w-lg mx-auto leading-relaxed">Este sistema é uma ferramenta de apoio. A decisão final e a revisão jurídica são de responsabilidade exclusiva do magistrado.</p>
      </footer>
    </div>
  );
};

export default App;
