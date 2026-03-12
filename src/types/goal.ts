export type GoalType = 'numeric' | 'habit';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type GoalLinkType = 'category' | 'templates';

export interface GoalLink {
  type: GoalLinkType;
  category?: string;
  templateIds?: string[];
}

export interface GoalCheckIn {
  id: string;
  goalId: string;
  value: number;
  note?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  status: GoalStatus;
  link: GoalLink;
  createdAt: string;
  completedAt: string | null;

  // Numeric goal fields
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  direction: 'increase' | 'decrease' | null;

  lastCheckInAt: string | null;
}
