import React from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
