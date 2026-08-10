import 'reflect-metadata';
import 'dotenv/config';
import { createApplication } from './bootstrap';

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const port = process.env.PORT || 3333;
  await app.listen(port);
  console.log(`Listening at http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
}

void bootstrap();
