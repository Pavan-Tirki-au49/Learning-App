import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ className = "" }: { className?: string }) => {
  return <Loader2 className={`animate-spin text-indigo-500 w-8 h-8 ${className}`} />;
};
