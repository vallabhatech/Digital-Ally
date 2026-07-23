import React from 'react';
import { CheckIcon } from '@/components/IconSet';

interface SectionCardProps {
  title: string;
  subtitle: string;
  completed?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  completed = false,
  className = '',
  children,
}) => (
  <section
    className={`mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
  >
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          {title}
          {completed && <CheckIcon className="w-6 h-6 text-green-500" />}
        </h3>
        <p className="text-gray-500 mt-1">{subtitle}</p>
      </div>
      {completed && (
        <span className="hidden rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700 sm:inline-block">
          Complete
        </span>
      )}
    </div>
    {children}
  </section>
);
