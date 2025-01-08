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

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import { Construct } from 'constructs';
import { generatePhysicalNameV2 } from '../../common/helpers/utils';
import { IKey } from 'aws-cdk-lib/aws-kms';

export namespace Kendra {
  export enum Edition {
    DEVELOPER_EDITION = 'DEVELOPER_EDITION',
    ENTERPRISE_EDITION = 'ENTERPRISE_EDITION',
    GEN_AI_ENTERPRISE_EDITION = 'GEN_AI_ENTERPRISE_EDITION',
  }

  export enum IndexFieldTypes {
    STRING = 'STRING_VALUE',
    STRING_LIST = 'STRING_LIST_VALUE',
    LONG = 'LONG_VALUE',
    DATE = 'DATE_VALUE',
  }

  export enum UserContextPolicy {
    /** All indexed content is searchable and displayable for all users.
     * If you want to filter search results on user context, you can use
     * the attribute filters of _user_id and _group_ids or you can provide
     * user and group information in UserContext . */
    ATTRIBUTE_FILTER = 'ATTRIBUTE_FILTER',
    /**
     * Enables token-based user access control to filter search results on
     * user context. All documents with no access control and all documents
     * accessible to the user will be searchable and displayable.
     */
    USER_TOKEN = 'USER_TOKEN',
  }
}

export interface IKendraGenAiIndex extends cdk.IResource {
  /**
   * The Amazon Resource Name (ARN) of the index.
   */
  readonly indexArn: string;

  /**
   * The identifier of the index.
   */
  readonly indexId: string;

  /**
   * An IAM role that gives Amazon Kendra permissions to access
   * your Amazon CloudWatch logs and metrics. This is also the
   * role used when you use the BatchPutDocument operation to index
   * documents from an Amazon S3 bucket.
   */
  readonly role: iam.IRole;
}

/******************************************************************************
 *                        PROPS FOR NEW CONSTRUCT
 *****************************************************************************/
/**
 * Properties for creating a GenAI Index.
 */
export interface KendraGenAiIndexProps {
  /**
   * The name of the index.
   */
  readonly name?: string;
  /**
   * The identifier of the AWS KMS customer managed key (CMK) to use
   * to encrypt data indexed by Amazon Kendra. Amazon Kendra doesn't support
   * asymmetric CMKs.
   * @default - AWS managed encryption key is used.
   */
  readonly kmsKey?: IKey;
  /**
   * The document capacity units. Every unit increases the baseline capacity by 20,000 documents.
   * E.g. `documentCapacityUnits: 1` means Baseline + 20,000 documents = 40,000 documents
   * @default 0 - baseline capacity of 20,000 documents
   */
  readonly documentCapacityUnits?: number;
  /**
   * The query capacity units. Every unit increases the baseline capacity by 0.1 QPS.
   * E.g. `queryCapacityUnits: 7` means Baseline + 0.1 QPS * 7 = 0.8 QPS
   * @default 0 - baseline capacity of 0.1 QPS
   */
  readonly queryCapacityUnits?: number;
}
/******************************************************************************
 *                      ATTRS FOR IMPORTED CONSTRUCT
 *****************************************************************************/
export interface KendraGenAiIndexAttributes {
  /**
   * The Id of the index.
   */
  readonly indexId: string;
  /**
   * An IAM role that gives your Amazon Kendra index permissions.
   */
  readonly role: iam.IRole;
}

export abstract class KendraGenAiIndexBase extends cdk.Resource implements IKendraGenAiIndex {
  public abstract readonly indexArn: string;
  public abstract readonly indexId: string;
  public abstract readonly role: iam.IRole;
}

export class KendraGenAiIndex extends KendraGenAiIndexBase {
  /**
   * Import a guardrail given its attributes
   */
  public static fromAttrs(scope: Construct, id: string, attrs: KendraGenAiIndexAttributes): IKendraGenAiIndex {
    class Import extends KendraGenAiIndexBase {
      public readonly role = attrs.role;
      public readonly indexId = attrs.indexId;
      public readonly indexArn = cdk.Stack.of(this).formatArn({
        service: 'kendra',
        resource: 'index',
        resourceName: attrs.indexId,
        arnFormat: cdk.ArnFormat.SLASH_RESOURCE_NAME,
      });
    }
    return new Import(scope, id);
  }
  public readonly indexArn: string;
  public readonly indexId: string;
  public readonly role: iam.IRole;
  public readonly name: string;
  public readonly documentCapacityUnits: number;
  public readonly queryCapacityUnits: number;
  private readonly _resource: kendra.CfnIndex;
  constructor(scope: Construct, id: string, props: KendraGenAiIndexProps) {
    super(scope, id);

    // ------------------------------------------------------
    // Set properties or defaults
    // ------------------------------------------------------
    this.name =
      props.name ?? generatePhysicalNameV2(this, 'genai-index', { maxLength: 40, lower: true, separator: '-' });

    this.documentCapacityUnits = props.documentCapacityUnits ?? 0;
    this.queryCapacityUnits = props.documentCapacityUnits ?? 0;

    // ------------------------------------------------------
    // Role Creation
    // ------------------------------------------------------
    const roleName = generatePhysicalNameV2(this, `AmazonKendra-${this.name}`, { maxLength: 64 });
    this.role = new iam.Role(this, 'Role', {
      roleName: roleName,
      assumedBy: new iam.ServicePrincipal('kendra.amazonaws.com'),
    });

    // ------------------------------------------------------
    // L1 Instantiation
    // ------------------------------------------------------
    this._resource = new kendra.CfnIndex(this, 'GenAiIndex', {
      name: this.name,
      edition: Kendra.Edition.GEN_AI_ENTERPRISE_EDITION,
      roleArn: this.role.roleArn,
      serverSideEncryptionConfiguration: props.kmsKey
        ? {
            kmsKeyId: props.kmsKey.keyId,
          }
        : undefined,
      //   documentMetadataConfigurations: [
      //     {
      //       name: '_authors',
      //       type: Kendra.IndexFieldTypes.STRING_LIST,
      //       relevance: {
      //         importance: 1,
      //       },
      //       search: {
      //         facetable: false,
      //         searchable: false,
      //         displayable: false,
      //         sortable: false,
      //       },
      //     },
      //   ],
      capacityUnits: {
        storageCapacityUnits: this.documentCapacityUnits,
        queryCapacityUnits: this.queryCapacityUnits,
      },
      userContextPolicy: Kendra.UserContextPolicy.ATTRIBUTE_FILTER,
    });
    this.indexArn = this._resource.attrArn;
    this.indexId = this._resource.attrId;
  }
}
