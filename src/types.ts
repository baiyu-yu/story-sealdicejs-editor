import type { Node } from '@xyflow/react';

export type NodeKind = 'story' | 'choice' | 'condition';

export interface SubCommandConfig {
  name?: string;
  help?: string;
}

export interface ProjectSettings {
  pluginName: string;
  commandName: string;
  commandHelp?: string;
  subCommands?: Partial<
    Record<'start' | 'next' | 'choose' | 'stat' | 'load' | 'reset' | 'clear', SubCommandConfig>
  >;
  version: string;
  author: string;
  description?: string;
  homepage?: string;
  filename?: string;
  diceRules?: {
      criticalSuccess: number; // e.g. 5
      criticalFailure: number; // e.g. 96
      defaultDice?: string; // e.g. '1d100'
      successMode?: 'lte' | 'gte'; // 'lte' (<=) or 'gte' (>=)
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
  
  // Condition Node - Logic Mode
  condition?: string;
  conditions?: ConditionItem[];
  conditionLogic?: 'AND' | 'OR';
  
  // Condition Node - Dice Check Mode
  conditionMode?: 'logic' | 'check';
  checkTarget?: string; // Stat name e.g. 'str' or fixed value '50'
  checkDice?: string; // e.g. '1d100'

  savePointId?: string; // Identifier for save point

  isStart?: boolean;
  choices?: ChoiceOption[];
  [key: string]: unknown;
}

export type StoryNode = Node<NodeData, 'story'>;
export type ChoiceNode = Node<NodeData, 'choice'>;
export type ConditionNode = Node<NodeData, 'condition'>;

export type AppNode = Node<NodeData, NodeKind>;
