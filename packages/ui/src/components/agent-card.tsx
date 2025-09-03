import React from 'react';

export interface AgentCardProps {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
  onClick?: () => void;
  className?: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  name,
  description,
  status = 'inactive',
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {status === 'active' ? 'Actif' : 'Inactif'}
        </span>
      </div>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
};
