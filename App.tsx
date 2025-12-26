
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
  const [newCase, setNewCase] = useState<CaseInput>({
    parties: '',
    charges: '',
    facts: '',
    mitigatingFactors: '',
    aggravatingFactors: ''
  });

  useEffect(() => {
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
    } catch (error) {
      alert("Falha ao analisar o caso. Verifique sua conexão ou tente novamente.");
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
              <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Assistente Jurídico Inteligente</p>
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
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Base de Conhecimento</h2>
                <p className="text-slate-600">Estas são as suas decisões passadas que a IA utiliza para aprender seu estilo e critério.</p>
              </div>
              <button onClick={() => setActiveTab('upload')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                + Nova Decisão
              </button>
            </div>

            {decisions.length === 0 ? (
              <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-500 font-medium">Sua base está vazia.</p>
                <p className="text-slate-400 text-sm mt-1">Envie seus arquivos para que o sistema comece a aprender.</p>
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
              <p className="text-slate-600 mb-8">Selecione arquivos de texto (.txt) ou Word que contenham suas sentenças anteriores.</p>
              
              <div className="relative group">
                <input type="file" multiple accept=".txt,.md,.doc,.docx" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-slate-300 group-hover:border-indigo-400 group-hover:bg-indigo-50/50 rounded-xl p-12 text-center transition-all">
                  <span className="text-indigo-600 font-semibold text-lg block mb-1">Clique ou arraste arquivos aqui</span>
                  <span className="text-slate-400 text-sm">Suporta TXT e MD</span>
                </div>
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
                    <input required value={newCase.parties} onChange={e => setNewCase({...newCase, parties: e.target.value})} placeholder="Ex: Justiça Pública vs. Nome do Réu" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Capitulação / Acusações</label>
                    <input required value={newCase.charges} onChange={e => setNewCase({...newCase, charges: e.target.value})} placeholder="Ex: Art. 155, Caput do CP" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fatos Relevantes</label>
                    <textarea required rows={4} value={newCase.facts} onChange={e => setNewCase({...newCase, facts: e.target.value})} placeholder="Resuma o que ficou provado na instrução..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Atenuantes</label>
                      <textarea rows={3} value={newCase.mitigatingFactors} onChange={e => setNewCase({...newCase, mitigatingFactors: e.target.value})} placeholder="Primariedade, confissão, etc." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Agravantes</label>
                      <textarea rows={3} value={newCase.aggravatingFactors} onChange={e => setNewCase({...newCase, aggravatingFactors: e.target.value})} placeholder="Reincidência, meio cruel, etc." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                    </div>
                  </div>

                  <button type="submit" disabled={isAnalyzing || decisions.length === 0} className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 ${isAnalyzing || decisions.length === 0 ? 'bg-slate-300 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                    {isAnalyzing ? "Redigindo Decisão..." : "Gerar Proposta de Sentença"}
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              {!analysisResult && !isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <h3 className="font-medium text-lg">Aguardando Análise</h3>
                  <p className="text-sm mt-2">Preencha os dados à esquerda e clique em "Gerar".</p>
                </div>
              ) : isAnalyzing ? (
                <div className="bg-white p-8 rounded-2xl animate-pulse h-full border border-slate-200 space-y-4">
                  <div className="h-8 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-40 bg-slate-50 rounded"></div>
                  <div className="h-60 bg-slate-50 rounded"></div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">Recomendação do Assistente</h2>
                    <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">Limpar</button>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-xs uppercase tracking-widest font-bold text-indigo-600 mb-1">Pena Sugerida</p>
                    <p className="text-xl font-bold text-indigo-900">{analysisResult?.suggestedSentence}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Fundamentação Jurídica</h4>
                    <p className="text-slate-600 text-sm leading-relaxed italic whitespace-pre-wrap">{analysisResult?.reasoning}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Precedentes do Seu Acervo</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult?.comparativePrecedents.map((pre, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs border border-slate-200">
                          {pre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold text-slate-700 uppercase">Minuta da Decisão</h4>
                      <button onClick={() => { if (analysisResult) { navigator.clipboard.writeText(analysisResult.draftJudgment); alert("Copiado!"); } }} className="text-xs text-indigo-600 font-semibold">Copiar Texto</button>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-serif text-slate-800 leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                      {analysisResult?.draftJudgment}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="p-6 text-center text-slate-400 text-xs bg-white border-t">
        &copy; {new Date().getFullYear()} Gabinete Digital AI • Baseado na sua Jurisprudência Particular
      </footer>
    </div>
  );
};

export default App;
