import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ActionItem, NodeData } from '../types';

const formatAction = (a: ActionItem) => {
  if (a.type === 'item') {
      return a.operation === '+' ? `获得物品: ${a.target}` : `移除物品: ${a.target}`;
  }
  const opMap: Record<string, string> = { '+=': '+', '-=': '-', '=': '=', '+': '+', '-': '-' };
  return `${a.target} ${opMap[a.operation] || a.operation} ${a.value}`;
};

const StoryNodeComponent = ({ data, isConnectable }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const hasActions = nodeData.actions && nodeData.actions.length > 0;

  return (
    <div className={`bg-white border-2 rounded-md p-4 min-w-[200px] shadow-sm ${nodeData.isStart ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm text-gray-700 border-b pb-1 mb-1 flex justify-between">
          <span>{nodeData.label}</span>
          {nodeData.isStart && <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded">起点</span>}
        </div>
        <div className="text-xs text-gray-500 max-h-20 overflow-hidden text-ellipsis whitespace-pre-wrap">
          {nodeData.text || '暂无内容...'}
        </div>
        
        {nodeData.savePointId && (
          <div className="text-[10px] bg-purple-100 text-purple-800 px-1 rounded flex items-center gap-1 mt-1">
            <span>💾 存档点: {nodeData.savePointId}</span>
          </div>
        )}
        
        {hasActions && (
          <div className="mt-1 pt-1 border-t border-gray-100 flex flex-col gap-1">
             <div className="text-[10px] text-gray-400 font-bold">结算效果:</div>
             {nodeData.actions?.map((action, i) => (
               <div key={i} className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1 rounded truncate">
                 {formatAction(action)}
               </div>
             ))}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
};

export default memo(StoryNodeComponent);
