import PipelineGenerator from '../src/cicd/pipeline-generator';

const config = {
  projectName: 'freelang-v6-ai-sovereign',
  languages: ['TypeScript', 'JavaScript'],
  deployTargets: ['vercel', 'aws', 'gcp'] as ('vercel' | 'aws' | 'gcp' | 'docker')[],
  slackWebhook: 'https://hooks.slack.com/services/test',
  testFramework: 'jest' as const,
  e2eFramework: 'cypress' as const,
};

const generator = new PipelineGenerator(config);
generator.generateGitHubActions();
console.log('✅ GitHub Actions 워크플로우 생성 완료!');
