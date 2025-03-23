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
import { Construct } from "constructs";
import { IResource, Resource } from "aws-cdk-lib";
import { IBlueprint } from "./blueprint";

/**
 * Stage of a Bedrock Data Automation Project
 */
export enum ProjectStage {
  /**
   * For development and testing purposes
   */
  DEVELOPMENT = "DEVELOPMENT",

  /**
   * For production use
   */
  LIVE = "LIVE",
}

/**
 * Configuration for document processing in a DataAutomationProject
 */
export interface DocumentConfig {
  /**
   * Enable document splitting for multi-document files
   *
   * @default false
   */
  readonly enableSplitting?: boolean;

  /**
   * Enable document summary generation
   *
   * @default true
   */
  readonly enableSummary?: boolean;

  /**
   * List of blueprint ARNs or blueprint references to use for document custom output
   * You can have up to 40 document blueprints attached to a project
   *
   * @default []
   */
  readonly blueprints?: IBlueprint[];
}

/**
 * Configuration for image processing in a DataAutomationProject
 */
export interface ImageConfig {
  /**
   * Enable object detection for images
   *
   * @default true
   */
  readonly enableObjectDetection?: boolean;

  /**
   * Enable text detection for images
   *
   * @default true
   */
  readonly enableTextDetection?: boolean;

  /**
   * Enable image description generation
   *
   * @default true
   */
  readonly enableDescription?: boolean;

  /**
   * Blueprint ARN or blueprint reference for image custom output
   * Images only support a single blueprint definition per project
   */
  readonly blueprint?: string | IBlueprint;
}

/**
 * Configuration for video processing in a DataAutomationProject
 */
export interface VideoConfig {
  /**
   * Enable full audio transcript generation
   *
   * @default true
   */
  readonly enableTranscript?: boolean;

  /**
   * Enable scene summaries generation
   *
   * @default true
   */
  readonly enableSceneSummaries?: boolean;

  /**
   * Enable full video summary generation
   *
   * @default true
   */
  readonly enableFullSummary?: boolean;

  /**
   * Enable content moderation
   *
   * @default false
   */
  readonly enableContentModeration?: boolean;
}

/**
 * Configuration for audio processing in a DataAutomationProject
 */
export interface AudioConfig {
  /**
   * Enable full audio transcript generation
   *
   * @default true
   */
  readonly enableTranscript?: boolean;

  /**
   * Enable full audio summary generation
   *
   * @default true
   */
  readonly enableSummary?: boolean;
}

/**
 * Properties for creating a DataAutomationProject
 */
export interface DataAutomationProjectProps {
  /**
   * Name of the project
   */
  readonly projectName: string;

  /**
   * Description of the project
   */
  readonly description?: string;

  /**
   * Stage of the project
   *
   * @default - ProjectStage.DEVELOPMENT
   */
  readonly stage?: ProjectStage;

  /**
   * Configuration for document processing
   */
  readonly documentConfig?: DocumentConfig;

  /**
   * Configuration for image processing
   */
  readonly imageConfig?: ImageConfig;

  /**
   * Configuration for video processing
   */
  readonly videoConfig?: VideoConfig;

  /**
   * Configuration for audio processing
   */
  readonly audioConfig?: AudioConfig;

  /**
   * Optional project tags
   */
  readonly tags?: cdk.CfnTag[];
}

/**
 * Interface for DataAutomationProject resources
 */
export interface IDataAutomationProject extends IResource {
  /**
   * The ARN of the data automation project
   */
  readonly projectArn: string;

  /**
   * The name of the data automation project
   */
  readonly projectName: string;
}

/**
 * L2 Construct for Bedrock Data Automation Project
 *
 * A project is a BDA resource that allows you to modify and organize output configurations.
 * Each project can contain standard output configurations for documents, images, video, and audio,
 * as well as custom output blueprints for documents and images.
 *
 * @example
 * // Create a project for invoice processing
 * const invoiceProject = new DataAutomationProject(this, 'InvoiceProject', {
 *   projectName: 'invoice-processing',
 *   description: 'Project for invoice processing',
 *   stage: ProjectStage.DEVELOPMENT,
 *   documentConfig: {
 *     enableSplitting: true,
 *     enableSummary: true,
 *     blueprints: [invoiceBlueprint]
 *   },
 *   audioConfig: {
 *     enableSummary: true,
 *     enableTranscript: false
 *   }
 * });
 */
export class DataAutomationProject extends Resource implements IDataAutomationProject {
  /**
   * Import an existing project by ARN
   */
  public static fromProjectArn(
    scope: Construct,
    id: string,
    projectArn: string
  ): IDataAutomationProject {
    class Import extends Resource implements IDataAutomationProject {
      public readonly projectArn = projectArn;
      public readonly projectName = cdk.Fn.select(1, cdk.Fn.split("/", projectArn));
    }

    return new Import(scope, id);
  }

  /**
   * The ARN of the project
   */
  public readonly projectArn: string;

  /**
   * The name of the project
   */
  public readonly projectName: string;

  /**
   * The underlying CloudFormation resource
   */
  private readonly cfnResource: cdk.CfnResource;

  constructor(scope: Construct, id: string, props: DataAutomationProjectProps) {
    super(scope, id);

    this.projectName = props.projectName;

    // Prepare document configuration
    const documentConfig: any = {};
    if (props.documentConfig) {
      if (props.documentConfig.enableSplitting !== undefined) {
        documentConfig.EnableSplitting = props.documentConfig.enableSplitting;
      }
      if (props.documentConfig.enableSummary !== undefined) {
        documentConfig.StandardOutput = {
          EnableSummary: props.documentConfig.enableSummary,
        };
      }
      if (props.documentConfig.blueprints && props.documentConfig.blueprints.length > 0) {
        documentConfig.CustomOutput = {
          BlueprintIds: props.documentConfig.blueprints.map((blueprint) =>
            typeof blueprint === "string" ? blueprint : blueprint.blueprintArn
          ),
        };
      }
    }

    // Prepare image configuration
    const imageConfig: any = {};
    if (props.imageConfig) {
      imageConfig.StandardOutput = {};
      if (props.imageConfig.enableObjectDetection !== undefined) {
        imageConfig.StandardOutput.EnableObjectDetection = props.imageConfig.enableObjectDetection;
      }
      if (props.imageConfig.enableTextDetection !== undefined) {
        imageConfig.StandardOutput.EnableTextDetection = props.imageConfig.enableTextDetection;
      }
      if (props.imageConfig.enableDescription !== undefined) {
        imageConfig.StandardOutput.EnableDescription = props.imageConfig.enableDescription;
      }
      if (props.imageConfig.blueprint) {
        imageConfig.CustomOutput = {
          BlueprintId:
            typeof props.imageConfig.blueprint === "string"
              ? props.imageConfig.blueprint
              : props.imageConfig.blueprint.blueprintArn,
        };
      }
    }

    // Prepare video configuration
    const videoConfig: any = {};
    if (props.videoConfig) {
      videoConfig.StandardOutput = {};
      if (props.videoConfig.enableTranscript !== undefined) {
        videoConfig.StandardOutput.EnableTranscript = props.videoConfig.enableTranscript;
      }
      if (props.videoConfig.enableSceneSummaries !== undefined) {
        videoConfig.StandardOutput.EnableSceneSummaries = props.videoConfig.enableSceneSummaries;
      }
      if (props.videoConfig.enableFullSummary !== undefined) {
        videoConfig.StandardOutput.EnableFullSummary = props.videoConfig.enableFullSummary;
      }
      if (props.videoConfig.enableContentModeration !== undefined) {
        videoConfig.StandardOutput.EnableContentModeration =
          props.videoConfig.enableContentModeration;
      }
    }

    // Prepare audio configuration
    const audioConfig: any = {};
    if (props.audioConfig) {
      audioConfig.StandardOutput = {};
      if (props.audioConfig.enableTranscript !== undefined) {
        audioConfig.StandardOutput.EnableTranscript = props.audioConfig.enableTranscript;
      }
      if (props.audioConfig.enableSummary !== undefined) {
        audioConfig.StandardOutput.EnableSummary = props.audioConfig.enableSummary;
      }
    }

    // Create the CloudFormation resource
    this.cfnResource = new cdk.CfnResource(this, "Resource", {
      type: "AWS::Bedrock::DataAutomationProject",
      properties: {
        Name: props.projectName,
        Description: props.description,
        Stage: props.stage || ProjectStage.DEVELOPMENT,
        Configuration: {
          Document: Object.keys(documentConfig).length > 0 ? documentConfig : undefined,
          Image: Object.keys(imageConfig).length > 0 ? imageConfig : undefined,
          Video: Object.keys(videoConfig).length > 0 ? videoConfig : undefined,
          Audio: Object.keys(audioConfig).length > 0 ? audioConfig : undefined,
        },
        Tags: props.tags,
      },
    });

    // Set the ARN
    this.projectArn = cdk.Fn.join(":", [
      "arn",
      cdk.Aws.PARTITION,
      "bedrock",
      cdk.Aws.REGION,
      cdk.Aws.ACCOUNT_ID,
      `project/${props.projectName}`,
    ]);
  }

  /**
   * Grant permissions to use this project to the given identity
   */
  public grantUse(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee,
      actions: [
        "bedrock:GetDataAutomationProject",
        "bedrock:ListDataAutomationProjects",
        "bedrock:InvokeDataAutomationAsync",
      ],
      resourceArns: [this.projectArn],
    });
  }
}
