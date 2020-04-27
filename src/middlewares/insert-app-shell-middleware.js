import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

const findBrowserPath = appIndex => {
  const absolutePath = require.resolve('code-workshop-kit/components/AppShell.js');

  // Subtract working directory and resolve to root of the es-dev-server
  const componentPath = path.resolve('/', path.relative(process.cwd(), absolutePath));

  // Relative to the appIndex folder (usually root, but can be nested somewhere as well)
  const relativeComponentPath = path.relative(
    path.resolve('/', path.dirname(appIndex)),
    componentPath
  );

  // Normalize for Windows
  const normalizedForWindows = relativeComponentPath.replace(
    new RegExp(path.sep === '\\' ? '\\\\' : path.sep, 'g'),
    '/'
  );

  return normalizedForWindows;
};

export function createInsertAppShellMiddleware(appIndex, cwkShell = false) {
  return async function insertAppShellMiddleware(ctx, next) {
    await next();

    if (cwkShell) {
      const pathRelativeToServer = path.resolve('/', appIndex);

      // Extra check because the url could be ending with / and then we should be serving /index.html
      if (ctx.url === pathRelativeToServer || `${ctx.url}index.html` === pathRelativeToServer) {
        const browserPath = findBrowserPath(appIndex);

        const appShellScript = `
          <script type="module">
            import '${browserPath}';
            document.querySelector('body').appendChild(document.createElement('cwk-app-shell'));
          </script>
        `;

        ctx.body = ctx.body.replace('</body>', `${appShellScript}</body>`);
      }
    }
  };
}
