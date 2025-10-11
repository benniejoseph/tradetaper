import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';

config();

const getDataSource = async (): Promise<DataSource> => {
  const useCloudSql = process.env.USE_CLOUD_SQL === 'true';

  if (useCloudSql) {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
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
    return new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'Tradetaper2025',
      database: process.env.DB_DATABASE || 'tradetaper',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    });
  }
};

export default getDataSource();
