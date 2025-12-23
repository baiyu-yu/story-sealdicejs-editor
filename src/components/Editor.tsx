import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
  Node,
  type NodeTypes,
} from '@xyflow/react';
import { Plus, Download, Upload, Save, Settings, AlertCircle, HelpCircle, Undo, Redo, Play, Trash2 } from 'lucide-react';
import StoryNodeComponent from '../nodes/StoryNode';
import ChoiceNodeComponent from '../nodes/ChoiceNode';
import ConditionNodeComponent from '../nodes/ConditionNode';
import { generatePlugin } from '../utils/generator';
import { ActionItem, AppNode, ConditionItem, ProjectSettings } from '../types';

const SUBCOMMAND_KEYS = ['start', 'next', 'choose', 'stat', 'load', 'reset', 'clear'] as const;
const nodeTypes: NodeTypes = {
  story: StoryNodeComponent,
  choice: ChoiceNodeComponent,
  condition: ConditionNodeComponent,
};

const INITIAL_NODES: AppNode[] = [
  {
    id: 'start',
    type: 'story',
    position: { x: 250, y: 100 },
    data: { label: '开始', text: '故事从此开始...', isStart: true },
  },
];

const INITIAL_SETTINGS: ProjectSettings = {
  pluginName: 'MyStory',
  commandName: 'story',
  version: '1.0.0',
  author: 'Author'
};

export default function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [settings, setSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);
  
  // Undo/Redo Stacks
  const [history, setHistory] = useState<{nodes: AppNode[], edges: any[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Save history on change
  useEffect(() => {
      if (isUndoRedoAction.current) {
          isUndoRedoAction.current = false;
          return;
      }
      
      // We don't automatically push history here anymore to avoid spam
      // But we keep this effect for potential future use or debugging
  }, [nodes, edges]); // We actually need to trigger this manually on specific actions for better performance
  
  const pushHistory = useCallback(() => {
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
          return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
  }, [nodes, edges, historyIndex]);

  // Initial history push
  useEffect(() => {
     if (history.length === 0 && nodes.length > 0) {
         setHistory([{ nodes, edges }]);
         setHistoryIndex(0);
     }
  }, []);

  const handleUndo = () => {
      if (historyIndex > 0) {
          isUndoRedoAction.current = true;
          const prevState = history[historyIndex - 1];
          setNodes(prevState.nodes);
          setEdges(prevState.edges);
          setHistoryIndex(historyIndex - 1);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          isUndoRedoAction.current = true;
          const nextState = history[historyIndex + 1];
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
          setHistoryIndex(historyIndex + 1);
      }
  };

  const closeGuide = () => {
      setShowGuide(false);
      localStorage.setItem('blackfish_has_seen_guide', 'true');
  };

  const onConnect = useCallback(
    (params: Connection) => {
        pushHistory(); // Save state before connecting
        setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, pushHistory],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: any) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const addNode = (type: 'story' | 'choice' | 'condition') => {
    pushHistory(); // Save history
    const id = `${type}_${Date.now()}`;
    let data: any = {};
    if (type === 'story') {
      data = { label: '新剧情', text: '剧情内容...' };
    } else if (type === 'choice') {
      data = { label: '新分支', text: '请选择...', choices: [{ id: 'opt1', text: '选项 1' }] };
    } else {
      data = { label: '新条件', condition: 'state.stats.affection >= 10' };
    }

    const newNode: AppNode = {
      id,
      type: type as any,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data,
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (id: string, newData: any) => {
    // For text inputs, we might not want to push history on every keystroke. 
    // Ideally we push on blur or use debounce. For simplicity in this demo, we won't push history here automatically.
    // User can rely on manual saves or we can add a 'save snapshot' button if needed, 
    // or wrap specific updates like add/remove action/choice in their own functions with history.
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  };
  
  // Wrap complex updates with history
  const updateNodeDataWithHistory = (id: string, newData: any) => {
      pushHistory();
      updateNodeData(id, newData);
  };

  const handleDownloadPlugin = () => {
    generatePlugin(nodes, edges, settings);
  };

  const handleSaveProject = () => {
    const projectData = { nodes, edges, settings };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${settings.pluginName.toLowerCase()}-project.json`;
    a.click();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const projectData = JSON.parse(content);
        if (projectData.nodes && projectData.edges) {
          setNodes(projectData.nodes);
          setEdges(projectData.edges);
          if (projectData.settings) {
            setSettings(projectData.settings);
          }
        } else {
          alert('无效的项目文件格式');
        }
      } catch (err) {
        alert('解析项目文件失败');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addAction = (nodeId: string) => {
    pushHistory();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newActions = [...(node.data.actions || [])];
    newActions.push({ type: 'stat', target: 'money', operation: '+', value: 0 });
    updateNodeData(nodeId, { actions: newActions });
  };

  const updateAction = (nodeId: string, idx: number, field: string, value: any) => {
    // No history push here to avoid spamming history on select/input change
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newActions = [...(node.data.actions || [])];
    newActions[idx] = { ...newActions[idx], [field]: value };
    updateNodeData(nodeId, { actions: newActions });
  };

  const removeAction = (nodeId: string, idx: number) => {
    pushHistory();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newActions = (node.data.actions || []).filter((_action: ActionItem, i: number) => i !== idx);
    updateNodeData(nodeId, { actions: newActions });
  };

  const addCondition = (nodeId: string) => {
    pushHistory();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newConditions = [...(node.data.conditions || [])];
    newConditions.push({ type: 'stat', target: 'money', operation: '>=', value: 0 });
    updateNodeData(nodeId, { conditions: newConditions });
  };

  const updateCondition = (nodeId: string, idx: number, field: string, value: any) => {
    // No history push
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newConditions = [...(node.data.conditions || [])];
    newConditions[idx] = { ...newConditions[idx], [field]: value };
    updateNodeData(nodeId, { conditions: newConditions });
  };

  const removeCondition = (nodeId: string, idx: number) => {
    pushHistory();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newConditions = (node.data.conditions || []).filter((_cond: ConditionItem, i: number) => i !== idx);
    updateNodeData(nodeId, { conditions: newConditions });
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          panOnScroll={false}
          panOnDrag={true}
          zoomOnPinch={true}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ markerEnd: { type: 'arrowclosed' as any } }}
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
          
          {/* Header Bar removed as it is now in App.tsx */}

          <Panel position="top-left" className="bg-white p-1 md:p-2 rounded shadow flex gap-1 md:gap-2 flex-wrap max-w-[calc(100vw-20px)] md:max-w-[500px] overflow-x-auto no-scrollbar items-center">
            <button
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs md:text-sm whitespace-nowrap"
              onClick={() => addNode('story')}
            >
              <Plus size={14} className="md:w-4 md:h-4" /> 剧情
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs md:text-sm whitespace-nowrap"
              onClick={() => addNode('choice')}
            >
              <Plus size={14} className="md:w-4 md:h-4" /> 选项
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs md:text-sm whitespace-nowrap"
              onClick={() => addNode('condition')}
            >
              <AlertCircle size={14} className="md:w-4 md:h-4" /> 判定
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
            {!nodes.find(n => n.data.isStart) && (
                <button
                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs md:text-sm whitespace-nowrap"
                  onClick={() => {
                      pushHistory();
                      setNodes(nds => nds.concat({
                          id: `start_${Date.now()}`,
                          type: 'story',
                          position: { x: 250, y: 100 },
                          data: { label: '开始', text: '故事从此开始...', isStart: true },
                      }));
                  }}
                >
                  <Play size={14} className="md:w-4 md:h-4" /> 起点
                </button>
            )}
            <button
              className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs md:text-sm whitespace-nowrap"
              onClick={() => {
                  if (confirm('确定要清空画布吗？所有节点将丢失。')) {
                      pushHistory();
                      setNodes([]);
                      setEdges([]);
                  }
              }}
            >
              <Trash2 size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">清空</span>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-xs md:text-sm whitespace-nowrap"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={14} className="md:w-4 md:h-4" /> 设置
            </button>
          </Panel>

          <Panel position="top-right" className="bg-white p-1 md:p-2 rounded shadow flex gap-1 md:gap-2 flex-wrap justify-end max-w-[calc(100vw-20px)] md:max-w-none overflow-x-auto no-scrollbar items-center">
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs md:text-sm flex-shrink-0 ${historyIndex > 0 ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo size={14} className="md:w-4 md:h-4" />
            </button>
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs md:text-sm flex-shrink-0 ${historyIndex < history.length - 1 ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo size={14} className="md:w-4 md:h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs md:text-sm whitespace-nowrap"
              onClick={() => setShowGuide(true)}
            >
              <HelpCircle size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">帮助</span>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs md:text-sm whitespace-nowrap"
              onClick={handleSaveProject}
            >
              <Save size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">保存</span>
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs md:text-sm whitespace-nowrap"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">读取</span>
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs md:text-sm whitespace-nowrap"
              onClick={() => {
                  fetch('/example_complex.json')
                      .then(res => res.json())
                      .then(data => {
                          pushHistory();
                          setNodes(data.nodes);
                          setEdges(data.edges);
                          setSettings(data.settings);
                      })
                      .catch(err => alert('加载示例失败: ' + err));
              }}
            >
              <Upload size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">示例</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleLoadProject}
            />
            <div className="w-px h-6 bg-gray-300 mx-1 flex-shrink-0"></div>
            <button
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs md:text-sm whitespace-nowrap"
              onClick={handleDownloadPlugin}
            >
              <Download size={14} className="md:w-4 md:h-4" /> 生成
            </button>
          </Panel>
        </ReactFlow>

      {/* Guide Modal */}
      {showGuide && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">欢迎使用 剧情小说海豹插件编辑器</h2>
                  <div className="space-y-4 text-sm text-gray-600">
                      <p>这是一个可视化的 SealDice 跑团或剧情小说插件编辑器，您可以无需代码即可创作互动故事。</p>
                      
                      <h3 className="font-bold text-gray-800 mt-4">快速上手：</h3>
                      <ul className="list-disc pl-5 space-y-2">
                          <li><strong>剧情节点</strong>：故事的基本单元，包含文本和可选的结算操作（获得物品/数值变更）。</li>
                          <li><strong>选项节点</strong>：提供分支选择，每个选项可以连接不同的后续剧情。</li>
                          <li><strong>判定节点</strong>：根据玩家属性或物品进行自动分歧（成功/失败）。</li>
                          <li><strong>连线</strong>：拖动节点边缘的手柄（Handle）连接到另一个节点。</li>
                      </ul>

                      <h3 className="font-bold text-gray-800 mt-4">移动端操作提示：</h3>
                      <ul className="list-disc pl-5 space-y-2">
                          <li>使用双指进行缩放。</li>
                          <li>单指拖动空白处移动画布。</li>
                          <li>点击节点/连线进行编辑，编辑面板将从底部弹出。</li>
                      </ul>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                      <button
                          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md"
                          onClick={closeGuide}
                      >
                          开始创作
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                  <h2 className="text-xl font-bold text-gray-800">项目设置</h2>
                  <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
                      ✕
                  </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">插件名称</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={settings.pluginName}
                        onChange={(e) => setSettings({ ...settings, pluginName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">指令名称</label>
                      <div className="relative">
                          <span className="absolute left-2 top-2 text-gray-400">.</span>
                          <input
                            type="text"
                            className="w-full border rounded p-2 pl-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="例如: story"
                            value={settings.commandName}
                            onChange={(e) => setSettings({ ...settings, commandName: e.target.value })}
                          />
                      </div>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">指令帮助 (Help)</label>
                  <textarea
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20 text-xs font-mono"
                    placeholder="自定义 .help 输出内容..."
                    value={settings.commandHelp || ''}
                    onChange={(e) => setSettings({ ...settings, commandHelp: e.target.value })}
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">子命令设置 (Subcommands)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {SUBCOMMAND_KEYS.map((cmd) => (
                        <div key={cmd} className="flex gap-2 items-center text-xs">
                            <span className="w-12 font-mono font-bold text-gray-600">{cmd}</span>
                            <input 
                                type="text"
                                className="border rounded p-1 w-20"
                                placeholder="别名"
                                value={settings.subCommands?.[cmd]?.name ?? ''}
                                onChange={(e) => {
                                    setSettings((prev) => ({
                                        ...prev,
                                        subCommands: {
                                            ...(prev.subCommands ?? {}),
                                            [cmd]: {
                                                ...(prev.subCommands?.[cmd] ?? {}),
                                                name: e.target.value
                                            }
                                        }
                                    }));
                                }}
                            />
                            <input 
                                type="text"
                                className="border rounded p-1 flex-1"
                                placeholder="说明 (用于Help)"
                                value={settings.subCommands?.[cmd]?.help ?? ''}
                                onChange={(e) => {
                                    setSettings((prev) => ({
                                        ...prev,
                                        subCommands: {
                                            ...(prev.subCommands ?? {}),
                                            [cmd]: {
                                                ...(prev.subCommands?.[cmd] ?? {}),
                                                help: e.target.value
                                            }
                                        }
                                    }));
                                }}
                            />
                        </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">版本</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={settings.version}
                        onChange={(e) => setSettings({ ...settings, version: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
                      <input
                        type="text"
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={settings.author}
                        onChange={(e) => setSettings({ ...settings, author: e.target.value })}
                      />
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述 (Description)</label>
                  <textarea
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20"
                    placeholder="插件功能描述..."
                    value={settings.description || ''}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主页 URL (Homepage)</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="https://github.com/..."
                    value={settings.homepage || ''}
                    onChange={(e) => setSettings({ ...settings, homepage: e.target.value })}
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">全局规则 (Dice Rules)</label>
                  
                  <div className="mb-2">
                      <label className="text-xs text-gray-600 block mb-1">默认检定骰 (Default Dice)</label>
                      <input
                        type="text"
                        className="w-full border rounded p-1 text-sm"
                        placeholder="1d100"
                        value={settings.diceRules?.defaultDice || '1d100'}
                        onChange={(e) => setSettings({ ...settings, diceRules: { ...settings.diceRules, defaultDice: e.target.value } as any })}
                      />
                  </div>

                  <div className="mb-2">
                      <label className="text-xs text-gray-600 block mb-1">成功判定方式</label>
                      <select
                        className="w-full border rounded p-1 text-sm"
                        value={settings.diceRules?.successMode || 'lte'}
                        onChange={(e) => setSettings({ ...settings, diceRules: { ...settings.diceRules, successMode: e.target.value as 'lte' | 'gte' } as any })}
                      >
                          <option value="lte">骰点 ≤ 目标值 (CoC Like)</option>
                          <option value="gte">骰点 ≥ 目标值 (D&D Like)</option>
                      </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      <div>
                          <span className="text-xs text-green-600 block">大成功阈值</span>
                          <div className="flex gap-1">
                              <select 
                                className="border rounded text-xs w-10"
                                value={settings.diceRules?.criticalSuccessMode || (settings.diceRules?.successMode === 'gte' ? 'gte' : 'lte')}
                                onChange={(e) => setSettings({ ...settings, diceRules: { ...settings.diceRules, criticalSuccessMode: e.target.value as 'lte' | 'gte' } as any })}
                              >
                                  <option value="lte">≤</option>
                                  <option value="gte">≥</option>
                              </select>
                              <input
                                type="number"
                                className="w-full border rounded p-1 text-sm"
                                value={settings.diceRules?.criticalSuccess ?? 5}
                                onChange={(e) => setSettings({ ...settings, diceRules: { ...settings.diceRules, criticalSuccess: parseInt(e.target.value) || 1 } as any })}
                              />
                          </div>
                      </div>
                      <div>
                          <span className="text-xs text-red-600 block">大失败阈值</span>
                          <div className="flex gap-1">
                              <select 
                                className="border rounded text-xs w-10"
                                value={settings.diceRules?.criticalFailureMode || (settings.diceRules?.successMode === 'gte' ? 'lte' : 'gte')}
                                onChange={(e) => setSettings({ ...settings, diceRules: { ...settings.diceRules, criticalFailureMode: e.target.value as 'lte' | 'gte' } as any })}
                              >
                                  <option value="lte">≤</option>
                                  <option value="gte">≥</option>
                              </select>
                              <input
                                type="number"
                                className="w-full border rounded p-1 text-sm"
                                value={settings.diceRules?.criticalFailure ?? 96}
                                onChange={(e) => setSettings({ ...settings, diceRules: { ...settings.diceRules, criticalFailure: parseInt(e.target.value) || 100 } as any })}
                              />
                          </div>
                      </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1">导出设置</label>
                  <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">文件名:</span>
                      <input
                        type="text"
                        className="flex-1 border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={settings.pluginName}
                        value={settings.filename || ''}
                        onChange={(e) => setSettings({ ...settings, filename: e.target.value })}
                      />
                      <span className="text-gray-400 text-sm font-mono">.js</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setShowSettings(false)}
                >
                  取消
                </button>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md transition-all transform active:scale-95"
                  onClick={() => setShowSettings(false)}
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edge Deletion Panel */}
      {selectedEdgeId && !selectedNodeId && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow border border-red-200 z-10 flex flex-col gap-2 min-w-[200px]">
              <div className="flex justify-between items-center border-b pb-1">
                  <span className="text-xs text-gray-600 font-bold">连线设置</span>
              </div>
              
              <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 whitespace-nowrap">权重 (Weight):</label>
                  <input 
                      type="number"
                      className="border rounded text-xs p-1 w-16"
                      min="1"
                      value={(edges.find(e => e.id === selectedEdgeId)?.data?.weight as number) || 1}
                      onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setEdges(eds => eds.map(edge => {
                              if (edge.id === selectedEdgeId) {
                                  return { ...edge, data: { ...edge.data, weight: val } };
                              }
                              return edge;
                          }));
                      }}
                  />
              </div>
              <div className="text-[10px] text-gray-400">
                  当一个剧情节点有多条连线时，将根据权重随机选择一条路径。
              </div>

              <button 
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 w-full mt-1"
                  onClick={() => {
                      setEdges((eds) => eds.filter((edge: any) => edge.id !== selectedEdgeId));
                      setSelectedEdgeId(null);
                  }}
              >
                  删除连线
              </button>
          </div>
      )}

      {/* Property Panel */}
      {selectedNode && (
        <div className="fixed inset-0 md:static md:w-80 md:inset-auto z-50 md:z-auto bg-white md:bg-gray-50 border-t md:border-l md:border-t-0 border-gray-200 p-4 overflow-y-auto h-[60vh] md:h-full mt-auto md:mt-0 shadow-2xl md:shadow-none rounded-t-2xl md:rounded-none transition-transform duration-300 ease-in-out transform translate-y-0">
          <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">编辑节点</h2>
              <button 
                  className="md:hidden p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full"
                  onClick={() => setSelectedNodeId(null)}
              >
                  ✕
              </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">节点标签 (仅编辑器可见)</label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm"
              value={selectedNode.data.label as string}
              onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">存档点 ID (Save Point)</label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm"
              placeholder="可选，例如: chapter1_end"
              value={(selectedNode.data.savePointId as string) || ''}
              onChange={(e) => updateNodeData(selectedNode.id, { savePointId: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">设置后，玩家经过此节点时将自动存档，可使用 load 命令读取。</p>
          </div>

          {selectedNode.type !== 'condition' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">剧情文本</label>
              <textarea
                className="w-full border rounded p-2 text-sm h-32 font-sans"
                value={selectedNode.data.text as string}
                onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
                placeholder="在此输入故事内容..."
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">执行操作 (结算时触发)</label>
            <div className="flex flex-col gap-2">
                {(selectedNode.data.actions as any[])?.map((action, idx) => (
                    <div key={idx} className="bg-blue-50 p-2 rounded border border-blue-100 flex flex-col gap-1">
                        <div className="flex gap-2">
                             <select 
                                className="border rounded text-xs p-1"
                                value={action.type}
                                onChange={(e) => updateAction(selectedNode.id, idx, 'type', e.target.value)}
                             >
                                <option value="stat">数值(Stat)</option>
                                <option value="item">物品(Item)</option>
                             </select>
                             <input 
                                type="text" 
                                className="border rounded text-xs p-1 flex-1"
                                placeholder={action.type === 'stat' ? "属性名 (如 hp)" : "物品名"}
                                value={action.target}
                                onChange={(e) => updateAction(selectedNode.id, idx, 'target', e.target.value)}
                             />
                             <button className="text-red-500 font-bold" onClick={() => removeAction(selectedNode.id, idx)}>×</button>
                        </div>
                        <div className="flex gap-2 items-center">
                            <select 
                                className="border rounded text-xs p-1"
                                value={action.operation}
                                onChange={(e) => updateAction(selectedNode.id, idx, 'operation', e.target.value)}
                             >
                                {action.type === 'stat' ? (
                                    <>
                                        <option value="+">增加 (+)</option>
                                        <option value="-">减少 (-)</option>
                                        <option value="=">设置为 (=)</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="+">获得</option>
                                        <option value="-">失去</option>
                                    </>
                                )}
                             </select>
                             {action.type === 'stat' ? (
                                 <input 
                                    type="text" 
                                    className="border rounded text-xs p-1 w-20"
                                    placeholder="值"
                                    value={action.value}
                                    onChange={(e) => updateAction(selectedNode.id, idx, 'value', e.target.value)}
                                 />
                             ) : (
                                 <input 
                                    type="text" 
                                    className="border rounded text-xs p-1 w-12"
                                    placeholder="数量"
                                    value={action.value || 1}
                                    onChange={(e) => updateAction(selectedNode.id, idx, 'value', e.target.value)}
                                 />
                             )}
                        </div>
                    </div>
                ))}
                <button
                  className="mt-1 text-sm text-blue-600 hover:underline text-left"
                  onClick={() => addAction(selectedNode.id)}
                >
                  + 添加操作
                </button>
            </div>
            
            {/* Hidden Script Area for advanced users or fallback */}
            <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer">高级：直接编辑脚本</summary>
                <textarea
                  className="w-full border rounded p-2 text-sm font-mono h-20 bg-gray-900 text-green-400 mt-1"
                  placeholder="state.stats.affection += 1;"
                  value={(selectedNode.data.script as string) || ''}
                  onChange={(e) => updateNodeDataWithHistory(selectedNode.id, { script: e.target.value })}
                />
            </details>
          </div>

          {selectedNode.type === 'condition' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">判定设置</label>
              
              <div className="flex gap-2 mb-2 bg-gray-100 p-1 rounded">
                  <button
                      className={`flex-1 text-xs py-1 rounded ${!selectedNode.data.conditionMode || selectedNode.data.conditionMode === 'logic' ? 'bg-white shadow' : 'text-gray-500'}`}
                      onClick={() => updateNodeDataWithHistory(selectedNode.id, { conditionMode: 'logic' })}
                  >
                      逻辑判定
                  </button>
                  <button
                      className={`flex-1 text-xs py-1 rounded ${selectedNode.data.conditionMode === 'check' ? 'bg-white shadow' : 'text-gray-500'}`}
                      onClick={() => updateNodeDataWithHistory(selectedNode.id, { conditionMode: 'check' })}
                  >
                      骰点判定
                  </button>
              </div>

              {selectedNode.data.conditionMode === 'check' ? (
                  <div className="space-y-3 bg-purple-50 p-3 rounded border border-purple-100">
                      <div>
                          <label className="text-xs font-bold text-purple-700 block mb-1">检定目标 (Target)</label>
                          <input
                              type="text"
                              className="w-full border rounded text-sm p-1"
                              placeholder="属性名 (如 str) 或 固定值 (50)"
                              value={(selectedNode.data.checkTarget as string) || ''}
                              onChange={(e) => updateNodeDataWithHistory(selectedNode.id, { checkTarget: e.target.value })}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-purple-700 block mb-1">检定骰子 (Dice)</label>
                          <input
                              type="text"
                              className="w-full border rounded text-sm p-1"
                              placeholder="默认 1d100"
                              value={(selectedNode.data.checkDice as string) || ''}
                              onChange={(e) => updateNodeDataWithHistory(selectedNode.id, { checkDice: e.target.value })}
                          />
                      </div>
                      <div className="text-[10px] text-gray-500">
                          将根据全局设置的大成功/大失败规则进行判定。请确保连接了对应的后续节点。
                      </div>
                  </div>
              ) : (
                  <>
                  <div className="mb-2">
                      <span className="text-xs text-gray-600 mr-2">逻辑关系:</span>
                  <select 
                    className="border rounded text-xs p-1"
                    value={(selectedNode.data.conditionLogic as string) || 'AND'}
                    onChange={(e) => updateNodeDataWithHistory(selectedNode.id, { conditionLogic: e.target.value })}
                  >
                    <option value="AND">且 (AND) - 所有条件满足</option>
                    <option value="OR">或 (OR) - 任一条件满足</option>
                  </select>
              </div>

              <div className="flex flex-col gap-2">
                  {(selectedNode.data.conditions as any[])?.map((cond, idx) => (
                      <div key={idx} className="bg-orange-50 p-2 rounded border border-orange-100 flex flex-col gap-1">
                           <div className="flex gap-2">
                                <select 
                                    className="border rounded text-xs p-1"
                                    value={cond.type}
                                    onChange={(e) => updateCondition(selectedNode.id, idx, 'type', e.target.value)}
                                >
                                    <option value="stat">数值判定</option>
                                    <option value="has_item">拥有物品</option>
                                </select>
                                <input 
                                    type="text" 
                                    className="border rounded text-xs p-1 flex-1"
                                    placeholder={cond.type === 'has_item' ? "物品名" : "属性名 (如 hp)"}
                                    value={cond.target}
                                    onChange={(e) => updateCondition(selectedNode.id, idx, 'target', e.target.value)}
                                />
                                <button className="text-red-500 font-bold" onClick={() => removeCondition(selectedNode.id, idx)}>×</button>
                           </div>
                           {cond.type !== 'has_item' && (
                               <div className="flex gap-2 items-center">
                                   <select 
                                        className="border rounded text-xs p-1"
                                        value={cond.operation}
                                        onChange={(e) => updateCondition(selectedNode.id, idx, 'operation', e.target.value)}
                                   >
                                        <option value=">=">大于等于 (≥)</option>
                                        <option value="<=">小于等于 (≤)</option>
                                        <option value=">">大于 (&gt;)</option>
                                        <option value="<">小于 (&lt;)</option>
                                        <option value="=">等于 (=)</option>
                                   </select>
                                   <input 
                                        type="text" 
                                        className="border rounded text-xs p-1 w-20"
                                        placeholder="值"
                                        value={cond.value}
                                        onChange={(e) => updateCondition(selectedNode.id, idx, 'value', e.target.value)}
                                   />
                               </div>
                           )}
                      </div>
                  ))}
                  <button
                    className="mt-1 text-sm text-orange-600 hover:underline text-left"
                    onClick={() => addCondition(selectedNode.id)}
                  >
                    + 添加条件
                  </button>
              </div>
              </>
              )}

              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer">高级：自定义表达式</summary>
                <textarea
                    className="w-full border rounded p-2 text-sm font-mono h-20 bg-orange-50 text-gray-800 border-orange-200 mt-1"
                    placeholder="state.stats.affection >= 10"
                    value={(selectedNode.data.condition as string) || ''}
                    onChange={(e) => updateNodeDataWithHistory(selectedNode.id, { condition: e.target.value })}
                />
              </details>
            </div>
          )}

          {selectedNode.type === 'choice' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">选项列表</label>
              <div className="flex flex-col gap-2">
                {(selectedNode.data.choices as any[])?.map((choice, idx) => (
                  <div key={choice.id} className="flex flex-col gap-1 p-2 border rounded bg-white">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-gray-400 font-mono">#{idx+1}</span>
                        <input
                          type="text"
                          className="flex-1 border rounded p-1 text-sm"
                          value={choice.text}
                          onChange={(e) => {
                            const newChoices = [...(selectedNode.data.choices as any[])];
                        newChoices[idx] = { ...choice, text: e.target.value };
                        updateNodeData(selectedNode.id, { choices: newChoices });
                        // No history on text input change
                      }}
                    />
                    <button
                      className="text-red-500 hover:text-red-700 font-bold px-2"
                      onClick={() => {
                        pushHistory();
                        const newChoices = (selectedNode.data.choices as any[]).filter((c) => c.id !== choice.id);
                        updateNodeData(selectedNode.id, { choices: newChoices });
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Choice Actions */}
                  <div className="pl-4 border-l-2 border-purple-100 mt-1">
                      <label className="text-[10px] text-gray-500 block mb-1">选择后执行:</label>
                      {choice.actions?.map((action: ActionItem, aIdx: number) => (
                          <div key={aIdx} className="flex gap-1 items-center mb-1 text-xs">
                              <select 
                                  className="border rounded p-0.5 text-[10px] w-14"
                                  value={action.type}
                                  onChange={(e) => {
                                      const newChoices = [...(selectedNode.data.choices as any[])];
                                      const newActions = [...(newChoices[idx].actions || [])];
                                      newActions[aIdx] = { ...newActions[aIdx], type: e.target.value as any };
                                      newChoices[idx] = { ...newChoices[idx], actions: newActions };
                                      updateNodeData(selectedNode.id, { choices: newChoices });
                                  }}
                              >
                                  <option value="stat">数值</option>
                                  <option value="item">物品</option>
                              </select>
                              <input 
                                  className="border rounded p-0.5 w-16"
                                  placeholder="目标"
                                  value={action.target}
                                  onChange={(e) => {
                                      const newChoices = [...(selectedNode.data.choices as any[])];
                                      const newActions = [...(newChoices[idx].actions || [])];
                                      newActions[aIdx] = { ...newActions[aIdx], target: e.target.value };
                                      newChoices[idx] = { ...newChoices[idx], actions: newActions };
                                      updateNodeData(selectedNode.id, { choices: newChoices });
                                  }}
                              />
                              <select 
                                  className="border rounded p-0.5 w-10"
                                  value={action.operation}
                                  onChange={(e) => {
                                      const newChoices = [...(selectedNode.data.choices as any[])];
                                      const newActions = [...(newChoices[idx].actions || [])];
                                      newActions[aIdx] = { ...newActions[aIdx], operation: e.target.value as any };
                                      newChoices[idx] = { ...newChoices[idx], actions: newActions };
                                      updateNodeData(selectedNode.id, { choices: newChoices });
                                  }}
                              >
                                  <option value="+">+</option>
                                  <option value="-">-</option>
                                  <option value="=">=</option>
                              </select>
                              {action.type === 'stat' && (
                                  <input 
                                      className="border rounded p-0.5 w-10"
                                      placeholder="值"
                                      value={action.value}
                                      onChange={(e) => {
                                          const newChoices = [...(selectedNode.data.choices as any[])];
                                          const newActions = [...(newChoices[idx].actions || [])];
                                          newActions[aIdx] = { ...newActions[aIdx], value: e.target.value };
                                          newChoices[idx] = { ...newChoices[idx], actions: newActions };
                                          updateNodeData(selectedNode.id, { choices: newChoices });
                                      }}
                                  />
                              )}
                              <button 
                                  className="text-red-400 hover:text-red-600 px-1"
                                  onClick={() => {
                                      pushHistory();
                                      const newChoices = [...(selectedNode.data.choices as any[])];
                                      const newActions = (newChoices[idx].actions || []).filter((_: any, i: number) => i !== aIdx);
                                      newChoices[idx] = { ...newChoices[idx], actions: newActions };
                                      updateNodeData(selectedNode.id, { choices: newChoices });
                                  }}
                              >
                                  ×
                              </button>
                          </div>
                      ))}
                      <button
                          className="text-[10px] text-purple-600 hover:underline"
                          onClick={() => {
                              pushHistory();
                              const newChoices = [...(selectedNode.data.choices as any[])];
                              const newActions = [...(newChoices[idx].actions || [])];
                              newActions.push({ type: 'stat', target: 'money', operation: '+', value: 10 });
                              newChoices[idx] = { ...newChoices[idx], actions: newActions };
                              updateNodeData(selectedNode.id, { choices: newChoices });
                          }}
                      >
                          + 添加变更
                      </button>
                  </div>
              </div>
            ))}
            <button
              className="mt-1 text-sm text-blue-600 hover:underline text-left"
              onClick={() => {
                pushHistory();
                const newChoices = [...(selectedNode.data.choices as any[] || []), { id: `opt_${Date.now()}`, text: '新选项' }];
                updateNodeData(selectedNode.id, { choices: newChoices });
              }}
            >
              + 添加选项
            </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t mt-4">
            <button
              className="w-full py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
              onClick={() => {
                setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                setSelectedNodeId(null);
              }}
            >
              删除节点
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
