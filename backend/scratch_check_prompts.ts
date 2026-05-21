import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const suggestions = await prisma.topicPromptSuggestion.findMany({
    where: { topicId: '8ae4a05c-be58-43da-b93e-8b3f1a6712e1' }
  });
  suggestions.forEach(s => {
    console.log(`Prompt: ${s.promptText}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
