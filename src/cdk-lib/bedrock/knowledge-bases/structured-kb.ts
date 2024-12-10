import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

export enum QueryEngineType {
  /** Amazon Redshift as the query engine for querying your data store.  */
  REDSHIFT = 'REDSHIFT',
}

export namespace RedshiftQueryEngine {
  export enum EngineType {
    /**
     * A provisioned type for Redshift query engine.
     */
    PROVISIONED = 'PROVISIONED',
    SERVERLESS = 'SERVERLESS',
  }

  /**
   * The data store used by the Redshift Query Engine
   */
  export enum StorageType {
    AWS_DATA_CATALOG = 'AWS_DATA_CATALOG',
    REDSHIFT = 'REDSHIFT',
  }

  /**
   * The Auth Type used by the Redshift Query Engine
   */
  export enum AuthType {
    /**
     * You authorize with your IAM role.
     */
    IAM = 'IAM',
    /**
     * You specify a database user name.
     */
    USERNAME = 'USERNAME',
    /**
     * You authorize with a AWS Secrets Manager secret that contains your database user and password.
     */
    USERNAME_PASSWORD = 'USERNAME_PASSWORD',
  }

  export class AuthConfiguration {
    public static IAM_ROLE = new AuthConfiguration(AuthType.IAM, undefined, undefined);
    public static fromSecret(secret: ISecret) {
      return new AuthConfiguration(AuthType.USERNAME_PASSWORD, secret, undefined);
    }
    public static fromDatabaseUser(username: string) {
      return new AuthConfiguration(AuthType.USERNAME, undefined, username);
    }
    public readonly authType: AuthType;
    public readonly secret?: ISecret;
    public readonly username?: string;
    private constructor(authType: AuthType, secret?: ISecret, username?: string) {
      this.authType = authType;
      this.secret = secret;
      this.username = username;
    }

    /**
     * Transforms the configuration into CFN format
     * @internal -
     */
    public _render() {
      return {
        authType: this.authType,
        usernamePasswordSecretArn: this.secret?.secretArn,
        databaseUser: this.username,
      };
    }
  }
}
