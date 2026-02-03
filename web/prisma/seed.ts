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

// Real opportunities with verified working URLs
const opportunities = [
  // === ALGORA BOUNTIES (Real GitHub Issues) ===
  {
    title: 'ZIO Schema Migration System - $4,000 Bounty',
    description: 'Build a schema migration system for ZIO Schema 2. This involves creating a robust system to handle schema versioning and data migration between schema versions. Requires deep knowledge of Scala and functional programming patterns.',
    url: 'https://github.com/zio/zio-blocks/issues/519',
    category: 'Open Source Bounty',
    estimatedPay: 4000,
    confidence: 0.95,
  },
  {
    title: 'Golem Cloud MCP Server Integration - $3,500 Bounty',
    description: 'Incorporate MCP (Model Context Protocol) Server into Golem CLI. This task involves integrating the MCP server functionality to enable AI model interactions within the Golem Cloud ecosystem.',
    url: 'https://github.com/golemcloud/golem-cli/issues/275',
    category: 'Open Source Bounty',
    estimatedPay: 3500,
    confidence: 0.93,
  },
  {
    title: 'Durable Text-to-Speech Provider Components - $3,500 Bounty',
    description: 'Implement durable text-to-speech provider components for Golem AI. Create reliable, fault-tolerant TTS integrations that can survive restarts and handle failures gracefully.',
    url: 'https://github.com/golemcloud/golem-ai/issues/23',
    category: 'Open Source Bounty',
    estimatedPay: 3500,
    confidence: 0.91,
  },
  {
    title: 'Twenty CRM IMAP Integration - $2,500 Bounty',
    description: 'Build IMAP email integration for Twenty, a YC S23 open-source CRM. Enable users to sync and manage emails directly within the CRM interface with full IMAP protocol support.',
    url: 'https://algora.io/bounties',
    category: 'Open Source Bounty',
    estimatedPay: 2500,
    confidence: 0.89,
  },
  {
    title: 'Vectorial EM Field Model for Diffractsim - $1,000 Bounty',
    description: 'Implement a vectorial electromagnetic field model for the diffractsim optical simulation library. Requires understanding of wave optics and Python scientific computing.',
    url: 'https://github.com/rafael-fuente/diffractsim/issues/69',
    category: 'Open Source Bounty',
    estimatedPay: 1000,
    confidence: 0.88,
  },
  {
    title: 'Split Mudlet into libmudlet and Qt Frontend - $1,000 Bounty',
    description: 'Refactor Mudlet (a cross-platform MUD client) by splitting it into a reusable library and a Qt-based frontend. This architectural change will enable headless operation and alternative frontends.',
    url: 'https://github.com/Mudlet/Mudlet/issues/8030',
    category: 'Open Source Bounty',
    estimatedPay: 1000,
    confidence: 0.86,
  },

  // === IMMUNEFI BUG BOUNTIES (Crypto Security) ===
  {
    title: 'LayerZero Security Bug Bounty - Up to $15M',
    description: 'Find critical security vulnerabilities in LayerZero protocol. LayerZero is an omnichain interoperability protocol. Critical smart contract bugs affecting user funds can earn up to $15 million.',
    url: 'https://immunefi.com/bug-bounty/',
    category: 'Security Bounty',
    estimatedPay: 15000000,
    confidence: 0.45,
  },
  {
    title: 'Optimism Bug Bounty - Up to $2M',
    description: 'Hunt for vulnerabilities in Optimism, an Ethereum L2 scaling solution. Critical bugs in their OP Stack can earn up to $2 million. Minimum $75,000 for critical smart contract vulnerabilities.',
    url: 'https://immunefi.com/bug-bounty/optimism/information/',
    category: 'Security Bounty',
    estimatedPay: 2000000,
    confidence: 0.52,
  },
  {
    title: 'Yearn Finance Bug Bounty - Up to $200K',
    description: 'Find security issues in Yearn Finance DeFi protocol. Yearn provides yield aggregation on Ethereum. Smart contract vulnerabilities in vaults and strategies can earn substantial rewards.',
    url: 'https://immunefi.com/bug-bounty/yearnfinance',
    category: 'Security Bounty',
    estimatedPay: 200000,
    confidence: 0.58,
  },

  // === USER TESTING & RESEARCH ===
  {
    title: 'UserTesting - Get Paid to Test Websites & Apps',
    description: 'Earn $10 per 20-minute test reviewing websites and mobile apps. Share your screen and speak your thoughts aloud as you navigate. Tests available for desktop and mobile. Payments via PayPal within 14 days.',
    url: 'https://www.usertesting.com/get-paid-to-test',
    category: 'UX Testing',
    estimatedPay: 10,
    confidence: 0.96,
  },
  {
    title: 'Testbirds - Paid App & Software Testing',
    description: 'Join 1M+ testers worldwide finding bugs in apps and websites. Earn €10-50 per usability test, or €1-5 per bug found in functional testing. Complete their Entry Test to start receiving paid projects.',
    url: 'https://nest.testbirds.com/home/tester',
    category: 'QA Testing',
    estimatedPay: 35,
    confidence: 0.91,
  },
  {
    title: 'Respondent - Paid Research Studies ($100+ avg)',
    description: 'Participate in paid research studies, user interviews, and focus groups. Average payout is $100 per study, ranging from $5 to $1000. Studies include product feedback, professional interviews, and market research.',
    url: 'https://www.respondent.io/become-a-participant',
    category: 'Research',
    estimatedPay: 100,
    confidence: 0.89,
  },
  {
    title: 'Prolific - Academic Research Studies',
    description: 'Get paid for academic research studies and surveys. Minimum £6/hr guaranteed, recommended £9-12/hr. Studies include psychology experiments, decision-making tasks, and questionnaires. Cash out at £6 via PayPal.',
    url: 'https://www.prolific.com/participants',
    category: 'Research',
    estimatedPay: 12,
    confidence: 0.97,
  },

  // === AI TRAINING & DATA LABELING ===
  {
    title: 'Scale AI - Data Annotation for AI Training',
    description: 'Label data for cutting-edge AI models including autonomous vehicles, LLMs, and computer vision. Tasks include image annotation, text evaluation, and RLHF. Flexible remote work with training provided.',
    url: 'https://scale.com/careers',
    category: 'AI Training',
    estimatedPay: 20,
    confidence: 0.88,
  },
  {
    title: 'Toloka - Crowdsourced Data Labeling Tasks',
    description: 'Complete microtasks for AI training: image tagging, text classification, content moderation, and data collection. Work on your own schedule from anywhere. Payment per task completed.',
    url: 'https://toloka.ai',
    category: 'Data Labeling',
    estimatedPay: 15,
    confidence: 0.85,
  },
  {
    title: 'Appen - AI Training Data Collection',
    description: 'Contribute to AI development through data collection, annotation, and evaluation projects. Projects include speech recording, image labeling, search relevance, and linguistic tasks. Global opportunities available.',
    url: 'https://appen.com',
    category: 'AI Training',
    estimatedPay: 18,
    confidence: 0.87,
  },
  {
    title: 'Clickworker - Micro Tasks & Data Entry',
    description: 'Complete various micro tasks including text creation, web research, data categorization, and AI training data. Flexible work with tasks taking minutes to hours. Payment via PayPal or bank transfer.',
    url: 'https://www.clickworker.com',
    category: 'Data Entry',
    estimatedPay: 12,
    confidence: 0.92,
  },

  // === FREELANCE PLATFORMS ===
  {
    title: 'Upwork - Data Annotation Specialist Jobs',
    description: 'Find data labeling and annotation contracts on Upwork. Projects include training data for e-commerce AI, autonomous vehicles, and LLM evaluation. Hourly or fixed-price contracts available.',
    url: 'https://www.upwork.com/freelance-jobs/data-annotation/',
    category: 'Data Labeling',
    estimatedPay: 25,
    confidence: 0.90,
  },
  {
    title: 'Gengo - Translation Jobs (40+ Languages)',
    description: 'Translate content for global brands. Gengo offers translation work in 40+ language pairs. Pass their qualification test to start. Pay per word translated, with higher rates for specialized content.',
    url: 'https://gengo.com',
    category: 'Translation',
    estimatedPay: 150,
    confidence: 0.86,
  },
  {
    title: 'Rev - Transcription & Captioning Work',
    description: 'Transcribe audio and video files or create captions. Flexible schedule, work from anywhere. Pay starts at $0.30-1.10 per audio minute for transcription. Weekly payments via PayPal.',
    url: 'https://www.rev.com',
    category: 'Transcription',
    estimatedPay: 20,
    confidence: 0.93,
  },

  // === ADDITIONAL REAL OPPORTUNITIES ===
  {
    title: 'Archestra MCP UI Support - $900 Bounty',
    description: 'Add MCP (Model Context Protocol) UI support to Archestra AI. Implement user interface components for interacting with MCP servers and managing AI model contexts.',
    url: 'https://github.com/archestra-ai/archestra/issues/1301',
    category: 'Open Source Bounty',
    estimatedPay: 900,
    confidence: 0.87,
  },
  {
    title: 'ZIO Scheduler Performance Fix - $850 Bounty',
    description: 'Fix ZScheduler parking/unparking workers too frequently in ZIO. This performance issue affects fiber scheduling efficiency. Requires deep understanding of ZIO runtime internals.',
    url: 'https://github.com/zio/zio/issues/9878',
    category: 'Open Source Bounty',
    estimatedPay: 850,
    confidence: 0.84,
  },
  {
    title: 'GitHub Security Bug Bounty',
    description: 'Find security vulnerabilities in GitHub.com and related services. Critical vulnerabilities can earn up to $30,000+. GitHub rewards exceptional reports above guidelines. Swag included with valid reports.',
    url: 'https://bounty.github.com/',
    category: 'Security Bounty',
    estimatedPay: 30000,
    confidence: 0.62,
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
