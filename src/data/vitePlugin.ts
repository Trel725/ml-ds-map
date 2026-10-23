import path from 'node:path';
import type { Plugin } from 'vite';
import { buildContent } from './build';
import { formatIssue } from './issues';

const ID = 'virtual:content';
const RESOLVED = `\0${ID}`;

/** Serves the validated content as `virtual:content`; fails the build on content errors. */
export function contentPlugin(opts: { dir: string; strict: boolean }): Plugin {
  const dir = path.resolve(opts.dir);
  return {
    name: 'ml-map-content',
    resolveId(id) {
      return id === ID ? RESOLVED : undefined;
    },
    async load(id) {
      if (id !== RESOLVED) return undefined;
      const { content, issues, ok } = await buildContent(dir, { strict: opts.strict });
      if (!ok) this.error(`Content check failed:\n${issues.map(formatIssue).join('\n')}`);
      for (const i of issues) this.warn(formatIssue(i));
      return `export default ${JSON.stringify(content)};`;
    },
    configureServer(server) {
      server.watcher.add(dir);
      const onChange = (file: string) => {
        if (!file.startsWith(dir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
