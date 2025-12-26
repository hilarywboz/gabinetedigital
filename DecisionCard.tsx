
import React from 'react';
import { PreviousDecision } from '../types';

interface DecisionCardProps {
  decision: PreviousDecision;
  onDelete: (id: string) => void;
}

const DecisionCard: React.FC<DecisionCardProps> = ({ decision, onDelete }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-slate-800 text-lg line-clamp-1">{decision.title}</h3>
        <button 
          onClick={() => onDelete(decision.id)}
          className="text-slate-400 hover:text-red-600 transition-colors p-1"
          aria-label="Delete decision"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-3">{new Date(decision.dateAdded).toLocaleDateString()}</p>
      <div className="text-slate-600 text-sm line-clamp-3 mb-4">
        {decision.content}
      </div>
      <div className="flex flex-wrap gap-2">
        {(decision.tags || ['General']).map((tag, idx) => (
          <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DecisionCard;
