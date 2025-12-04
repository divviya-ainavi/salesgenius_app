// Pipeline Stage Types
export type DealStage =
  | 'leads'
  | 'appointment-set'
  | 'qualified'
  | 'presentation'
  | 'proposal-sent'
  | 'negotiation-started';

export type DealStatus = 'active' | 'closed-won' | 'closed-lost';

export type LAPSPhase = 'L' | 'A' | 'P' | 'S';

export type HealthStatus = 'healthy' | 'at-risk' | 'stalled';

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'declining';

export type InteractionType = 'call' | 'email' | 'meeting' | 'demo';

export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Event'
  | 'Cold Outreach'
  | 'LinkedIn'
  | 'Partner';

// Stakeholder Types
export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  role: 'champion' | 'decision-maker' | 'influencer' | 'blocker' | 'end-user';
  sentiment: 'supportive' | 'neutral' | 'skeptical' | 'opposed';
  influence: 'high' | 'medium' | 'low';
  notes?: string;
}

// Research Summary
export interface ResearchSummary {
  companyOverview: string;
  recentNews: string[];
  talkingPoints: string[];
  lastUpdated: Date;
}

// Last Interaction
export interface LastInteraction {
  type: InteractionType;
  date: Date;
  summary: string;
}

// Next Best Move
export interface NextBestMove {
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
}

// Deal Card (Main Type)
export interface DealCard {
  id: string;
  dealName: string;
  status: DealStatus;
  stage: DealStage;

  // Company Info
  companyName: string;
  companyId?: string;
  companyLogo?: string;

  // Contact Info
  contactName: string;
  contactTitle: string;
  primaryContactId?: string;

  // Deal Value
  value: number;
  currency: string;

  // Deal Health & Metrics
  confidence: number;
  health: HealthStatus;
  engagementScore: number;

  // Lead Info
  leadSource?: LeadSource;
  appointmentDate?: Date;
  sequenceStatus?: string;

  // Sentiment & Interactions
  sentiment: Sentiment;
  lastInteraction: LastInteraction;

  // Stakeholders & Research
  stakeholders: Stakeholder[];
  researchSummary?: ResearchSummary;

  // Sales Intelligence
  painPoints: string[];
  objections: string[];
  nextBestMove?: NextBestMove;

  // Metadata
  owner: string;
  createdAt: Date;
  updatedAt: Date;
  daysSinceLastActivity: number;

  // Notes & Close Info
  notes?: string;
  wonDate?: Date;
  lostDate?: Date;
  closeReason?: string;
}

// Pipeline Stage (for column display)
export interface PipelineStage {
  id: DealStage;
  name: string;
  description: string;
  dealCount: number;
  totalDeals: number;
  totalValue: number;
  averageConfidence: number;
  deals: DealCard[];
}

// Filters
export interface PipelineFilters {
  search: string;
  owners: string[];
  stages: DealStage[];
  statuses: DealStatus[];
  healthStatuses: HealthStatus[];
  confidenceRange: [number, number];
}
