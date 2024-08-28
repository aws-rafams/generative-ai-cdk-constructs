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
import { CfnDataSource } from 'aws-cdk-lib/aws-bedrock';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

import { KnowledgeBase } from './../knowledge-base';
import { DataDeletionPolicy, DataSourceAssociationProps, DataSourceNew, DataSourceType } from './base-data-source';
import { generatePhysicalNameV2 } from '../../../common/helpers/utils';


/**
 * Interface to add a new S3DataSource to an existing KB
 */
export interface S3DataSourceAssociationProps extends DataSourceAssociationProps {
  /**
   * The bucket that contains the data source.
   */
  readonly bucket: IBucket;

  /**
   * The prefixes of the objects in the bucket that should be included in the data source.
   *
   * @default - All objects in the bucket.
   */
  readonly inclusionPrefixes?: string[];

}

/**
 * Interface to create a new S3 Data Source object.
 */
export interface S3DataSourceProps extends S3DataSourceAssociationProps {
  /**
   * The knowledge base to associate with the data source.
   */
  readonly knowledgeBase: KnowledgeBase;
}


/**
 * Sets up an S3 Data Source to be added to a knowledge base.
 */
export class S3DataSource extends DataSourceNew {
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
   * The bucket associated with the data source.
   */
  public readonly bucket: IBucket;
  /**
   * The KMS key to use to encrypt the data source.
   */
  public readonly kmsKey?: IKey;
  /**
   * The Data Source cfn resource.
   */
  private readonly __resource: CfnDataSource;


  constructor(scope: Construct, id: string, props: S3DataSourceProps) {
    super(scope, id);
    // Assign attributes
    this.knowledgeBase = props.knowledgeBase;
    this.dataSourceType = DataSourceType.S3;
    this.dataSourceName = props.dataSourceName ?? generatePhysicalNameV2(this, 's3-datasource', { maxLength: 40, lower: true, separator: '-' });;
    this.bucket = props.bucket;
    this.kmsKey = props.kmsKey;


    this.bucket.grantRead(this.knowledgeBase.role);
    NagSuppressions.addResourceSuppressions(
      this.knowledgeBase.role,
      [{
        id: 'AwsSolutions-IAM5',
        reason: 'The KB role needs read only access to all objects in the data source bucket.',
      }],
      true,
    );
    // L1 instantiation
    this.__resource = new CfnDataSource(this, 'DataSource', {
      knowledgeBaseId: this.knowledgeBase.knowledgeBaseId,
      name: this.dataSourceName,
      dataDeletionPolicy: props.dataDeletionPolicy ?? DataDeletionPolicy.DELETE,
      dataSourceConfiguration: {
        type: this.dataSourceType,
        s3Configuration: {
          bucketArn: props.bucket.bucketArn,
          inclusionPrefixes: props.inclusionPrefixes,
        },
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration: props.chunkingStrategy?.configuration,
        parsingConfiguration: props.parsingStrategy?.configuration,
        customTransformationConfiguration: props.customTransformation?.configuration,
      },
      serverSideEncryptionConfiguration: this.kmsKey ? {
        kmsKeyArn: this.kmsKey.keyArn,
      } : undefined,

    });

    this.dataSourceId = this.__resource.attrDataSourceId;


  }
}