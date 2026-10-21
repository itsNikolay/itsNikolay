// npm run new -- owner/name [slug]: starts cards/<slug>/card.json for a project (slug defaults to the repository name).
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { newCard } from './card.ts';

const [repository, slugArg] = process.argv.slice(2);
if (!repository) throw new Error('Usage: npm run new -- owner/name [slug]');
const card = newCard(repository);
const slug = slugArg ?? repository.split('/')[1]!.toLowerCase();
const dir = join(new URL('..', import.meta.url).pathname, 'cards', slug);
if (await access(join(dir, 'card.json')).then(() => true, () => false)) throw new Error(`cards/${slug}/card.json already exists`);
await mkdir(dir, { recursive: true });
await writeFile(join(dir, 'card.json'), JSON.stringify({ $schema: '../../schema/card.schema.json', ...card }, null, '\t') + '\n');
console.log(`Created cards/${slug}/card.json

Next:
  1. Write the headline, sub and icons (SIGNATURE.md has the rules and a prompt for Claude).
  2. Save a screenshot as cards/${slug}/art.png, about 750 × 600 px.
  3. npm run render -- ${slug}`);
