import React from 'react';

export function StateBoundary({ state, emptyMessage = 'No data available.', onRetry, children }) {
    if (state.loading) {
        return (
            <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-slate-800 rounded-lg animate-pulse">
                <span className="text-slate-400">Loading data...</span>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center bg-slate-800 border border-red-500 rounded-lg p-4">
                <span className="text-red-400 mb-2">Error loading data</span>
                <span className="text-slate-300 text-sm mb-4">{state.error}</span>
                {onRetry && (
                    <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                        Retry
                    </button>
                )}
            </div>
        );
    }

    if (state.isEmpty) {
        return (
            <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center bg-slate-800 rounded-lg p-4">
                <span className="text-slate-400 text-xl mb-2">??</span>
                <span className="text-slate-400">{emptyMessage}</span>
            </div>
        );
    }

    // Success State
    return <>{children}</>;
}
