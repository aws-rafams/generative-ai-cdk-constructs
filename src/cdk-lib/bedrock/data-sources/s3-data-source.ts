import * as s3 from 'aws-cdk-lib/aws-s3';
import { DataDeletionPolicy, DataSourceAssociationProps, DataSourceNew, DataSourceType } from './base-data-source';
import { CfnDataSource } from 'aws-cdk-lib/aws-bedrock';
import { KnowledgeBase } from '@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock';
import { Construct } from 'constructs';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { NagSuppressions } from 'cdk-nag';
import { generatePhysicalNameV2 } from '@cdklabs/generative-ai-cdk-constructs/lib/common/helpers/utils';


/**
 * Interface to add a new S3DataSource to an existing KB
 */
export interface S3DataSourceAssociationProps extends DataSourceAssociationProps {
  /**
   * The bucket that contains the data source.
   */
  readonly bucket: s3.IBucket;

  /**
   * The prefixes of the objects in the bucket that should be included in the data source.
   *
   * @default - All objects in the bucket.
   */
  readonly inclusionPrefixes?: string[];

}

/**
 * Interface to create a new S3DataSource object
 */
export interface S3DataSourceProps extends S3DataSourceAssociationProps {
  /**
   * The knowledge base to associate with the data source.
   */
  readonly knowledgeBase: KnowledgeBase;
}


/**
 * Sets up an data source to be added to a knowledge base.
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
   * The bucket associated with the data source.
   */
  public readonly bucket: s3.IBucket;
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
    this.name = props.name ?? generatePhysicalNameV2(this, 's3-datasource', { maxLength: 40, lower: true, separator: '-' });;
    this.dataSourceName = this.name;
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
      name: this.name,
      dataDeletionPolicy: props.dataDeletionPolicy ?? DataDeletionPolicy.DELETE,
      dataSourceConfiguration: {
        type: this.dataSourceType,
        s3Configuration: {
          bucketArn: props.bucket.bucketArn,
          inclusionPrefixes: props.inclusionPrefixes,
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