import React from 'react';

export function DashboardPageHeader() {
  return (
    <div className="space-y-1 py-1 sm:py-2 max-w-xl z-20 relative">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1739] dark:text-white tracking-tight leading-tight">
        Licitaciones del Estado Colombiano
      </h1>
      <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 font-normal leading-relaxed">
        Encuentra oportunidades de contratación pública en SECOP, en un solo lugar.
      </p>
    </div>
  );
}
