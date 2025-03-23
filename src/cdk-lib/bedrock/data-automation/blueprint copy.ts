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

import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as bedrock from "aws-cdk-lib/aws-bedrock";
import { Construct } from "constructs";
import { IResource, Resource } from "aws-cdk-lib";
import { IKey } from "aws-cdk-lib/aws-kms";

/**
 * Type of Bedrock Blueprint
 */
export enum BlueprintType {
  /**
   * Document blueprint type
   */
  DOCUMENT = "DOCUMENT",

  /**
   * Image blueprint type
   */
  IMAGE = "IMAGE",
}

/**
 * The Stage of a Bedrock Blueprint
 * A project can be given a stage, either LIVE or DEVELOPMENT. Each stage is a unique and mutable
 * version of the project. This means you can edit or test with the DEVELOPMENT stage, and process
 * customer requests using the LIVE stage.
 */
export enum BlueprintStage {
  /**
   * DEVELOPMENT stage allows editing and testing of the blueprint
   */
  DEVELOPMENT = "DEVELOPMENT",

  /**
   * LIVE stage is used for processing customer requests in production
   */
  LIVE = "LIVE",
}

/**
 * Represents a field in a Bedrock Data Automation Blueprint
 */
export interface BlueprintField {
  /**
   * The name of the field to extract.
   */
  readonly name: string;

  /**
   * Optional description for the field.
   */
  readonly description?: string;

  /**
   * Optional validation rule for the field.
   */
  readonly validationRule?: string;
}

/**
 * Properties for creating a Blueprint
 */
export interface BlueprintProps {
  /**
   * Name of the blueprint.
   */
  readonly name: string;

  /**
   * Type of the blueprint.
   * @default BlueprintType.DOCUMENT
   */
  readonly type?: BlueprintType;

  /**
   * Optional AWS KMS key used to encrypt the blueprint.
   * @default - Your data is encrypted using a key that AWS owns and manages.
   */
  readonly kmsKey?: IKey;

  /**
   * Blueprint definition containing the fields to extract.
   */
  readonly definition: {
    readonly fields: BlueprintField[];
  };

  /**
   * Optional encryption context to use when encrypting with KMS.
   */
  readonly kmsEncryptionContext?: { [key: string]: string };
}

/**
 * Interface for Blueprint resources
 */
export interface IBlueprint extends IResource {
  /**
   * The ARN of the blueprint
   */
  readonly blueprintArn: string;

  /**
   * The name of the blueprint
   */
  readonly blueprintId: string;

  /**
   * The stage of the blueprint
   */
  readonly blueprintStage: BlueprintStage;

  /**
   * The type of blueprint
   */
  readonly blueprintType: BlueprintType;

  /**
   * The optional AWS KMS key to use for encryption
   */
  readonly kmsKey?: IKey;

  /**
   * When the blueprint was created
   */
  readonly creationTime?: string;

  /**
   * When the blueprint was last updated
   */
  readonly lastModifiedTime?: string;
}

/**
 * L2 Construct for Bedrock Data Automation Blueprint
 *
 * A blueprint lets you define custom output for documents and images in Bedrock Data Automation.
 * It consists of a list of fields that you want to extract from your data.
 *
 * @example
 * // Create a blueprint for extracting information from invoices
 * const invoiceBlueprint = new Blueprint(this, 'InvoiceBlueprint', {
 *   blueprintName: 'invoice-extractor',
 *   description: 'Extracts common fields from invoice documents',
 *   definition: {
 *     fields: [
 *       { name: 'InvoiceNumber', description: 'The invoice identifier' },
 *       { name: 'Date', description: 'The invoice date' },
 *       { name: 'TotalAmount', description: 'The total amount due' },
 *       { name: 'VendorName', description: 'The name of the vendor' }
 *     ]
 *   }
 * });
 */
export class Blueprint extends Resource implements IBlueprint {
  /**
   * Import an existing blueprint by ARN
   */
  public static fromBlueprintArn(scope: Construct, id: string, blueprintArn: string): IBlueprint {
    class Import extends Resource implements IBlueprint {
      public readonly blueprintArn = blueprintArn;
      public readonly blueprintId = cdk.Arn.split(blueprintArn, cdk.ArnFormat.COLON_RESOURCE_NAME)
        .resourceName!;
      public readonly blueprintStage = cdk.Token.asString(cdk.Fn.ref(`BlueprintStage-${id}`));
      public readonly creationTime = cdk.Token.asString(cdk.Fn.ref(`CreationTime-${id}`));
      public readonly lastModifiedTime = cdk.Token.asString(cdk.Fn.ref(`LastModifiedTime-${id}`));
    }

    return new Import(scope, id);
  }

  /**
   * Import an existing blueprint by ARN
   */
  public static fromManagedBlueprintId(
    scope: Construct,
    id: string,
    blueprintId: string
  ): IBlueprint {
    class Import extends Resource implements IBlueprint {
      public readonly blueprintArn = cdk.Stack.of(scope).formatArn({
        service: "bedrock",
        resource: "blueprint",
        resourceName: blueprintId,
      });
      public readonly blueprintId = blueprintId;
      public readonly blueprintStage = cdk.Token.asString(cdk.Fn.ref(`BlueprintStage-${id}`));
      public readonly creationTime = cdk.Token.asString(cdk.Fn.ref(`CreationTime-${id}`));
      public readonly lastModifiedTime = cdk.Token.asString(cdk.Fn.ref(`LastModifiedTime-${id}`));
    }

    return new Import(scope, id);
  }

  /**
   * The ARN of the blueprint
   */
  public readonly blueprintArn: string;

  /**
   * The name of the blueprint
   */
  public readonly blueprintId: string;

  /**
   * The stage of the blueprint
   */
  public readonly blueprintStage: BlueprintStage;

  /**
   * The type of blueprint
   */
  public readonly blueprintType: BlueprintType;

  /**
   * When the blueprint was created
   */
  public readonly creationTime: string;

  /**
   * When the blueprint was last updated
   */
  public readonly lastModifiedTime: string;

  /**
   * The underlying CloudFormation resource
   */
  private readonly cfnResource: bedrock.CfnBlueprint;

  constructor(scope: Construct, id: string, props: BlueprintProps) {
    super(scope, id);

    this.blueprintId = props.name;
    this.blueprintType = props.type ?? BlueprintType.DOCUMENT;

    // Create a schema from the definition fields
    const schema = {
      fields: props.definition.fields.map((field) => ({
        name: field.name,
        description: field.description,
        validationRule: field.validationRule,
      })),
    };

    // Create the CfnBlueprint resource
    this.cfnResource = new bedrock.CfnBlueprint(this, "Resource", {
      blueprintName: this.blueprintId,
      type: this.blueprintType,
      schema: schema,
      description: props.description,
      // Optional KMS properties
      kmsKeyId: props.kmsKeyId,
      kmsEncryptionContext: props.kmsEncryptionContext,
      // Optional tags
      tags: props.tags?.map((tag) => ({
        key: tag.key,
        value: tag.value,
      })),
    });

    // Set the attributes using Fn::GetAtt
    this.blueprintArn = this.cfnResource.getAtt("BlueprintArn").toString();
    this.blueprintStage = this.cfnResource.getAtt("BlueprintStage").toString();
    this.creationTime = this.cfnResource.getAtt("CreationTime").toString();
    this.lastModifiedTime = this.cfnResource.getAtt("LastModifiedTime").toString();
  }

  /**
   * Grant permissions to use this blueprint to the given identity
   */
  public grantUse(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee,
      actions: ["bedrock:GetBlueprint", "bedrock:ListBlueprints"],
      resourceArns: [this.blueprintArn],
    });
  }
}
