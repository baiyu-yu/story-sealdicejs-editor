import { ReactFlowProvider } from '@xyflow/react';
import Editor from './components/Editor';
import '@xyflow/react/dist/style.css';
import { Github } from 'lucide-react';

function App() {
  return (
    <ReactFlowProvider>
      <div className="w-full h-full flex flex-col">
        <header className="h-14 bg-gray-900 text-white flex items-center px-4 justify-between border-b border-gray-700">
          <h1 className="text-lg font-bold flex items-center gap-2 text-sm md:text-lg">
            剧情小说海豹插件编辑器
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400 hidden md:block">
              单人冒险故事！
            </div>
            <a href="https://github.com/baiyu-yu/story-sealdicejs-editor" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="GitHub Repository">
              <Github size={24} />
            </a>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <Editor />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
