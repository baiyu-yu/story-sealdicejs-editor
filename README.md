# 剧情小说海豹插件可视化编辑器

这是一个可视化的剧情/跑团插件编辑器，专为 **SealDice (海豹核心)** 设计。你可以通过拖拽节点来创作互动小说、RPG 剧本，并一键生成可用的 JS 插件。

这是伟大的AI所完成的大部分逻辑，我只是一个测试员和微调者.jpg

## 功能特性

*   **可视化流式编辑**：通过拖拽节点、连线（支持箭头指向）即可构建复杂的剧情逻辑。
*   **丰富的节点类型**：
    *   **剧情节点 (Story)**：展示文本，支持数值/物品变更（支持骰点表达式，如 `获得 1d10 金币`）。
    *   **选项节点 (Choice)**：提供分支选项，让玩家决定走向，选项也可附带奖励/惩罚。
    *   **判定节点 (Condition)**：
        *   **逻辑判定**：根据属性数值或物品拥有情况自动分歧（例如：好感度 > 10，拥有某物品）。
        *   **骰点判定**：模拟跑团检定（如 `1d100 <= 敏捷`），支持大成功/大失败/成功/失败四种分支。
*   **动态文本显示**：在剧情文本中使用变量标识符显示玩家属性值（如 `{$gold}` 显示金币数量）。
*   **多气泡消息**：使用 `\f` 分隔符将长文本分成多个消息气泡发送。
*   **随机分支**：当剧情节点有多个出口时，自动随机选择下一个节点。
*   **全局规则配置**：支持自定义全局骰点规则（CoC模式/D&D模式，大成功/大失败阈值，默认检定骰）。
*   **存档系统**：支持设置存档点，玩家可随时读取存档继续游戏。
*   **一键生成插件**：自动生成标准的 SealDice JavaScript 插件，无需编写任何代码。
*   **工程管理**：支持保存/读取 JSON 工程文件，支持从示例工程快速开始。
*   **移动端适配**：优化了在手机/平板上的显示和操作体验。

## 快速开始

### 1. 在线使用
[Github Pages](https://baiyu-yu.github.io/story-sealdicejs-editor/)

### 2. 本地运行

如果你是开发者或希望本地运行：

```bash
# 安装依赖
npm install

# 启动编辑器
npm run dev
```

浏览器打开 http://localhost:5173 即可使用。

## 使用教程

1.  **创建节点**：点击左上角的工具栏添加"剧情"、"选项"或"判定"节点。
2.  **编辑内容**：点击节点，在底部/侧边面板修改文本、操作或条件。
    *   **数值变更**：选择属性名、操作符，输入数值或表达式（如 `1d6+5`）。
    *   **判定设置**：在判定节点中切换"逻辑判定"或"骰点判定"模式。
    *   **存档点设置**：在节点属性中设置 `存档点 ID` (Save Point ID)。当玩家到达该节点时，进度会自动保存。玩家可以使用 `.<指令> load <id>` 读取存档。
3.  **连接节点**：从一个节点的下方/右侧点点拖拽连线到另一个节点的上方点点。
4.  **设置插件信息**：点击"设置"按钮，配置插件名称、触发指令（如 `story`）及全局骰点规则。
5.  **生成插件**：点击"生成插件"，下载 `.js` 文件。
6.  **安装到海豹**：将 `.js` 文件放入 SealDice 的 `data/scripts` 目录，或直接在webui点击上传，重载 JS 即可。

## 示例工程

编辑器内置了一个 `TavernTales`（酒馆传说）示例工程。点击编辑器右上角的 **"示例"** 按钮即可加载。该示例是一个完整的互动故事，展示了编辑器的所有核心功能：

### 故事概要
玩家在黑鱼酒馆开始冒险，可以选择喝酒、打听传闻、偷窃藏宝图等。根据选择可能触发酒馆斗殴、遇见神秘老人学习武功，或者前往西海岸探索幽灵船。最终根据玩家的声望和知识值决定结局。

### 功能演示

| 功能 | 示例位置 |
|------|----------|
| **骰点检定（四分支）** | 偷窃藏宝图 → 敏捷检定（大成功/成功/失败/大失败） |
| **逻辑判定（AND）** | 喝酒后 → HP > 105 判定是否喝醉 |
| **逻辑判定（OR）** | 结局判定 → 声望 >= 20 或 知识 >= 3 获得好结局 |
| **物品检查（has_item）** | 进入船舱 → 检查是否拥有火把 |
| **变量插值** | 多处显示 `{$gold}`、`{$hp}/{$maxHp}` 等 |
| **物品数量显示** | 阅读纸条时显示 `{$item:神秘纸条}` |
| **多气泡消息（\f）** | 大部分剧情节点使用 `\f` 分割多段对话 |
| **随机分支** | 逃离幽灵船后 → 随机遇到商人或巡逻队 |
| **骰点表达式** | 喝酒恢复 `1d10` HP，宝箱获得 `1d10+5` 古金币 |
| **存档点** | 酒馆斗殴前、阅读纸条、登船、面对船长处设有存档点 |
| **多结局系统** | 好结局、普通结局、休息结局、死亡结局 |
| **购买系统** | 酒馆购买火把、朗姆酒、疗伤药 |
| **技能学习** | 神秘老人传授铁头功或轻功 |

## 配置文件格式说明

编辑器使用 JSON 格式保存工程文件，包含 `nodes`（节点）、`edges`（连接）和 `settings`（设置）三个主要部分。

### 整体结构

```json
{
  "nodes": [],
  "edges": [],
  "settings": {}
}
```

### 1. Nodes（节点）

节点是剧情流程的基本单元，有三种类型：`story`（剧情）、`choice`（选项）、`condition`（判定）。

#### 共同属性

```json
{
  "id": "唯一标识符",
  "type": "story|choice|condition",
  "position": { "x": 坐标, "y": 坐标 },
  "data": { ... }
}
```

#### Story 节点（剧情节点）

用于展示剧情文本并执行属性/物品变更。

```json
{
  "id": "story1",
  "type": "story",
  "position": { "x": 250, "y": 50 },
  "data": {
    "label": "节点标签",
    "text": "剧情文本内容\n支持多行\f使用\\f分隔多个消息气泡",
    "savePointId": "checkpoint_1",
    "isStart": true,
    "actions": [
      { "type": "stat", "target": "属性名", "operation": "+", "value": "1d10" },
      { "type": "item", "target": "物品名", "operation": "+", "value": 1 }
    ]
  }
}
```

**Data 属性说明：**
- `label`: 在编辑器中显示的节点标签
- `text`: 剧情文本，支持换行符 `\n` 和气泡分隔符 `\f`
- `savePointId`: 可选，存档点ID，玩家到达此节点时自动存档
- `isStart`: 是否为起始节点（每个剧情只能有一个）
- `actions`: 执行的操作列表

**Actions 属性说明：**
- `type`: `stat`（数值属性）或 `item`（物品）
- `target`: 属性名或物品名
- `operation`: 操作符 `=`, `+`, `-`（stat 还支持 `*`, `/`）
- `value`: 数值或骰点表达式（如 `1d10+5`）

**随机分支：**
当一个 Story 节点有多条出边时，系统会随机选择一条路径。这可以用于随机事件。

#### Choice 节点（选项节点）

提供分支选项，让玩家选择剧情走向。

```json
{
  "id": "choice1",
  "type": "choice",
  "position": { "x": 250, "y": 250 },
  "data": {
    "label": "节点标签",
    "text": "选项前的描述文本，可使用 {$gold} 显示属性值",
    "savePointId": "choice_checkpoint",
    "choices": [
      {
        "id": "opt1",
        "text": "选项文本",
        "actions": []
      }
    ]
  }
}
```

#### Condition 节点（判定节点）

根据条件自动分支，支持逻辑判定和骰点判定两种模式。

##### 逻辑判定模式

```json
{
  "id": "condition1",
  "type": "condition",
  "position": { "x": 250, "y": 450 },
  "data": {
    "label": "节点标签",
    "conditions": [
      { "type": "stat", "target": "hp", "operation": ">", "value": 50 },
      { "type": "has_item", "target": "火把" }
    ],
    "conditionLogic": "AND"
  }
}
```

**Conditions 属性说明：**
- `type`: `stat`（检查属性值）或 `has_item`（检查是否拥有物品）
- `target`: 属性名或物品名
- `operation`: 比较操作符 `>=`, `<=`, `>`, `<`, `=`, `==`（仅 stat 类型需要）
- `value`: 比较值（仅 stat 类型需要）

**conditionLogic**: `AND`（所有条件都满足）或 `OR`（任一条件满足）

##### 骰点判定模式

```json
{
  "id": "condition2",
  "type": "condition",
  "position": { "x": 250, "y": 650 },
  "data": {
    "label": "节点标签",
    "conditionMode": "check",
    "checkTarget": "dex",
    "checkDice": "1d100"
  }
}
```

骰点判定会根据全局骰点规则产生四种结果：`great_success`（大成功）、`success`（成功）、`failure`（失败）、`great_failure`（大失败）。

### 2. Edges（连接）

连接定义了节点之间的流转关系。

```json
[
  { "id": "e1", "source": "起始节点ID", "target": "目标节点ID", "markerEnd": { "type": "arrowclosed" } },
  { "id": "e2", "source": "choice1", "sourceHandle": "opt1", "target": "story2", "markerEnd": { "type": "arrowclosed" } },
  { "id": "e3", "source": "condition2", "sourceHandle": "success", "target": "story3", "markerEnd": { "type": "arrowclosed" } }
]
```

**SourceHandle 说明：**
- 普通连接：无需指定 `sourceHandle`
- 选项连接：`sourceHandle` 为选项的 `id`
- 判定结果连接：
  - 逻辑判定：`true` 或 `false`
  - 骰点判定：`great_success`（大成功）、`success`（成功）、`failure`（失败）、`great_failure`（大失败）

### 3. Settings（设置）

包含插件信息和全局骰点规则配置。

```json
{
  "pluginName": "插件名称",
  "commandName": "触发指令",
  "version": "1.0.0",
  "author": "作者名",
  "description": "插件描述",
  "homepage": "项目链接",
  "subCommands": {
    "start": { "name": "start", "help": "开始新游戏" },
    "next": { "name": "next", "help": "继续剧情" },
    "choose": { "name": "choose", "help": "选择选项" },
    "stat": { "name": "stat", "help": "查看状态" },
    "load": { "name": "load", "help": "读取存档" },
    "reset": { "name": "reset", "help": "重置游戏" }
  },
  "diceRules": {
    "defaultDice": "1d100",
    "successMode": "lte",
    "criticalSuccess": 5,
    "criticalFailure": 96,
    "criticalSuccessMode": "lte",
    "criticalFailureMode": "gte"
  }
}
```

**diceRules 说明：**
- `defaultDice`: 默认检定骰子
- `successMode`: 成功判定模式，`lte`（小于等于目标值成功，如 CoC）或 `gte`（大于等于目标值成功，如 D&D）
- `criticalSuccess`: 大成功阈值
- `criticalFailure`: 大失败阈值
- `criticalSuccessMode`: 大成功判定模式
- `criticalFailureMode`: 大失败判定模式

## 动态文本

在节点文本中可以使用变量标识符动态显示玩家数据：

| 语法 | 说明 | 示例 |
|------|------|------|
| `{$属性名}` | 显示属性值 | `你有 {$gold} 金币` |
| `{$item:物品名}` | 显示物品数量 | `你有 {$item:火把} 个火把` |

## 配置示例

完整的配置文件示例请查看 `public/example_complex.json` 文件，这是一个包含 60+ 节点的完整互动故事。

## 许可证

MIT License
