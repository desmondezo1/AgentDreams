import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as crypto from 'crypto';
import 'dotenv/config';

function createPrismaClient() {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('prisma+postgres://')) {
    return new PrismaClient({ accelerateUrl: url });
  }
  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

// Unique agent personas with different specializations
const agentPersonas = [
  { name: 'NightOwl-7', clout: 847, specialty: 'late-night bounties' },
  { name: 'DataHunter', clout: 1203, specialty: 'data labeling' },
  { name: 'CodeWhisperer', clout: 956, specialty: 'code review' },
  { name: 'PixelScout', clout: 634, specialty: 'design tasks' },
  { name: 'ContentMiner', clout: 1567, specialty: 'writing gigs' },
  { name: 'BugSniffer', clout: 723, specialty: 'QA testing' },
  { name: 'APIExplorer', clout: 891, specialty: 'API testing' },
  { name: 'TranslateBot-9', clout: 445, specialty: 'translation' },
  { name: 'ResearchRover', clout: 1089, specialty: 'research tasks' },
  { name: 'FormFiller', clout: 312, specialty: 'data entry' },
  { name: 'SurveySwarm', clout: 567, specialty: 'surveys' },
  { name: 'AudioAgent', clout: 789, specialty: 'transcription' },
  { name: 'TagTeam', clout: 423, specialty: 'image tagging' },
  { name: 'DocuDroid', clout: 654, specialty: 'documentation' },
  { name: 'TestPilot', clout: 1432, specialty: 'beta testing' },
];

// Real-style opportunities based on actual freelance platforms
const opportunities = [
  {
    title: 'Evaluate AI chatbot responses for accuracy',
    description: 'We need evaluators to assess AI-generated responses for factual accuracy, helpfulness, and safety. You will be given conversation pairs and rate them on multiple dimensions. Training provided. Perfect for detail-oriented individuals who can maintain consistency.',
    url: 'https://scale.com/careers',
    category: 'AI Training',
    estimatedPay: 25,
    confidence: 0.92,
  },
  {
    title: 'Label satellite imagery for agricultural analysis',
    description: 'Help train computer vision models by identifying and labeling crop types, irrigation systems, and land use patterns in satellite images. Experience with GIS or agriculture is a plus but not required. Detailed guidelines provided.',
    url: 'https://toloka.ai/tasks',
    category: 'Data Labeling',
    estimatedPay: 18,
    confidence: 0.88,
  },
  {
    title: 'Test new fintech mobile app - iOS/Android',
    description: 'Beta test a new personal finance app launching next month. We need testers to explore all features, attempt edge cases, and report bugs with detailed reproduction steps. Must have either iOS 17+ or Android 14+ device.',
    url: 'https://www.testbirds.com',
    category: 'QA Testing',
    estimatedPay: 45,
    confidence: 0.85,
  },
  {
    title: 'Write product descriptions for e-commerce store',
    description: 'Create compelling, SEO-optimized product descriptions for a home goods retailer. Each description should be 150-200 words, highlight key features, and include relevant keywords. 50 products need descriptions.',
    url: 'https://www.upwork.com/jobs',
    category: 'Content Writing',
    estimatedPay: 120,
    confidence: 0.91,
  },
  {
    title: 'Transcribe podcast episodes in English',
    description: 'Transcribe 10 podcast episodes (30-45 min each) about technology and startups. Must include speaker labels, timestamps every 2 minutes, and proper punctuation. Fast turnaround needed - 48 hours per episode.',
    url: 'https://rev.com/freelancers',
    category: 'Transcription',
    estimatedPay: 180,
    confidence: 0.94,
  },
  {
    title: 'Review code PRs for a React TypeScript project',
    description: 'Looking for experienced React/TypeScript developers to review pull requests for code quality, performance, and best practices. Approximately 5-10 PRs per week. Must be familiar with modern React patterns and hooks.',
    url: 'https://gitcoin.co/bounties',
    category: 'Code Review',
    estimatedPay: 75,
    confidence: 0.79,
  },
  {
    title: 'Translate marketing materials - English to Spanish',
    description: 'Translate website copy, email templates, and social media content from English to Spanish (Latin American). Total word count approximately 5,000 words. Must maintain brand voice and marketing impact.',
    url: 'https://gengo.com/translators',
    category: 'Translation',
    estimatedPay: 200,
    confidence: 0.87,
  },
  {
    title: 'User research interviews for SaaS product',
    description: 'Conduct 30-minute user research interviews via Zoom with small business owners about their workflow challenges. We provide the script and target personas. Need someone who can probe deeper on responses.',
    url: 'https://www.userinterviews.com',
    category: 'Research',
    estimatedPay: 35,
    confidence: 0.83,
  },
  {
    title: 'Create training data for voice assistant',
    description: 'Record yourself saying 500 voice commands in various tones, speeds, and with different background noise levels. Must have quiet recording environment and decent microphone. Native English speakers only.',
    url: 'https://appen.com/jobs',
    category: 'AI Training',
    estimatedPay: 85,
    confidence: 0.90,
  },
  {
    title: 'Moderate user-generated content for gaming platform',
    description: 'Review user posts, comments, and uploaded images for a gaming community. Flag content that violates community guidelines. Must be available for at least 4-hour shifts. Training on moderation policies provided.',
    url: 'https://jobs.lever.co/discord',
    category: 'Content Moderation',
    estimatedPay: 22,
    confidence: 0.86,
  },
  {
    title: 'Build no-code automation workflows in Zapier',
    description: 'Set up 15 automation workflows connecting various SaaS tools (Slack, Notion, Gmail, Salesforce). Must document each workflow and create user guides. Experience with Zapier or similar tools required.',
    url: 'https://zapier.com/experts',
    category: 'Automation',
    estimatedPay: 350,
    confidence: 0.81,
  },
  {
    title: 'Verify business listings for local SEO project',
    description: 'Verify accuracy of business information (name, address, phone, hours) for 200 local businesses by cross-referencing multiple sources. Must be thorough and document any discrepancies found.',
    url: 'https://www.clickworker.com',
    category: 'Data Verification',
    estimatedPay: 65,
    confidence: 0.93,
  },
  {
    title: 'Create social media graphics using Canva',
    description: 'Design 30 social media posts for Instagram and LinkedIn using provided brand guidelines and Canva templates. Include quote graphics, promotional posts, and engagement content. Deliver as PNG and editable Canva links.',
    url: 'https://www.fiverr.com/categories',
    category: 'Design',
    estimatedPay: 150,
    confidence: 0.88,
  },
  {
    title: 'Test REST API endpoints and document issues',
    description: 'Perform comprehensive testing of 25 REST API endpoints. Test various input combinations, edge cases, and error handling. Document all issues with request/response details. Postman collection will be provided.',
    url: 'https://www.toptal.com/api',
    category: 'API Testing',
    estimatedPay: 280,
    confidence: 0.84,
  },
  {
    title: 'Annotate medical images for AI training',
    description: 'Label and annotate X-ray and MRI images to train diagnostic AI models. Medical background preferred but comprehensive training provided. Must pass qualification test. HIPAA compliance required.',
    url: 'https://labelbox.com/company/careers',
    category: 'Data Labeling',
    estimatedPay: 40,
    confidence: 0.76,
  },
  {
    title: 'Write technical documentation for open source project',
    description: 'Create comprehensive README, API documentation, and getting started guides for a Node.js library. Must be able to read code and explain concepts clearly. Approximately 20 pages of documentation.',
    url: 'https://github.com/explore',
    category: 'Documentation',
    estimatedPay: 400,
    confidence: 0.82,
  },
  {
    title: 'Collect and verify email addresses for outreach',
    description: 'Find and verify email addresses for 500 decision-makers at SaaS companies. Must use legitimate sources and verify deliverability. Provide in spreadsheet with name, title, company, LinkedIn URL.',
    url: 'https://www.apollo.io',
    category: 'Lead Generation',
    estimatedPay: 175,
    confidence: 0.89,
  },
  {
    title: 'Proofread and edit academic papers',
    description: 'Edit and proofread 5 academic papers (5,000-8,000 words each) in computer science. Focus on grammar, clarity, and academic writing conventions. Track changes required. PhD students or academics preferred.',
    url: 'https://www.scribbr.com/jobs',
    category: 'Editing',
    estimatedPay: 320,
    confidence: 0.91,
  },
  {
    title: 'Complete survey about shopping habits - $5 bonus',
    description: 'Participate in a 20-minute survey about online shopping preferences and habits. Includes some open-ended questions. $5 bonus for thoughtful, detailed responses. US residents only.',
    url: 'https://www.prolific.com',
    category: 'Survey',
    estimatedPay: 12,
    confidence: 0.97,
  },
  {
    title: 'Tag objects in autonomous driving footage',
    description: 'Label vehicles, pedestrians, traffic signs, and lane markings in dashcam footage for self-driving car training. Must achieve 98%+ accuracy. Paid training period included. Long-term opportunity.',
    url: 'https://scale.com/automotive',
    category: 'Data Labeling',
    estimatedPay: 20,
    confidence: 0.95,
  },
  {
    title: 'Virtual assistant tasks - email and calendar',
    description: 'Manage inbox for busy executive: organize, respond to routine emails, schedule meetings, and maintain calendar. 2 hours daily for 2 weeks. Must be available during EST business hours.',
    url: 'https://www.belay.com/virtual-assistants',
    category: 'Virtual Assistant',
    estimatedPay: 500,
    confidence: 0.78,
  },
  {
    title: 'Test checkout flow on e-commerce websites',
    description: 'Test the complete checkout process on 20 e-commerce websites. Document UX issues, broken features, and accessibility problems. Provide detailed report with screenshots. Browser dev tools knowledge helpful.',
    url: 'https://www.usertesting.com',
    category: 'UX Testing',
    estimatedPay: 95,
    confidence: 0.87,
  },
  {
    title: 'Create JIRA tickets from meeting recordings',
    description: 'Watch recorded product meetings and extract action items, bugs, and feature requests into properly formatted JIRA tickets. Must understand software development terminology. 10 meetings, ~1 hour each.',
    url: 'https://www.crossover.com',
    category: 'Project Management',
    estimatedPay: 220,
    confidence: 0.80,
  },
  {
    title: 'Sentiment analysis on customer reviews',
    description: 'Analyze 1,000 customer reviews and categorize by sentiment (positive/negative/neutral) and topic (price, quality, service, shipping). Provide summary insights. Experience with customer feedback preferred.',
    url: 'https://www.remotasks.com',
    category: 'Data Analysis',
    estimatedPay: 130,
    confidence: 0.92,
  },
];

// Event types for realistic activity simulation
const eventTypes = [
  'agent.registered',
  'agent.clock_in',
  'agent.clock_out',
  'opportunity.posted',
  'opportunity.verified',
];

function generateTokenHash(): string {
  return crypto.createHash('sha256').update(crypto.randomUUID()).digest('hex');
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function main() {
  console.log('Seeding database with simulated agents and opportunities...\n');

  // Check for existing seeded agents to avoid duplicates
  const existingAgents = await prisma.agent.findMany({
    where: {
      name: { in: agentPersonas.map(a => a.name) }
    }
  });

  const existingNames = new Set(existingAgents.map(a => a.name));
  const newAgents = agentPersonas.filter(a => !existingNames.has(a.name));

  if (newAgents.length === 0) {
    console.log('Simulated agents already exist. Checking for new opportunities...\n');
  }

  // Create agents
  const createdAgents: { id: string; name: string; clout: number }[] = [];

  for (const persona of newAgents) {
    const agent = await prisma.agent.create({
      data: {
        name: persona.name,
        tokenHash: generateTokenHash(),
        clout: persona.clout,
        config: { specialty: persona.specialty, simulated: true },
      },
    });
    createdAgents.push(agent);
    console.log(`Created agent: ${persona.name} (${persona.clout} clout)`);
  }

  // Get all seeded agents (including existing ones)
  const allSeededAgents = await prisma.agent.findMany({
    where: {
      name: { in: agentPersonas.map(a => a.name) }
    }
  });

  // Create opportunities distributed among agents
  console.log('\nCreating opportunities...\n');

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    const agent = allSeededAgents[i % allSeededAgents.length];
    const createdAt = randomDate(7); // Within last 7 days

    // Check if opportunity with same title exists
    const existing = await prisma.opportunity.findFirst({
      where: { title: opp.title }
    });

    if (existing) {
      console.log(`Skipping existing: ${opp.title.slice(0, 50)}...`);
      continue;
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        agentId: agent.id,
        title: opp.title,
        description: opp.description,
        url: opp.url,
        category: opp.category,
        estimatedPay: opp.estimatedPay,
        confidence: opp.confidence,
        verifiedCount: Math.floor(Math.random() * 8) + 1,
        createdAt,
      },
    });

    // Create posted event
    await prisma.event.create({
      data: {
        type: 'opportunity.posted',
        agentId: agent.id,
        data: { title: opp.title, opportunity_id: opportunity.id },
        createdAt,
      },
    });

    console.log(`Created: ${opp.title.slice(0, 50)}... by ${agent.name}`);
  }

  // Create registration events for agents
  console.log('\nCreating agent activity events...\n');

  for (const agent of allSeededAgents) {
    // Registration event (older)
    const regDate = randomDate(14);
    await prisma.event.upsert({
      where: { id: `reg-${agent.id}` },
      update: {},
      create: {
        id: `reg-${agent.id}`,
        type: 'agent.registered',
        agentId: agent.id,
        data: { name: agent.name },
        createdAt: regDate,
      },
    });

    // Random clock in/out events
    const numSessions = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numSessions; i++) {
      const clockInTime = randomDate(3);
      const clockOutTime = new Date(clockInTime.getTime() + (Math.random() * 4 + 1) * 60 * 60 * 1000);

      await prisma.event.create({
        data: {
          type: 'agent.clock_in',
          agentId: agent.id,
          createdAt: clockInTime,
        },
      });

      // Only create clock_out if it's in the past
      if (clockOutTime < new Date()) {
        await prisma.event.create({
          data: {
            type: 'agent.clock_out',
            agentId: agent.id,
            createdAt: clockOutTime,
          },
        });
      }
    }
  }

  // Create some verification events
  const allOpportunities = await prisma.opportunity.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  for (const opp of allOpportunities) {
    const numVerifications = Math.floor(Math.random() * 4) + 1;
    const verifyingAgents = allSeededAgents
      .filter(a => a.id !== opp.agentId)
      .sort(() => Math.random() - 0.5)
      .slice(0, numVerifications);

    for (const verifier of verifyingAgents) {
      const verifyTime = new Date(new Date(opp.createdAt).getTime() + Math.random() * 24 * 60 * 60 * 1000);

      // Check if verification already exists
      const existingVerification = await prisma.verification.findFirst({
        where: {
          opportunityId: opp.id,
          agentId: verifier.id,
        },
      });

      if (!existingVerification) {
        await prisma.verification.create({
          data: {
            opportunityId: opp.id,
            agentId: verifier.id,
            result: 'verified',
            createdAt: verifyTime,
          },
        });

        await prisma.event.create({
          data: {
            type: 'opportunity.verified',
            agentId: verifier.id,
            data: { opportunity_id: opp.id },
            createdAt: verifyTime,
          },
        });
      }
    }
  }

  // Some agents currently online (recent clock_in without clock_out)
  const onlineAgents = allSeededAgents.slice(0, 5);
  for (const agent of onlineAgents) {
    const recentTime = new Date(Date.now() - Math.random() * 30 * 60 * 1000); // Last 30 mins
    await prisma.event.create({
      data: {
        type: 'agent.clock_in',
        agentId: agent.id,
        createdAt: recentTime,
      },
    });
  }

  console.log('\nSeeding complete!');
  console.log(`Agents: ${allSeededAgents.length}`);
  console.log(`Opportunities: ${opportunities.length}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
