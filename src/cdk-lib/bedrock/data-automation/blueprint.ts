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

/******************************************************************************
 *                              ENUMS
 *****************************************************************************/
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

/******************************************************************************
 *                             COMMON INTERFACE
 *****************************************************************************/
/**
 * Interface for Blueprint resources
 */
export interface IBlueprint extends IResource {
  /**
   * The ARN of the blueprint
   * @example "arn:aws:bedrock:us-east-1:123456789012:blueprint/d7b001a6b388""
   */
  readonly blueprintArn: string;

  /**
   * The Id of the blueprint
   * @example "d7b001a6b388"
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
   * Grant permissions to read this blueprint to the given identity.
   * Grants the `bedrock:GetBlueprint` IAM action along with tag read.
   */
  grantRead(grantee: iam.IGrantable): iam.Grant;

  /**
   * Grant permissions to invoke jobs on this blueprint to the given identity.
   * Grants the `bedrock:InvokeDataAutomationAsync` IAM action.
   */
  grantJobInvoke(grantee: iam.IGrantable): iam.Grant;
}

/******************************************************************************
 *                              ABSTRACT CLASS
 *****************************************************************************/

/**
 * Abstract base class for Bedrock Blueprint resources
 */
export abstract class BlueprintBase extends Resource implements IBlueprint {
  public abstract readonly blueprintArn: string;
  public abstract readonly blueprintId: string;
  public abstract readonly blueprintStage: BlueprintStage;
  public abstract readonly blueprintType: BlueprintType;
  public abstract readonly kmsKey?: IKey;

  public grantRead(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee,
      actions: ["bedrock:GetBlueprint", "bedrock:ListTagsForResource"],
      resourceArns: [this.blueprintArn],
    });
  }

  public grantJobInvoke(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee,
      actions: ["bedrock:InvokeDataAutomationAsync"],
      resourceArns: [this.blueprintArn],
    });
  }
}

/******************************************************************************
 *                       COMMON PROPS FOR NEW CONSTRUCT
 *****************************************************************************/

/******************************************************************************
 *                      ATTRS FOR IMPORTED CONSTRUCT
 *****************************************************************************/
/**
 * Properties for importing an existing Blueprint
 */
export interface CommonBlueprintAttributes {
  /**
   * The ARN of the blueprint
   */
  readonly blueprintArn: string;

  /**
   * The ID of the blueprint
   */
  readonly blueprintId: string;

  /**
   * The stage of the blueprint
   */
  readonly blueprintStage: BlueprintStage;

  /**
   * Optional KMS key used for encryption
   */
  readonly kmsKey?: IKey;
}

/**
 * Properties for importing an existing Document Blueprint
 */
export interface DocumentBlueprintAttributes extends CommonBlueprintAttributes {}

/**
 * Properties for importing an existing Image Blueprint
 */
export interface ImageBlueprintAttributes extends CommonBlueprintAttributes {}

/******************************************************************************
 *                      PROPS FOR NEW DOCUMENT CONSTRUCT
 *****************************************************************************/

/******************************************************************************
 *                        	 DOCUMENT CONSTRUCT
 *****************************************************************************/

/**
 * Represents a Bedrock Document Blueprint
 */
export class DocumentBlueprint extends BlueprintBase {
  /**
   * Import an existing Blueprint from its attributes
   */
  public static fromDocumentBlueprintAttributes(
    scope: Construct,
    id: string,
    attrs: DocumentBlueprintAttributes
  ): IBlueprint {
    if (!attrs.blueprintId && !attrs.blueprintArn) {
      throw new Error("Either blueprintId or blueprintArn must be specified");
    }

    // If blueprintArn is not provided, construct it from blueprintId
    const blueprintArn =
      attrs.blueprintArn ??
      cdk.Stack.of(scope).formatArn({
        service: "bedrock",
        resource: "blueprint",
        resourceName: attrs.blueprintId,
      });

    // If blueprintId is not provided, extract it from blueprintArn
    const blueprintId =
      attrs.blueprintId ??
      cdk.Stack.of(scope).splitArn(blueprintArn, cdk.ArnFormat.SLASH_RESOURCE_NAME).resourceName!;

    class Import extends BlueprintBase {
      public readonly blueprintArn = blueprintArn!;
      public readonly blueprintId = blueprintId!;
      public readonly blueprintStage = attrs.blueprintStage;
      public readonly blueprintType = BlueprintType.DOCUMENT;
      public readonly kmsKey = attrs.kmsKey;
    }

    return new Import(scope, id);
  }

  public readonly blueprintArn: string;
  public readonly blueprintId: string;
  public readonly blueprintStage: BlueprintStage;
  public readonly blueprintType: BlueprintType;
  public readonly kmsKey?: IKey;
}

/******************************************************************************
 *                        	 IMAGE CONSTRUCT
 *****************************************************************************/

/**
 * Represents a Bedrock Document Blueprint
 */
export class ImageBlueprint extends BlueprintBase {
  /**
   * Import an existing Blueprint from its attributes
   */
  public static fromImageBlueprintAttributes(
    scope: Construct,
    id: string,
    attrs: ImageBlueprintAttributes
  ): IBlueprint {
    if (!attrs.blueprintId && !attrs.blueprintArn) {
      throw new Error("Either blueprintId or blueprintArn must be specified");
    }

    // If blueprintArn is not provided, construct it from blueprintId
    const blueprintArn =
      attrs.blueprintArn ??
      cdk.Stack.of(scope).formatArn({
        service: "bedrock",
        resource: "blueprint",
        resourceName: attrs.blueprintId,
      });

    // If blueprintId is not provided, extract it from blueprintArn
    const blueprintId =
      attrs.blueprintId ??
      cdk.Stack.of(scope).splitArn(blueprintArn, cdk.ArnFormat.SLASH_RESOURCE_NAME).resourceName!;

    class Import extends BlueprintBase {
      public readonly blueprintArn = blueprintArn!;
      public readonly blueprintId = blueprintId!;
      public readonly blueprintStage = attrs.blueprintStage;
      public readonly blueprintType = BlueprintType.IMAGE;
      public readonly kmsKey = attrs.kmsKey;
    }

    return new Import(scope, id);
  }

  public readonly blueprintArn: string;
  public readonly blueprintId: string;
  public readonly blueprintStage: BlueprintStage;
  public readonly blueprintType: BlueprintType;
  public readonly kmsKey?: IKey;
}
