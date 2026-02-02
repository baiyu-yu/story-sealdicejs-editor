import type { Node } from '@xyflow/react';

export type NodeKind = 'story' | 'choice' | 'condition';

export interface SubCommandConfig {
  name?: string;
  help?: string;
}

export interface ProjectSettings {
  pluginName: string;
  commandName: string;
  subCommands?: Partial<
    Record<'start' | 'next' | 'choose' | 'stat' | 'load' | 'reset' | 'clear', SubCommandConfig>
  >;
  version: string;
  author: string;
  description?: string;
  homepage?: string;
  filename?: string;
  diceRules?: {
      criticalSuccess: number; 
      criticalFailure: number; 
      defaultDice?: string; 
      successMode?: 'lte' | 'gte'; 
      criticalSuccessMode?: 'lte' | 'gte';
      criticalFailureMode?: 'lte' | 'gte';
  };
}

export type StatOperation = '+' | '-' | '=' | '+=' | '-=';

export interface ActionItem {
  type: 'stat' | 'item';
  target: string;
  operation: StatOperation;
  value?: number | string;
}

export type ConditionOperation = '>=' | '<=' | '>' | '<' | '=' | '==';

export interface ConditionItem {
  type: 'stat' | 'has_item';
  target: string;
  operation: ConditionOperation;
  value?: number | string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  actions?: ActionItem[];
}

export interface NodeData {
  label: string;
  text?: string;
  script?: string;
  actions?: ActionItem[];
  
  condition?: string;
  conditions?: ConditionItem[];
  conditionLogic?: 'AND' | 'OR';
  
  conditionMode?: 'logic' | 'check';
  checkTarget?: string; 
  checkDice?: string; 

  savePointId?: string; 

  isStart?: boolean;
  choices?: ChoiceOption[];
  [key: string]: unknown;
}

export type StoryNode = Node<NodeData, 'story'>;
export type ChoiceNode = Node<NodeData, 'choice'>;
export type ConditionNode = Node<NodeData, 'condition'>;

export type AppNode = Node<NodeData, NodeKind>;
