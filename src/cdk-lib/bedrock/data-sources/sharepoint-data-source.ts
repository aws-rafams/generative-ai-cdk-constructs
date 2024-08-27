import * as s3 from 'aws-cdk-lib/aws-s3';
import { DataDeletionPolicy, DataSourceAssociationProps, DataSourceNew, DataSourceType } from './base-data-source';
import { CfnDataSource } from 'aws-cdk-lib/aws-bedrock';
import { KnowledgeBase } from '@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock';
import { Construct } from 'constructs';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { NagSuppressions } from 'cdk-nag';
import { generatePhysicalNameV2 } from '@cdklabs/generative-ai-cdk-constructs/lib/common/helpers/utils';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

export enum SharepointDataSourceAuthType {
  OAUTH2_CLIENT_CREDENTIALS = 'OAUTH2_CLIENT_CREDENTIALS'
}

export enum SharepointObjectType {
  PAGE = 'Page',
  EVENT = 'Event',
  FILE = 'File',
}

export interface SharepointCrawlingFilters {
  /**
   * Include object types.
   */
  readonly objectType: SharepointObjectType;
  /**
   * Include patterns.
   */
  readonly includePatterns?: string[];
  /**
   * Exclude paths.
   */
  readonly excludePatterns?: string[];
}

/**
 * Interface to add a new data source to an existing KB
 */
export interface SharepointDataSourceAssociationProps extends DataSourceAssociationProps {
  /**
   * The domain of your SharePoint instance or site URL/URLs.
   */
  readonly domain: string;
  /**
   * The SharePoint site URL/URLs.
   * Must start with “https”. All URLs must start with same protocol.
   * @example ["https://yourdomain.sharepoint.com/sites/mysite"]
   */
  readonly siteUrls: string[];
  /**
   * The identifier of your Microsoft 365 tenant.
   * @example "d1c035a6-1dcf-457d-97e3"
   */
  readonly tenantId: string;
  /**
   * The AWS Secrets Manager secret that stores your authentication credentials 
   * for your Sharepoint instance URL. Secret must start with "AmazonBedrock-".
   */
  readonly authSecret: ISecret;
  /**
   * The filters (regular expression patterns) for the crawling. 
   * If there's a conflict, the exclude pattern takes precedence.
   * @default None - all your content is crawled.
   */
  readonly filters?: SharepointCrawlingFilters[];

}

/**
 * Interface to create a new standalone data source object
 */
export interface SharepointDataSourceProps extends SharepointDataSourceAssociationProps {
  /**
   * The knowledge base to associate with the data source.
   */
  readonly knowledgeBase: KnowledgeBase;
}

/**
 * Sets up an data source to be added to a knowledge base.
 */
export class SharepointDataSource extends DataSourceNew {
  /**
   * The unique identifier of the data source.
   * @example 'JHUEVXUZMU'
   */
  public readonly dataSourceId: string;
  /**
   * The type of data source.
   */
  public readonly dataSourceType: DataSourceType;
  /**
   * The name of the data source.
   */
  public readonly name: string;
  /**
   * The name of the data source.
   * @deprecated Use `name` instead.
   */
  public readonly dataSourceName: string;
  /**
   * The knowledge base associated with the data source.
   */
  public readonly knowledgeBase: KnowledgeBase;
  /**
   * The Sharepoint host URL or instance URL.
   */
  public readonly endpoint: string;
  /**
   * The AWS Secrets Manager secret that stores your authentication credentials.
   */
  public readonly authSecret: ISecret;
  /**
   * The SharePoint site URL/URLs.
   * Must start with “https”. All URLs must start with same protocol.
   */
  public readonly siteUrls: string[];
  /**
   * The KMS key to use to encrypt the data source.
   */
  public readonly kmsKey?: IKey;
  /**
   * The Data Source cfn resource.
   */
  private readonly __resource: CfnDataSource;


  constructor(scope: Construct, id: string, props: SharepointDataSourceProps) {
    super(scope, id);
    // Assign attributes
    this.knowledgeBase = props.knowledgeBase;
    this.dataSourceType = DataSourceType.SHAREPOINT;
    this.name = props.name ?? generatePhysicalNameV2(this, 'sfdc-datasource', { maxLength: 40, lower: true, separator: '-' });;
    this.dataSourceName = this.name;
    this.siteUrls = props.siteUrls;
    this.authSecret = props.authSecret;
    this.kmsKey = props.kmsKey;

    // L1 instantiation
    this.__resource = new CfnDataSource(this, 'DataSource', {
      knowledgeBaseId: this.knowledgeBase.knowledgeBaseId,
      name: this.name,
      dataDeletionPolicy: props.dataDeletionPolicy ?? DataDeletionPolicy.DELETE,
      dataSourceConfiguration: {
        type: this.dataSourceType,
        sharePointConfiguration: {
          sourceConfiguration: {
            authType: SharepointDataSourceAuthType.OAUTH2_CLIENT_CREDENTIALS,
            credentialsSecretArn: this.authSecret.secretArn,
            hostType: "ONLINE",
            domain: props.domain,
            siteUrls: this.siteUrls,
          },
          crawlerConfiguration:
            (props.filters) ? ({
              filterConfiguration: {
                type: "PATTERN",
                patternObjectFilter: {
                  filters: props.filters?.map(item => ({
                    objectType: item.objectType,
                    inclusionFilters: item.includePatterns,
                    exclusionFilters: item.excludePatterns
                  }))
                }
              }
            }) : undefined
        },
      },
      vectorIngestionConfiguration: props.vectorIngestionConfigurationProperty,
      serverSideEncryptionConfiguration: this.kmsKey ? {
        kmsKeyArn: this.kmsKey.keyArn,
      } : undefined,

    });

    this.dataSourceId = this.__resource.attrDataSourceId;


  }
}