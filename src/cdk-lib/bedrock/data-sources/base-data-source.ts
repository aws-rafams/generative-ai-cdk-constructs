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

import { IResource, Resource } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

import { KnowledgeBase } from './../knowledge-base';
import { ChunkingStrategy } from './chunking';
import { CustomTransformation } from './custom-transformation';
import { ParsingStategy } from './parsing';


export enum DataDeletionPolicy {
  /**
   * Deletes the data source and its associated resources.
   */
  DELETE = 'DELETE',
  /**
   * Retains the data source and its associated resources.
   */
  RETAIN = 'RETAIN'
}

export enum DataSourceType {
  /**
   * Connects to an Amazon S3 Bucket.
   */
  S3 = 'S3',
  /**
   * Connects to a Confluence Cloud Instance.
   */
  CONFLUENCE = 'CONFLUENCE',
  /**
   * Connects to a Salesforce instance.
   */
  SALESFORCE = 'SALESFORCE',
  /**
   * Connects to a Microsoft SharePoint instance.
   */
  SHAREPOINT = 'SHAREPOINT',
  /**
   * Leverages a Web page crawler that extracts content from public web pages
   * which you are authorized to crawl.
   */
  WEB_CRAWLER = 'WEB'
}

/**
 * Specifies interface for resources created with CDK or imported into CDK.
 */
export interface IDataSource extends IResource {
  /**
   * The unique identifier of the data source.
   * @example 'JHUEVXUZMU'
   */
  readonly dataSourceId: string;
}

/**
 * Specifies the base class for all data source resources (imported and new).
 */
export abstract class DataSourceBase extends Resource implements IDataSource {
  /**
   * The unique identifier of the data source.
   * @example 'JHUEVXUZMU'
   */
  public abstract readonly dataSourceId: string;

  // Common methods for imported and new data sources go here
}


/**
 * Properties common for creating any of the different data source types.
 */
export interface DataSourceAssociationProps {
  /**
   * The name of the data source.
   *
   * @default - A new name will be generated.
   */
  readonly dataSourceName?: string;
  /**
   * A description of the data source.
   *
   * @default - No description is provided.
   */
  readonly description?: string;
  /**
   * The KMS key to use to encrypt the data source.
   *
   * @default - Service owned and managed key.
   */
  readonly kmsKey?: kms.IKey;
  /**
   * The data deletion policy to apply to the data source.
   *
   * @default DataDeletionPolicy.DELETE
   */
  readonly dataDeletionPolicy?: DataDeletionPolicy;
  /**
   * The chunking stategy to use for splitting your documents or content.
   * The chunks are then converted to embeddings and written to the vector
   * index allowing for similarity search and retrieval of the content.
   *
   * @default ChunkingStrategy.DEFAULT
   */
  readonly chunkingStrategy?: ChunkingStrategy;
  /**
   * The parsing strategy to use.
   *
   * @default - No Parsing Stategy is used.
   */
  readonly parsingStrategy?: ParsingStategy;
  /**
   * The custom transformation strategy to use.
   *
   * @default - No custom transformation is used.
   */
  readonly customTransformation?: CustomTransformation;
}


/**
 * Specifies the base class for all NEW data source resources of ANY type.
 */
export abstract class DataSourceNew extends DataSourceBase {
  /**
   * The unique identifier of the data source.
   * @example 'JHUEVXUZMU'
   */
  public abstract readonly dataSourceId: string;
  /**
   * The type of data source.
   */
  public abstract readonly dataSourceType: DataSourceType;
  /**
   * The name of the data source.
   */
  public abstract readonly dataSourceName: string;
  /**
   * The knowledge base associated with the data source.
   */
  public abstract readonly knowledgeBase: KnowledgeBase;

  // Common methods only for new data sources go here
}


export class DataSource extends DataSourceBase {

  public static fromDataSourceId(scope: Construct, id: string, dataSourceId: string): IDataSource {
    return new DataSource(scope, id, dataSourceId);
  }

  public readonly dataSourceId: string;

  private constructor(scope: Construct, id: string, dataSourceId: string) {
    super(scope, id);
    this.dataSourceId = dataSourceId;
  }
}
