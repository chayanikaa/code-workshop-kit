import path from 'path';

const findBrowserPath = dir => {
  const absolutePath = require.resolve('code-workshop-kit/dist/components/AppShell.js');

  // Subtract working directory and resolve to root of the @web/dev-server
  const componentPath = path.resolve('/', path.relative(process.cwd(), absolutePath));

  // Relative to the dir folder (usually root, but can be nested somewhere as well) and resolved again
  let relativeComponentPath = path.relative(path.resolve('/', dir), componentPath);

  // Check if the relative component path is bare... this can happen with path.relative
  // Then we just assume we can resolve it to root
  if (!relativeComponentPath.startsWith('.') && !relativeComponentPath.startsWith('/')) {
    relativeComponentPath = path.resolve('/', relativeComponentPath);
  }
  // Normalize for Windows
  const normalizedForWindows = relativeComponentPath.replace(
    new RegExp(path.sep === '\\' ? '\\\\' : path.sep, 'g'),
    '/',
  );

  return normalizedForWindows;
};

export function appShellPlugin(dir, title, target = 'frontend') {
  return {
    transform(context) {
      let rewrittenBody = context.body;
      if (context.status === 200) {
        // subtract the current working dir from absolute dir to get the dir relative to the server root
        const pathRelativeToServer = dir.split(process.cwd())[1];

        // Extra check because the url could be ending with / and then we should be serving /index.html (browser behavior)
        if (
          context.url === `${pathRelativeToServer}/` ||
          context.url === `${pathRelativeToServer}/index.html`
        ) {
          const browserPath = findBrowserPath(pathRelativeToServer);

          const appShellScript = `
            <script type="module">
              import '${browserPath}';
              const cwkAppShell = document.createElement('cwk-app-shell');
              cwkAppShell.title = '${title}';
              cwkAppShell.target = '${target}';
              document.querySelector('body').appendChild(cwkAppShell);
            </script>
          `;

          rewrittenBody = rewrittenBody.replace('</body>', `${appShellScript}</body>`);
        }
      }

      return {
        body: rewrittenBody,
      };
    },
  };
}
