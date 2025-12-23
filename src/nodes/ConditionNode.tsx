import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ConditionItem, NodeData } from '../types';
import { Dices } from 'lucide-react';

const formatCondition = (c: ConditionItem) => {
  if (c.type === 'has_item') return `拥有物品: ${c.target}`;
  const opMap: Record<string, string> = { '>=': '≥', '<=': '≤', '>': '>', '<': '<', '=': '=', '==': '=' };
  return `${c.target} ${opMap[c.operation] || c.operation} ${c.value}`;
};

const ConditionNodeComponent = ({ data, isConnectable }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const isCheckMode = nodeData.conditionMode === 'check';
  const hasVisualConditions = nodeData.conditions && nodeData.conditions.length > 0;

  return (
    <div className="bg-white border-2 border-orange-200 rounded-md p-4 min-w-[200px] shadow-sm">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500"
      />
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm text-orange-700 border-b pb-1 mb-1">
          {nodeData.label} {isCheckMode ? '(骰点)' : '(判定)'}
        </div>
        
        {!isCheckMode && (
            <div className="text-xs bg-orange-50 p-2 rounded text-gray-700 min-h-[20px] mb-2 border border-orange-100">
            {hasVisualConditions ? (
                <div className="flex flex-col gap-1">
                    {nodeData.conditions?.map((c, i) => (
                    <div key={i} className="truncate">
                        {i > 0 && <span className="text-orange-400 font-bold mr-1">{nodeData.conditionLogic || 'AND'}</span>}
                        {formatCondition(c as ConditionItem)}
                    </div>
                    ))}
                </div>
            ) : (
                <div className="text-gray-400 italic">无条件 (默认通过)</div>
            )}
            </div>
        )}

        {isCheckMode && (
            <div className="text-xs bg-purple-50 p-2 rounded text-gray-700 min-h-[20px] mb-2 border border-purple-100 flex items-center gap-1">
                <Dices size={12} className="text-purple-600" />
                <div>
                    <div>{nodeData.checkDice || '1d100'}</div>
                    <div className="text-[10px] text-gray-500">vs {nodeData.checkTarget || '50'}</div>
                </div>
            </div>
        )}
        
        {!isCheckMode ? (
            <div className="flex justify-between items-center text-xs font-bold relative h-4">
            <div className="absolute left-0">
                <span className="text-green-600">是</span>
                <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                isConnectable={isConnectable}
                className="w-3 h-3 bg-green-500"
                style={{ bottom: '-10px' }}
                />
            </div>
            <div className="absolute right-0">
                <span className="text-red-600">否</span>
                <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                isConnectable={isConnectable}
                className="w-3 h-3 bg-red-500"
                style={{ bottom: '-10px' }}
                />
            </div>
            </div>
        ) : (
            <div className="flex justify-between items-center text-[10px] font-bold relative h-4 w-full">
                 {/* Handles for Check Mode: Success, Failure, Great Success, Great Failure */}
                 {/* Layout: spread out handles */}
                 
                 <div className="absolute left-0 -ml-1 text-center">
                    <div className="text-yellow-600 scale-75 whitespace-nowrap">大成功</div>
                    <Handle type="source" position={Position.Bottom} id="great_success" isConnectable={isConnectable} className="w-2 h-2 bg-yellow-500" style={{bottom: '-10px'}} />
                 </div>
                 
                 <div className="absolute left-[30%] text-center">
                    <div className="text-green-600 scale-75">成功</div>
                    <Handle type="source" position={Position.Bottom} id="success" isConnectable={isConnectable} className="w-2 h-2 bg-green-500" style={{bottom: '-10px'}} />
                 </div>

                 <div className="absolute right-[30%] text-center">
                    <div className="text-red-600 scale-75">失败</div>
                    <Handle type="source" position={Position.Bottom} id="failure" isConnectable={isConnectable} className="w-2 h-2 bg-red-500" style={{bottom: '-10px'}} />
                 </div>

                 <div className="absolute right-0 -mr-1 text-center">
                    <div className="text-purple-600 scale-75 whitespace-nowrap">大失败</div>
                    <Handle type="source" position={Position.Bottom} id="great_failure" isConnectable={isConnectable} className="w-2 h-2 bg-purple-500" style={{bottom: '-10px'}} />
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default memo(ConditionNodeComponent);
