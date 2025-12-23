import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../types';

const ChoiceNodeComponent = ({ data, isConnectable }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  return (
    <div className="bg-white border-2 border-purple-200 rounded-md p-4 min-w-[250px] shadow-sm">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500"
      />
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm text-purple-700 border-b pb-1 mb-1">
          {nodeData.label} (选项分支)
        </div>
        <div className="text-xs text-gray-500 max-h-20 overflow-hidden text-ellipsis mb-2 whitespace-pre-wrap">
          {nodeData.text || '问题描述...'}
        </div>
        
        <div className="flex flex-col gap-2 mt-1">
          {nodeData.choices?.map((choice) => (
            <div key={choice.id} className="relative bg-purple-50 p-2 rounded text-xs border border-purple-100 text-right pr-6">
              {choice.text}
              <Handle
                type="source"
                position={Position.Right}
                id={choice.id}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-purple-500 !right-[-5px]"
                style={{ top: '50%' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(ChoiceNodeComponent);
