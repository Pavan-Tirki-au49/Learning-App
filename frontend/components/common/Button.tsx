import React from 'react';

export const Button = ({ children, onClick, type = "button", disabled = false, className = "" }: any) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors ${className}`}
    >
      {children}
    </button>
  );
};
