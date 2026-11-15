import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// H-55: el layout ya declara el único <main>; las páginas no deben anidar otro.
describe('landmark <main>', () => {
  const collect = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return collect(path);
      return path.endsWith('.page.html') ? [path] : [];
    });

  it.each(collect(join(__dirname, '../../../features')).map((p) => [p.split('features/')[1], p]))(
    '%s no declara <main>',
    (_name, path) => {
      expect(readFileSync(path, 'utf8')).not.toMatch(/<main[\s>]/);
    },
  );
});
