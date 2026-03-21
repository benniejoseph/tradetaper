import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';

config();

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const resolvePoolerUser = (): string | undefined => {
  const candidates = (process.env.DB_USER_CANDIDATES || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return candidates.find((candidate) => candidate.includes('.')) || candidates[0];
};

const getDataSource = async (): Promise<DataSource> => {
  const useCloudSql = process.env.USE_CLOUD_SQL === 'true';

  if (useCloudSql) {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME || '',
      ipType: IpAddressTypes.PRIVATE,
    });

    return new DataSource({
      type: 'postgres',
      database: process.env.DB_NAME || 'tradetaper',
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      extra: {
        stream: clientOpts.stream,
      },
    });
  } else {
    const password = process.env.DB_PASSWORD;
    if (!password) {
      throw new Error('DB_PASSWORD must be configured for CLI data source');
    }

    const usePooler = Boolean(process.env.DB_POOLER_HOST);
    const host = process.env.DB_POOLER_HOST || process.env.DB_HOST || 'localhost';
    const port = usePooler
      ? parsePositiveInt(process.env.DB_POOLER_PORT, 6543)
      : parsePositiveInt(process.env.DB_PORT, 5432);
    const username = usePooler
      ? resolvePoolerUser() ||
        process.env.DB_USER ||
        process.env.DB_USERNAME ||
        'postgres'
      : process.env.DB_USER ||
        process.env.DB_USERNAME ||
        resolvePoolerUser() ||
        'postgres';

    return new DataSource({
      type: 'postgres',
      host,
      port,
      username,
      password,
      database: process.env.DB_DATABASE || 'tradetaper',
      ssl: { rejectUnauthorized: false },
      extra: {
        connectionTimeoutMillis: parsePositiveInt(
          process.env.DB_CONNECTION_TIMEOUT_MS,
          15000,
        ),
        query_timeout: parsePositiveInt(process.env.DB_QUERY_TIMEOUT_MS, 60000),
        statement_timeout: parsePositiveInt(process.env.DB_QUERY_TIMEOUT_MS, 60000),
      },
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    });
  }
};

export default getDataSource();
