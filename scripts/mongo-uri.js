/**
 * Connection-string helpers shared by the scripts in this directory.
 *
 * The migrations under `apps/todo-be/src/migrations` carry their own copies on
 * purpose — they are compiled TypeScript and must not depend on this folder.
 * Within `scripts/`, though, there is no reason for two versions.
 */

/**
 * Removes anything resembling `user:password@` — or a bare `user@` — from text
 * before it is printed. Driver errors occasionally echo the connection string,
 * and these scripts exist to be run against production by hand.
 */
const redactCredentials = (text) =>
  text.replace(/\/\/[^/@\s]*@/g, '//<redacted>@');

/**
 * Swaps the database name in a connection string, leaving credentials alone.
 * Only the path is replaced — a URI with no path at all (`mongodb://host:27017`)
 * keeps its host, which a "strip from the last slash" rule would eat.
 */
const withDatabase = (uri, database) => {
  const [base, query] = uri.split('?');
  const authority = base.replace(/^([^:]+:\/\/[^/]*)(\/.*)?$/, '$1');
  return `${authority}/${database}${query ? `?${query}` : ''}`;
};

/**
 * Reads `--database <name>` from argv and resolves it against `MONGODB_URI`,
 * exiting with a usage message rather than connecting somewhere unintended.
 */
const resolveTarget = (argv) => {
  const flag = argv.indexOf('--database');
  const value = flag === -1 ? undefined : argv[flag + 1];
  // A following flag is a missing value, not a database called "--verbose".
  const database = value?.startsWith('--') ? undefined : value;
  const baseUri = process.env.MONGODB_URI;

  if (!baseUri) {
    console.error('MONGODB_URI is not set in .env.');
    process.exit(1);
  }

  if (!database) {
    console.error(
      'Pass --database <name>, for example --database todo or --database todo_dev.'
    );
    process.exit(1);
  }

  return { database, uri: withDatabase(baseUri, database) };
};

module.exports = { redactCredentials, withDatabase, resolveTarget };
