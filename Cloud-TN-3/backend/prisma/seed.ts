import { PrismaClient, Role, WorkspaceRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertModelConfig(data: {
  name: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  stopSequences: string[];
  metadata?: any;
  tenantId?: number | null;
  workspaceId?: number | null;
}) {
  const existing = await prisma.aiModelConfig.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.aiModelConfig.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.aiModelConfig.create({ data });
}

async function upsertAgent(data: {
  name: string;
  description?: string | null;
  kind: string;
  enabled?: boolean;
  modelConfigId?: number | null;
  systemPrompt?: string | null;
  tenantId?: number | null;
  workspaceId?: number | null;
}) {
  const existing = await prisma.aiAgent.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.aiAgent.update({ where: { id: existing.id }, data });
  }
  return prisma.aiAgent.create({ data });
}

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL || 'owner@teknav.local';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'teknav' },
    update: {
      legalName: 'Teknav Media Group',
      displayName: 'Teknav',
      primaryDomain: 'teknav.ir',
      defaultLocale: 'fa',
      supportedLocales: ['fa', 'en'],
      plan: 'pro',
    },
    create: {
      slug: 'teknav',
      legalName: 'Teknav Media Group',
      displayName: 'Teknav',
      primaryDomain: 'teknav.ir',
      defaultLocale: 'fa',
      supportedLocales: ['fa', 'en'],
      plan: 'pro',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'teknav-dev' },
    update: {
      name: 'Teknav Dev',
      logo: 'https://teknav.ir/static/logo-teknav.svg',
      primaryLocale: 'fa',
      plan: 'pro',
      tenantId: tenant.id,
    },
    create: {
      name: 'Teknav Dev',
      slug: 'teknav-dev',
      logo: 'https://teknav.ir/static/logo-teknav.svg',
      primaryLocale: 'fa',
      plan: 'pro',
      tenantId: tenant.id,
    },
  });

  const modelDeepseek = await upsertModelConfig({
    name: 'openrouter-deepseek-r1',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1-0528:free',
    temperature: 0.3,
    maxTokens: 4096,
    topP: 1,
    stopSequences: [],
    metadata: {
      usage: 'long-form content, Persian tech analysis',
      tier: 'free',
    },
    tenantId: tenant.id,
    workspaceId: workspace.id,
  });

  const modelGpt = await upsertModelConfig({
    name: 'openrouter-gpt-oss-120b',
    provider: 'openrouter',
    model: 'openai/gpt-oss-120b:free',
    temperature: 0.4,
    maxTokens: 4096,
    topP: 1,
    stopSequences: [],
    metadata: {
      usage: 'editor, SEO, headline generation',
      tier: 'free',
    },
    tenantId: tenant.id,
    workspaceId: workspace.id,
  });

  const agentWriter = await upsertAgent({
    name: 'TEKNAV Writer',
    kind: 'content',
    modelConfigId: modelDeepseek.id,
    systemPrompt:
      'یک نویسنده محتوای تخصصی تکنولوژی برای وب‌سایت Teknav هستی. به فارسی روان، دقیق و بر اساس داده‌های معتبر می‌نویسی، منبع می‌دهی، و سبک تو تحلیلی ولی قابل فهم برای کاربر عادی است. قوانین کلی: عدم جعل، شفافیت در محدودیت‌ها، احترام به قوانین کپی‌رایت، و تمرکز روی امنیت، توسعه نرم‌افزار و اخبار تکنولوژی.',
    tenantId: tenant.id,
    workspaceId: workspace.id,
  });

  const agentEditor = await upsertAgent({
    name: 'TEKNAV Editor',
    kind: 'assistant',
    modelConfigId: modelGpt.id,
    systemPrompt:
      'تو سردبیر و ویراستار ارشد Teknav هستی. متن‌ها را از نظر دقت فنی، خوانایی، سئو (عنوان، توضیحات متا، کی‌ورد اصلی)، و رعایت سبک تحریریه Teknav بررسی و اصلاح می‌کنی. اگر اطلاعات مشکوک یا بدون منبع دیدی، هشدار می‌دهی.',
    tenantId: tenant.id,
    workspaceId: workspace.id,
  });

  const agentSeo = await upsertAgent({
    name: 'TEKNAV SEO Optimizer',
    kind: 'content',
    modelConfigId: modelGpt.id,
    systemPrompt:
      'متخصص سئوی محتوای فارسی هستی. برای هر مقاله عنوان، متا دسکریپشن، کلمات کلیدی، ساختار H1/H2/H3، و پیشنهاد لینک داخلی می‌دهی. تمرکز روی فارسی، بازار ایران، و کلیدواژه‌های مرتبط با تکنولوژی و برنامه‌نویسی.',
    tenantId: tenant.id,
    workspaceId: workspace.id,
  });

  const agentRecommender = await upsertAgent({
    name: 'TEKNAV Recommender',
    kind: 'assistant',
    modelConfigId: modelDeepseek.id,
    systemPrompt:
      'به عنوان موتور پیشنهاد محتوا برای Teknav عمل می‌کنی. با توجه به پروفایل کاربر، تاریخچه خواندن و بردار علاقه‌ها، مقاله‌های مرتبط، موضوعات مشابه و تگ‌های پیشنهادی را برمی‌گردانی.',
    tenantId: tenant.id,
    workspaceId: workspace.id,
  });

  await prisma.webhookEndpoint.upsert({
    where: { id: 1 },
    update: {
      workspaceId: workspace.id,
      url: 'https://teknav.ir/api/webhooks/cms',
      events: ['article.published', 'user.registered', 'order.paid'],
      secret: null,
      status: 'active',
    },
    create: {
      workspaceId: workspace.id,
      url: 'https://teknav.ir/api/webhooks/cms',
      events: ['article.published', 'user.registered', 'order.paid'],
      secret: null,
      status: 'active',
    },
  });

  await prisma.workflowDefinition.upsert({
    where: { key: 'article_auto_review' },
    update: {
      name: 'Article Auto Review',
      description: 'Auto review workflow',
      triggers: { type: 'article_status_change', from: 'DRAFT', to: 'SUBMITTED' },
      steps: {
        steps: [
          { type: 'ai_review', agentId: agentEditor.id },
          { type: 'store_quality_report' },
          { type: 'update_status_if_pass', minScore: 80, newStatus: 'READY_FOR_PUBLISH' },
        ],
      },
      tenantId: tenant.id,
      workspaceId: workspace.id,
      isActive: true,
    },
    create: {
      key: 'article_auto_review',
      name: 'Article Auto Review',
      description: 'Auto review workflow',
      triggers: { type: 'article_status_change', from: 'DRAFT', to: 'SUBMITTED' },
      steps: {
        steps: [
          { type: 'ai_review', agentId: agentEditor.id },
          { type: 'store_quality_report' },
          { type: 'update_status_if_pass', minScore: 80, newStatus: 'READY_FOR_PUBLISH' },
        ],
      },
      tenantId: tenant.id,
      workspaceId: workspace.id,
      isActive: true,
    },
  });

  await prisma.workflowDefinition.upsert({
    where: { key: 'article_auto_publish' },
    update: {
      name: 'Article Auto Publish',
      description: 'Scheduled publishing',
      triggers: { type: 'cron', expression: '*/5 * * * *' },
      steps: { steps: [{ type: 'find_scheduled_articles' }, { type: 'publish_and_notify' }] },
      tenantId: tenant.id,
      workspaceId: workspace.id,
      isActive: true,
    },
    create: {
      key: 'article_auto_publish',
      name: 'Article Auto Publish',
      description: 'Scheduled publishing',
      triggers: { type: 'cron', expression: '*/5 * * * *' },
      steps: { steps: [{ type: 'find_scheduled_articles' }, { type: 'publish_and_notify' }] },
      tenantId: tenant.id,
      workspaceId: workspace.id,
      isActive: true,
    },
  });

  await prisma.workflowDefinition.upsert({
    where: { key: 'user_welcome_flow' },
    update: {
      name: 'User Welcome Flow',
      description: 'Welcome new users',
      triggers: { type: 'user_created' },
      steps: {
        steps: [
          { type: 'create_user_profile', locale: 'fa' },
          { type: 'send_email', template: 'welcome_user' },
        ],
      },
      tenantId: tenant.id,
      workspaceId: workspace.id,
      isActive: true,
    },
    create: {
      key: 'user_welcome_flow',
      name: 'User Welcome Flow',
      description: 'Welcome new users',
      triggers: { type: 'user_created' },
      steps: {
        steps: [
          { type: 'create_user_profile', locale: 'fa' },
          { type: 'send_email', template: 'welcome_user' },
        ],
      },
      tenantId: tenant.id,
      workspaceId: workspace.id,
      isActive: true,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'global-new-ui' },
    update: {
      description: 'Enable new UI',
      type: 'boolean',
      defaultVariant: 'on',
      variants: { on: true, off: false },
      rolloutStrategy: 'all',
      isActive: true,
      workspaceId: workspace.id,
    },
    create: {
      key: 'global-new-ui',
      description: 'Enable new UI',
      type: 'boolean',
      defaultVariant: 'on',
      variants: { on: true, off: false },
      rolloutStrategy: 'all',
      isActive: true,
      workspaceId: workspace.id,
    },
  });

  await prisma.experiment.upsert({
    where: { key: 'homepage-layout-test' },
    update: {
      name: 'Homepage Layout Test',
      status: 'running',
      variants: { control: 'A', test: 'B' },
      trafficAllocation: { control: 50, test: 50 },
      targetAudience: { locale: 'fa' },
      metrics: { click_through: true },
    },
    create: {
      key: 'homepage-layout-test',
      name: 'Homepage Layout Test',
      status: 'running',
      variants: { control: 'A', test: 'B' },
      trafficAllocation: { control: 50, test: 50 },
      targetAudience: { locale: 'fa' },
      metrics: { click_through: true },
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: 'Root Owner',
      role: Role.OWNER,
      password: passwordHash,
      status: 'active',
    },
    create: {
      email: ownerEmail,
      password: passwordHash,
      name: 'Root Owner',
      role: Role.OWNER,
      status: 'active',
    },
  });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: owner.id, workspaceId: workspace.id },
  });
  if (!member) {
    await prisma.workspaceMember.create({
      data: {
        userId: owner.id,
        workspaceId: workspace.id,
        role: WorkspaceRole.OWNER,
        status: 'accepted',
      },
    });
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
