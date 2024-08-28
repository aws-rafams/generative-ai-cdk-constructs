/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */
import { Construct } from 'constructs';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { CfnDataSource } from 'aws-cdk-lib/aws-bedrock';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

import { DataDeletionPolicy, DataSourceAssociationProps, DataSourceNew, DataSourceType } from './base-data-source';
import { KnowledgeBase } from './../knowledge-base';
import { generatePhysicalNameV2 } from '../../../common/helpers/utils';


export enum ConfluenceDataSourceAuthType {
  /** 
   * Your secret authentication credentials in AWS Secrets Manager should include: 
   * `confluenceAppKey`, `confluenceAppSecret`, `confluenceAccessToken`, `confluenceRefreshToken`.
   */
  OAUTH2_CLIENT_CREDENTIALS = 'OAUTH2_CLIENT_CREDENTIALS',
  /** 
   * Your secret authentication credentials in AWS Secrets Manager should include:
   *  `username` and `password` (API token).
   */
  BASIC = 'BASIC'
}

export enum ConfluenceObjectType {
  SPACE = 'Space',
  PAGE = 'Page',
  BLOG = 'Blog',
  ATTACHMENT = 'Attachment',
  COMMENT = 'Comment'
}

export interface ConfluenceCrawlingFilters {
  /**
   * Include object types.
   */
  readonly objectType: ConfluenceObjectType;
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
export interface ConfluenceDataSourceAssociationProps extends DataSourceAssociationProps {
  /**
   * The Confluence host URL or instance URL.
   * @example https://example.atlassian.net
   */
  readonly endpoint: string;
  /**
   * The AWS Secrets Manager secret that stores your authentication credentials 
   * for your Confluence instance URL. Secret must start with "AmazonBedrock-".
   */
  readonly authSecret: ISecret;
  /**
   * The supported authentication method to connect to the data source.
   * @default ConfluenceDataSourceAuthType.OAUTH2_CLIENT_CREDENTIALS
   */
  readonly authType?: ConfluenceDataSourceAuthType;
  /**
   * The filters (regular expression patterns) for the crawling. 
   * If there's a conflict, the exclude pattern takes precedence.
   * @default None - all your content is crawled.
   */
  readonly filters?: ConfluenceCrawlingFilters[];

}

/**
 * Interface to create a new standalone data source object.
 */
export interface ConfluenceDataSourceProps extends ConfluenceDataSourceAssociationProps {
  /**
   * The knowledge base to associate with the data source.
   */
  readonly knowledgeBase: KnowledgeBase;
}


/**
 * Sets up a Confluence Data Source to be added to a knowledge base.
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/confluence-data-source-connector.html
 */
export class ConfluenceDataSource extends DataSourceNew {
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
  public readonly dataSourceName: string;
  /**
   * The knowledge base associated with the data source.
   */
  public readonly knowledgeBase: KnowledgeBase;
  /**
   * The Confluence host URL or instance URL.
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


  constructor(scope: Construct, id: string, props: ConfluenceDataSourceProps) {
    super(scope, id);
    // Assign attributes
    this.knowledgeBase = props.knowledgeBase;
    this.dataSourceType = DataSourceType.CONFLUENCE;
    this.dataSourceName = props.dataSourceName ?? generatePhysicalNameV2(this, 'sfdc-datasource', { maxLength: 40, lower: true, separator: '-' });;
    this.endpoint = props.endpoint;
    this.authSecret = props.authSecret;
    this.kmsKey = props.kmsKey;

    // L1 instantiation
    this.__resource = new CfnDataSource(this, 'DataSource', {
      knowledgeBaseId: this.knowledgeBase.knowledgeBaseId,
      name: this.dataSourceName,
      dataDeletionPolicy: props.dataDeletionPolicy ?? DataDeletionPolicy.DELETE,
      dataSourceConfiguration: {
        type: this.dataSourceType,
        confluenceConfiguration: {
          sourceConfiguration: {
            authType: props.authType ?? ConfluenceDataSourceAuthType.OAUTH2_CLIENT_CREDENTIALS,
            credentialsSecretArn: this.authSecret.secretArn,
            hostUrl: this.endpoint,
            hostType: "SAAS"
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
      vectorIngestionConfiguration: {
        chunkingConfiguration: props.chunkingStrategy?.configuration,
        parsingConfiguration: props.parsingStrategy?.configuration,
        customTransformationConfiguration: props.customTransformation?.configuration
      },
      serverSideEncryptionConfiguration: this.kmsKey ? {
        kmsKeyArn: this.kmsKey.keyArn,
      } : undefined,

    });

    this.dataSourceId = this.__resource.attrDataSourceId;


  }
}