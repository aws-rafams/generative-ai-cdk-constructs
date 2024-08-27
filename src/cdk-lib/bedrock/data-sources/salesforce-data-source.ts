import * as s3 from 'aws-cdk-lib/aws-s3';
import { DataDeletionPolicy, DataSourceNew, DataSourceAssociationProps, DataSourceType } from './base-data-source';
import { CfnDataSource } from 'aws-cdk-lib/aws-bedrock';
import { KnowledgeBase } from '@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock';
import { Construct } from 'constructs';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { NagSuppressions } from 'cdk-nag';
import { generatePhysicalNameV2 } from '@cdklabs/generative-ai-cdk-constructs/lib/common/helpers/utils';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

export enum SalesforceDataSourceAuthType {
  OAUTH2_CLIENT_CREDENTIALS = 'OAUTH2_CLIENT_CREDENTIALS'
}

export enum SalesforceObjectType {
  ACCOUNT = 'Account',
  ATTACHMENT = 'Attachment',
  CAMPAIGN = 'Campaign',
  CONTENT_VERSION = 'ContentVersion',
  PARTNER = 'Partner',
  PRICEBOOK_2 = 'Pricebook2',
  CASE = 'Case',
  CONTACT = 'Contact',
  CONTRACT = 'Contract',
  DOCUMENT = 'Document',
  IDEA = 'Idea',
  LEAD = 'Lead',
  OPPORTUNITY = 'Opportunity',
  PRODUCT_2 = 'Product2',
  SOLUTION = 'Solution',
  TASK = 'Task',
  FEED_ITEM = 'FeedItem',
  FEED_COMMENT = 'FeedComment',
  KNOWLEDGE_KAV = 'Knowledge__kav',
  USER = 'User',
  COLLABORATION_GROUP = 'CollaborationGroup'
}

export interface SalesforceCrawlingFilters {
  /**
   * Include object types.
   */
  readonly objectType: SalesforceObjectType;
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
 * Interface to add a new data source to an existing KB.
 */
export interface SalesforceDataSourceAssociationProps extends DataSourceAssociationProps {
  /**
   * The Salesforce host URL or instance URL.
   * @example https://your-instance.my.salesforce.com
   */
  readonly endpoint: string;
  /**
   * The AWS Secrets Manager secret that stores your authentication credentials 
   * for your Salesforce instance URL. Secret must start with "AmazonBedrock-".
   */
  readonly authSecret: ISecret;
  /**
   * The filters (regular expression patterns) for the crawling. 
   * If there's a conflict, the exclude pattern takes precedence.
   * @default None - all your content is crawled.
   */
  readonly filters?: SalesforceCrawlingFilters[];

}

/**
 * Interface to create a new standalone data source object.
 */
export interface SalesforceDataSourceProps extends SalesforceDataSourceAssociationProps {
  /**
   * The knowledge base to associate with the data source.
   */
  readonly knowledgeBase: KnowledgeBase;
}

/**
 * Sets up an data source to be added to a knowledge base.
 */
export class SalesforceDataSource extends DataSourceNew {
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
   * The Salesforce host URL or instance URL.
   */
  public readonly endpoint: string;
  /**
   * The AWS Secrets Manager secret that stores your authentication credentials.
   */
  public readonly authSecret: ISecret;
  /**
   * The KMS key to use to encrypt the data source.
   */
  public readonly kmsKey?: IKey;
  /**
   * The Data Source cfn resource.
   */
  private readonly __resource: CfnDataSource;


  constructor(scope: Construct, id: string, props: SalesforceDataSourceProps) {
    super(scope, id);
    // Assign attributes
    this.knowledgeBase = props.knowledgeBase;
    this.dataSourceType = DataSourceType.SALESFORCE;
    this.name = props.name ?? generatePhysicalNameV2(this, 'sfdc-datasource', { maxLength: 40, lower: true, separator: '-' });;
    this.dataSourceName = this.name;
    this.endpoint = props.endpoint;
    this.authSecret = props.authSecret;
    this.kmsKey = props.kmsKey;

    // L1 instantiation
    this.__resource = new CfnDataSource(this, 'DataSource', {
      knowledgeBaseId: this.knowledgeBase.knowledgeBaseId,
      name: this.name,
      dataDeletionPolicy: props.dataDeletionPolicy ?? DataDeletionPolicy.DELETE,
      dataSourceConfiguration: {
        type: this.dataSourceType,
        salesforceConfiguration: {
          sourceConfiguration: {
            authType: SalesforceDataSourceAuthType.OAUTH2_CLIENT_CREDENTIALS,
            credentialsSecretArn: this.authSecret.secretArn,
            hostUrl: this.endpoint,
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