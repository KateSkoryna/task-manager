import mongoose from 'mongoose';
import { Todo } from './models/todo.model';
import { Todolist } from './models/todoList.model';
import { UserModel } from './models/user.model';
import {
  redactCredentials,
  runMigration,
  withDatabase,
} from '../migrations/001-agent-fields';

describe('migration 001 — agent fields', () => {
  const uri = () => process.env.MONGODB_URI as string;

  const seedUser = async () =>
    UserModel.create({
      firebaseUid: 'firebase-migration',
      email: 'migration@example.com',
      displayName: 'Migration User',
      firstName: 'Migration',
      lastName: 'User',
    });

  it('backfills userId from the parent list', async () => {
    const user = await seedUser();
    const list = await Todolist.create({ name: 'List', userId: user._id });

    // Bypass the schema so the document looks like one written before the
    // userId field existed.
    const inserted = await mongoose.connection
      .collection('todos')
      .insertOne({ name: 'Legacy', todolistId: list._id, status: 'pending' });

    const report = await runMigration(uri());
    expect(report.todosBackfilledUserId).toBe(1);
    expect(report.todosMissingUserIdUnresolved).toBe(0);

    const migrated = await Todo.findById(inserted.insertedId);
    expect(migrated?.userId?.toString()).toBe(user._id.toString());
  });

  it('reports rather than deletes a todo whose list is gone', async () => {
    const inserted = await mongoose.connection.collection('todos').insertOne({
      name: 'Orphan',
      todolistId: new mongoose.Types.ObjectId(),
      status: 'pending',
    });

    const report = await runMigration(uri());
    expect(report.todosMissingUserIdUnresolved).toBe(1);
    expect(report.todosBackfilledUserId).toBe(0);

    // Still present: deleting user data is a decision, not a migration step.
    const survivor = await mongoose.connection
      .collection('todos')
      .findOne({ _id: inserted.insertedId });
    expect(survivor).not.toBeNull();
  });

  it('applies priority and source defaults', async () => {
    const user = await seedUser();
    const inserted = await mongoose.connection
      .collection('todos')
      .insertOne({ name: 'Bare', todolistId: null, userId: user._id });

    await runMigration(uri());

    const migrated = await mongoose.connection
      .collection('todos')
      .findOne({ _id: inserted.insertedId });
    expect(migrated?.priority).toBe('medium');
    expect(migrated?.source).toBe('web');
  });

  it('gives existing users default preferences', async () => {
    const user = await seedUser();

    await runMigration(uri());

    const migrated = await mongoose.connection
      .collection('users')
      .findOne({ _id: user._id });
    expect(migrated?.preferences).toMatchObject({
      timezone: 'UTC',
      reportCadence: 'off',
      aiConsent: false,
    });
  });

  it('is a no-op on a second run', async () => {
    const user = await seedUser();
    const list = await Todolist.create({ name: 'List', userId: user._id });
    await mongoose.connection
      .collection('todos')
      .insertOne({ name: 'Legacy', todolistId: list._id, status: 'pending' });

    const first = await runMigration(uri());
    const second = await runMigration(uri());

    expect(first.todosBackfilledUserId).toBe(1);
    expect(second).toMatchObject({
      todosBackfilledUserId: 0,
      todosGivenPriority: 0,
      todosGivenSource: 0,
      usersGivenPreferences: 0,
    });
  });

  it('writes nothing in dry-run mode', async () => {
    const user = await seedUser();
    const list = await Todolist.create({ name: 'List', userId: user._id });
    const inserted = await mongoose.connection
      .collection('todos')
      .insertOne({ name: 'Legacy', todolistId: list._id, status: 'pending' });

    const report = await runMigration(uri(), true);
    expect(report.dryRun).toBe(true);
    expect(report.todosBackfilledUserId).toBe(1);

    const untouched = await mongoose.connection
      .collection('todos')
      .findOne({ _id: inserted.insertedId });
    expect(untouched?.userId).toBeUndefined();
  });
});

/**
 * Builds a connection string from obviously-synthetic parts. Hosts use
 * `example.invalid`, which IANA reserves so it can never resolve, and the
 * credentials are self-describing placeholders. Earlier fixtures here used
 * realistic-looking name/password pairs and tripped GitHub secret scanning on
 * a public repository — a false positive, but a recurring one.
 */
const withCredentials = (
  scheme: 'mongodb' | 'mongodb+srv',
  credentials: string,
  address: string
) => `${scheme}://${credentials}@${address}`;

const PLACEHOLDER_CREDENTIALS = 'placeholder-user:placeholder-value';

describe('withDatabase', () => {
  it('swaps the database while preserving credentials and options', () => {
    const developmentUri = withCredentials(
      'mongodb+srv',
      PLACEHOLDER_CREDENTIALS,
      'cluster.example.invalid/todo_dev?appName=X'
    );
    const productionUri = withCredentials(
      'mongodb+srv',
      PLACEHOLDER_CREDENTIALS,
      'cluster.example.invalid/todo?appName=X'
    );

    expect(withDatabase(developmentUri, 'todo')).toBe(productionUri);
  });

  it('handles a URI with no query string', () => {
    const developmentUri = withCredentials(
      'mongodb',
      PLACEHOLDER_CREDENTIALS,
      'localhost:27017/todo_dev'
    );
    const productionUri = withCredentials(
      'mongodb',
      PLACEHOLDER_CREDENTIALS,
      'localhost:27017/todo'
    );

    expect(withDatabase(developmentUri, 'todo')).toBe(productionUri);
  });

  it('does not corrupt a password containing a slash-free special character', () => {
    const developmentUri = withCredentials(
      'mongodb+srv',
      'placeholder-user:p%40ss-word',
      'cluster.example.invalid/todo_dev?w=1'
    );

    const result = withDatabase(developmentUri, 'todo');
    expect(result).toContain('placeholder-user:p%40ss-word@');
    expect(result).toContain('/todo?w=1');
  });

  it('keeps the host when the URI has no database path', () => {
    expect(withDatabase('mongodb://localhost:27017', 'todo')).toBe(
      'mongodb://localhost:27017/todo'
    );
  });

  it('keeps credentials when the URI has no database path', () => {
    const uri = withCredentials(
      'mongodb+srv',
      PLACEHOLDER_CREDENTIALS,
      'cluster.example.invalid'
    );
    expect(withDatabase(uri, 'todo')).toBe(
      `mongodb+srv://${PLACEHOLDER_CREDENTIALS}@cluster.example.invalid/todo`
    );
  });
});

describe('redactCredentials', () => {
  it('removes user and password from a connection string', () => {
    const uri = withCredentials(
      'mongodb+srv',
      PLACEHOLDER_CREDENTIALS,
      'cluster.example.invalid/todo'
    );

    expect(redactCredentials(`failed to connect to ${uri}`)).toBe(
      'failed to connect to mongodb+srv://<redacted>@cluster.example.invalid/todo'
    );
  });

  it('leaves a credential-free string untouched', () => {
    const text = 'querySrv EBADNAME _mongodb._tcp.cluster.example.invalid';
    expect(redactCredentials(text)).toBe(text);
  });

  it('redacts a username with no password', () => {
    expect(
      redactCredentials('mongodb://placeholder-user@one.example.invalid/todo')
    ).toBe('mongodb://<redacted>@one.example.invalid/todo');
  });

  it('redacts every occurrence', () => {
    const firstUri = withCredentials(
      'mongodb',
      'placeholder-a:placeholder-b',
      'one.example.invalid'
    );
    const secondUri = withCredentials(
      'mongodb',
      'placeholder-c:placeholder-d',
      'two.example.invalid'
    );
    const result = redactCredentials(`${firstUri} and ${secondUri}`);
    expect(result).not.toContain('placeholder-a:placeholder-b@');
    expect(result).not.toContain('placeholder-c:placeholder-d@');
  });
});
