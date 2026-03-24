export interface DbConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  dialect: 'mariadb' | 'mysql';
}

export interface EnvConfig {
  development: DbConfig;
  test: DbConfig;
  production: DbConfig;
}