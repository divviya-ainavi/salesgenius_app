import { DealCard, DealStage, DealStatus, ResearchSummary } from "@/types/pipeline";
import { addDays, subDays } from "date-fns";

const leadSources: Array<'Website' | 'Referral' | 'Event' | 'Cold Outreach' | 'LinkedIn' | 'Partner'> = 
  ['Website', 'Referral', 'Event', 'Cold Outreach', 'LinkedIn', 'Partner'];

const generateResearchSummary = (companyName: string): ResearchSummary => ({
  companyOverview: `${companyName} is a mid-market enterprise focused on digital transformation. They've recently expanded operations and are seeking modern solutions to scale efficiently.`,
  recentNews: [
    `${companyName} announced Q4 revenue growth of 23% year-over-year`,
    'Expanded into European market with new London office',
    'Appointed new CTO focused on cloud infrastructure modernization',
  ],
  talkingPoints: [
    'Recent funding round indicates growth trajectory and budget availability',
    'Current tech stack includes legacy systems causing operational bottlenecks',
    'Leadership publicly committed to digital-first strategy',
    'Competitors in their space have adopted similar solutions successfully',
  ],
  lastUpdated: subDays(new Date(), 2),
});

const dealNames = [
  'Digital Transformation', 'Enterprise Upgrade', 'Platform Expansion', 
  'SaaS Migration', 'Multi-Year Contract', 'Strategic Partnership',
  'Pilot Program', 'Expansion Deal', 'Upsell Opportunity'
];

const companies = [
  { name: 'Acme Corp', domain: 'acme.com' },
  { name: 'TechStart Ltd', domain: 'techstart.io' },
  { name: 'Global Industries', domain: 'globalind.com' },
  { name: 'Innovation Partners', domain: 'innovpart.co' },
  { name: 'Future Systems', domain: 'futuresys.com' },
  { name: 'Digital Dynamics', domain: 'digdyn.io' },
  { name: 'Growth Solutions', domain: 'growthsol.com' },
  { name: 'Enterprise Tech', domain: 'enttech.co.uk' },
  { name: 'Cloud First', domain: 'cloudfirst.io' },
  { name: 'Scale Ventures', domain: 'scalevc.com' },
];

const contacts = [
  { name: 'Sarah Johnson', title: 'VP of Operations' },
  { name: 'Michael Chen', title: 'Head of Technology' },
  { name: 'Emily Rodriguez', title: 'Chief Digital Officer' },
  { name: 'David Thompson', title: 'IT Director' },
  { name: 'Lisa Martinez', title: 'VP of Engineering' },
  { name: 'James Wilson', title: 'CTO' },
  { name: 'Rachel Green', title: 'Director of Innovation' },
  { name: 'Tom Anderson', title: 'Head of Systems' },
  { name: 'Anna Kowalski', title: 'VP of Product' },
  { name: 'Chris Lee', title: 'Chief Technology Officer' },
];

const nextBestMoves = {
  'appointment-set': [
    { action: 'Confirm meeting agenda and attendees', rationale: 'Ensure first meeting is productive and includes key stakeholders', priority: 'high' as const },
    { action: 'Research company recent news and initiatives', rationale: 'Build context for discovery questions', priority: 'medium' as const },
  ],
  'qualified': [
    { action: 'Schedule technical deep dive', rationale: 'Strong champion needs technical validation', priority: 'high' as const },
    { action: 'Request access to decision maker', rationale: 'Qualify budget authority and timeline', priority: 'high' as const },
  ],
  'presentation': [
    { action: 'Deliver tailored solution presentation', rationale: 'Custom demo addressing key pain points identified', priority: 'high' as const },
    { action: 'Prepare ROI analysis based on discovery', rationale: 'Build business case for economic buyer', priority: 'medium' as const },
  ],
  'proposal-sent': [
    { action: 'Follow up on proposal questions', rationale: 'Address objections and clarify pricing', priority: 'high' as const },
    { action: 'Schedule proposal review meeting', rationale: 'Walk through details with full buying committee', priority: 'high' as const },
  ],
  'negotiation-started': [
    { action: 'Finalize contract terms', rationale: 'Address legal requirements and close date', priority: 'high' as const },
    { action: 'Schedule executive sponsor call', rationale: 'Senior alignment to unblock final approvals', priority: 'high' as const },
  ],
};

const sequenceStatuses = [
  '📊 ICP Analysis Complete',
  '📧 Email 1 of 5 sent',
  '📧 Email 2 of 5 sent - Opened 2x',
  '👀 Case study viewed',
  '📞 Voicemail left',
  '💼 LinkedIn InMail sent',
  '🔄 Awaiting reply (3 days)',
];

const interactionTypes: Array<'call' | 'email' | 'meeting' | 'demo'> = ['call', 'email', 'meeting', 'demo'];
const sentiments: Array<'positive' | 'neutral' | 'negative' | 'declining'> = ['positive', 'neutral', 'negative', 'declining'];
const healthStatuses: Array<'healthy' | 'at-risk' | 'stalled'> = ['healthy', 'at-risk', 'stalled'];

const interactionSummaries = {
  call: [
    'Discussed current pain points and challenges with legacy system.',
    'Productive call covering technical requirements and timeline.',
    'Quick sync on next steps and stakeholder alignment.',
  ],
  email: [
    'Shared case study from similar company in their industry.',
    'Follow-up with additional resources and pricing information.',
    'Answered questions about implementation timeline.',
  ],
  meeting: [
    'Full discovery session with IT and operations teams.',
    'Demo walkthrough with positive feedback on key features.',
    'Strategy session covering integration requirements.',
  ],
  demo: [
    'Live demo of platform focusing on their specific use cases.',
    'Interactive workshop showing ROI potential.',
    'Technical deep-dive with engineering team.',
  ],
};

// Helper function to generate stakeholders
const generateStakeholders = () => {
  const roles: Array<'champion' | 'decision-maker' | 'influencer' | 'blocker'> = 
    ['champion', 'decision-maker', 'influencer'];
  
  return roles.map((role, i) => ({
    id: `stakeholder-${i}`,
    name: ['Sarah Chen', 'Michael Wong', 'Jessica Taylor'][i],
    title: ['VP Engineering', 'CTO', 'Head of Operations'][i],
    role,
    influence: [9, 10, 7][i],
    sentiment: ['positive', 'neutral', 'positive'][i] as 'positive' | 'neutral' | 'negative',
  }));
};

const generateDealForStage = (stage: DealStage, index: number): DealCard => {
  const company = companies[index % companies.length];
  const contact = contacts[index % contacts.length];
  const dealName = dealNames[index % dealNames.length];
  const interactionType = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
  
  // Determine if LAPS stage (only 'leads')
  const isLAPSStage = stage === 'leads';
  
  // Base confidence by stage
  const baseConfidence: Record<DealStage, number> = {
    'leads': 15,
    'appointment-set': 30,
    'qualified': 50,
    'presentation': 65,
    'proposal-sent': 75,
    'negotiation-started': 85,
  };
  
  const confidence = baseConfidence[stage] + Math.floor(Math.random() * 15);
  
  // Stage-specific fields
  const isAppointmentStage = stage === 'appointment-set';
  const isQualifiedStage = stage === 'qualified';
  
  return {
    id: `deal-${stage}-${index}`,
    dealName,
    status: 'active' as DealStatus,
    stage,
    companyName: company.name,
    companyLogo: `https://logo.clearbit.com/${company.domain}`,
    contactName: contact.name,
    contactTitle: contact.title,
    value: 50000 + Math.floor(Math.random() * 450000),
    currency: 'GBP' as const,
    confidence,
    health: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
    engagementScore: 40 + Math.floor(Math.random() * 60),
    
    // Lead-specific fields
    ...(isLAPSStage && {
      leadSource: leadSources[Math.floor(Math.random() * leadSources.length)],
      sequenceStatus: sequenceStatuses[Math.floor(Math.random() * sequenceStatuses.length)],
    }),
    
    // Appointment-specific fields
    ...(isAppointmentStage && {
      appointmentDate: addDays(new Date(), Math.floor(Math.random() * 14) + 1),
      calendarIntegrated: Math.random() > 0.3,
      researchSummary: generateResearchSummary(company.name),
    }),
    
    // Research summary for qualified stage too
    ...(isQualifiedStage && {
      researchSummary: generateResearchSummary(company.name),
    }),
    
    // Next best move for non-leads stages
    ...(!isLAPSStage && {
      nextBestMove: {
        ...nextBestMoves[stage as keyof typeof nextBestMoves][Math.floor(Math.random() * nextBestMoves[stage as keyof typeof nextBestMoves].length)],
        dueDate: addDays(new Date(), Math.floor(Math.random() * 7) + 1),
      },
    }),
    
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    lastInteraction: {
      type: interactionType,
      date: subDays(new Date(), Math.floor(Math.random() * 14)),
      summary: interactionSummaries[interactionType][Math.floor(Math.random() * interactionSummaries[interactionType].length)],
    },
    stakeholders: generateStakeholders(),
    painPoints: [
      'Legacy system causing operational inefficiencies',
      'Manual processes leading to errors and delays',
      'Scaling challenges with current infrastructure',
    ],
    objections: [
      'Budget approval timeline unclear',
      'Integration complexity concerns',
      'Change management for team adoption',
    ],
    owner: ['Alice Smith', 'Bob Jones', 'Carol White'][index % 3],
    createdAt: subDays(new Date(), 30 + Math.floor(Math.random() * 60)),
    updatedAt: subDays(new Date(), Math.floor(Math.random() * 7)),
    daysSinceLastActivity: Math.floor(Math.random() * 14),
  };
};

const generateMockDeals = (): DealCard[] => {
  const allDeals: DealCard[] = [];
  
  // Deal distribution across new 6-stage pipeline
  const dealDistribution: Record<DealStage, number> = {
    'leads': 8,
    'appointment-set': 6,
    'qualified': 5,
    'presentation': 4,
    'proposal-sent': 3,
    'negotiation-started': 2,
  };
  
  Object.entries(dealDistribution).forEach(([stage, count]) => {
    for (let i = 0; i < count; i++) {
      const deal = generateDealForStage(stage as DealStage, i);
      // Assign "You" as owner for first 3 deals in each stage
      if (i < 3) {
        deal.owner = 'You';
      }
      // Add sample notes for first deal in each stage
      if (i === 0) {
        deal.notes = `Initial assessment:\n- Strong potential fit\n- Key stakeholders identified\n- Follow-up scheduled`;
      }

      // Add AI nudges to deals that are ready to advance
      // Appointment-set → Qualified (if meeting happened)
      if (stage === 'appointment-set' && deal.lastInteraction.type === 'meeting' && i < 2) {
        deal.aiNudge = {
          suggestedStage: 'qualified',
          reason: 'Discovery call completed successfully. Key stakeholders engaged and budget confirmed.',
          confidence: 75 + Math.floor(Math.random() * 15),
          createdAt: subDays(new Date(), Math.floor(Math.random() * 3) + 1),
          dismissed: false
        };
      }
      
      // Qualified → Presentation (if healthy and recent activity)
      if (stage === 'qualified' && deal.health === 'healthy' && deal.daysSinceLastActivity <= 7 && i < 2) {
        deal.aiNudge = {
          suggestedStage: 'presentation',
          reason: 'Champion identified and pain points documented. High engagement indicates readiness for presentation.',
          confidence: 70 + Math.floor(Math.random() * 15),
          createdAt: subDays(new Date(), Math.floor(Math.random() * 4) + 1),
          dismissed: false
        };
      }
      
      // Presentation → Proposal (if positive sentiment)
      if (stage === 'presentation' && deal.sentiment === 'positive' && deal.daysSinceLastActivity <= 5 && i === 0) {
        deal.aiNudge = {
          suggestedStage: 'proposal-sent',
          reason: 'Positive engagement after presentation. Stakeholders aligned and excited about the solution.',
          confidence: 72 + Math.floor(Math.random() * 13),
          createdAt: subDays(new Date(), Math.floor(Math.random() * 3) + 1),
          dismissed: false
        };
      }
      
      // Proposal → Negotiation (if high confidence)
      if (stage === 'proposal-sent' && deal.confidence > 65 && i === 0) {
        deal.aiNudge = {
          suggestedStage: 'negotiation-started',
          reason: 'Proposal reviewed positively. Decision makers ready to discuss final terms.',
          confidence: 78 + Math.floor(Math.random() * 12),
          createdAt: subDays(new Date(), Math.floor(Math.random() * 2) + 1),
          dismissed: false
        };
      }

      allDeals.push(deal);
    }
  });
  
  // Add some closed deals
  const closedWon: DealCard = {
    ...generateDealForStage('negotiation-started', 99),
    id: 'deal-won-1',
    status: 'closed-won',
    stage: 'negotiation-started',
    wonDate: subDays(new Date(), 5),
    closeReason: 'Strong champion + compelling ROI',
    owner: 'You',
    notes: 'Final negotiations went smoothly. Key decision maker was very impressed with our solution.',
    nextBestMove: undefined, // Remove next best move for closed deals
  };
  
  const closedLost: DealCard = {
    ...generateDealForStage('presentation', 98),
    id: 'deal-lost-1',
    status: 'closed-lost',
    stage: 'presentation',
    lostDate: subDays(new Date(), 10),
    closeReason: 'Lost to competitor (pricing)',
    notes: 'Pricing was the main issue. Competitor undercut us by 20%. Consider volume discounts next time.',
    nextBestMove: undefined, // Remove next best move for closed deals
  };
  
  allDeals.push(closedWon, closedLost);
  
  return allDeals;
};

export const mockDeals = generateMockDeals();
