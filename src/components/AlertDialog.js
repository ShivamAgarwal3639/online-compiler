import React from 'react';

export const AlertDialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-50">
        {children}
      </div>
    </div>
  );
};

export const AlertDialogContent = ({ children }) => {
  return <div className="relative">{children}</div>;
};

export const AlertDialogHeader = ({ children }) => {
  return <div className="mb-4">{children}</div>;
};

export const AlertDialogFooter = ({ children }) => {
  return <div className="flex justify-end space-x-2 mt-4">{children}</div>;
};

export const AlertDialogTitle = ({ children }) => {
  return <h2 className="text-lg font-semibold">{children}</h2>;
};

export const AlertDialogDescription = ({ children }) => {
  return <p className="text-sm text-gray-500 mt-2">{children}</p>;
};

export const AlertDialogAction = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
    >
      {children}
    </button>
  );
};

export const AlertDialogCancel = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
    >
      {children}
    </button>
  );
};