import React from 'react';

export const Alert = ({ message, type = "error" }: { message: string, type?: "error" | "success" }) => {
  const bg = type === "error" ? "bg-red-100 text-red-700 border-red-400" : "bg-green-100 text-green-700 border-green-400";
  return (
    <div className={`p-4 border rounded-md mb-4 ${bg}`}>
      {message}
    </div>
  );
};
