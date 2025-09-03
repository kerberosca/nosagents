import React from 'react';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface ToolListProps {
  tools: Tool[];
  onToolSelect?: (tool: Tool) => void;
  className?: string;
}

export const ToolList: React.FC<ToolListProps> = ({
  tools,
  onToolSelect,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {tools.map((tool) => (
        <div
          key={tool.id}
          onClick={() => onToolSelect?.(tool)}
          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{tool.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
            </div>
            {tool.category && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {tool.category}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
