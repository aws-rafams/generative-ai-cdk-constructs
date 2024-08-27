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
import { Arn, ArnFormat, aws_kms as kms, Lazy } from 'aws-cdk-lib';
import { aws_bedrock as bedrock } from 'aws-cdk-lib';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { IModel } from 'aws-cdk-lib/aws-bedrock';

export enum PromptTemplateType {
  TEXT = 'TEXT',
}

export interface CommonPromptVariantProps {
  /**
   * The name of the prompt variant.
   */
  readonly name: string;
  /**
   * The model which is used to run the prompt. The model could be a foundation 
   * model, a custom model, or a provisioned model.
   */
  readonly model: IModel;
}

export interface TextPromptVariantProps extends CommonPromptVariantProps {
  /**
   * Inference configuration for the Text Prompt
   */
  readonly inferenceConfiguration?: bedrock.CfnPrompt.PromptModelInferenceConfigurationProperty;

  /**
   * Template Configuration for the text prompt
   */
  readonly templateConfiguration?: bedrock.CfnPrompt.TextPromptTemplateConfigurationProperty;
}


/**
 * Variants are specific sets of inputs that guide FMs on Amazon Bedrock to
 * generate an appropriate response or output for a given task or instruction.
 * You can optimize the prompt for specific use cases and models.
 */
export class PromptVariant implements bedrock.CfnPrompt.PromptVariantProperty {
  /**
   * The name of the prompt variant.
   */
  public name: string;
  /**
   * The type of prompt template.
   */
  public templateType: PromptTemplateType;
  /**
   * The inference configuration.
   */
  public inferenceConfiguration?: bedrock.CfnPrompt.PromptInferenceConfigurationProperty;
  /**
   * The unique identifier of the model with which to run inference on the prompt.
   */
  public modelId?: string;
  /**
   * The template configuration.
   */
  public templateConfiguration?: bedrock.CfnPrompt.PromptTemplateConfigurationProperty;

  /**
   * Static method to create a text template
   */
  public static text(props: TextPromptVariantProps): PromptVariant {
    return new PromptVariant({
      name: props.name,
      templateType: PromptTemplateType.TEXT,
      modelId: props.model.modelArn,
      inferenceConfiguration: {
        text: { ...props.inferenceConfiguration }
      },
      templateConfiguration: {
        text: { ...props.templateConfiguration }
      }
    });
  }

  private constructor(props: bedrock.CfnPrompt.PromptVariantProperty) {
    this.name = props.name;
    this.templateType = props.templateType as PromptTemplateType;
    this.modelId = props.modelId;
    this.inferenceConfiguration = props?.inferenceConfiguration as bedrock.CfnPrompt.PromptInferenceConfigurationProperty;
    this.templateConfiguration = props?.templateConfiguration as bedrock.CfnPrompt.PromptTemplateConfigurationProperty;
  }

}

/**
 * Represents a Prompt, either created with CDK or imported.
 */
export interface IPrompt {
  /**
   * The ARN of the prompt.
   * @example "arn:aws:bedrock:us-east-1:123456789012:prompt/PROMPT12345"
   */
  readonly promptArn: string;
  /**
   * The ID of the prompt.
   * @example "PROMPT12345"
   */
  readonly promptId: string;
}


export interface PromptProps {
  /**
   * The name of the prompt.
   */
  readonly name: string;
  /**
   * A description of what the prompt does.
   * @default - No description provided.
   */
  readonly description?: string;
  /**
   * The KMS key that the prompt is encrypted with.
   * @default - AWS owned and managed key.
   */
  readonly encryptionKey?: kms.IKey;
  /**
   * The Prompt Variant that will be used by default.
   * @default - No default variant provided.
   */
  readonly defaultVariant?: PromptVariant;
  /**
   * The variants of your prompt. Variants can use different messages, models, 
   * or configurations so that you can compare their outputs to decide the best 
   * variant for your use case. Maximum of 3 variants.
   */
  readonly variants?: PromptVariant[];

}

/**
 * Prompts are a specific set of inputs that guide FMs on Amazon Bedrock to 
 * generate an appropriate response or output for a given task or instruction. 
 * You can optimize the prompt for specific use cases and models.
 * @resource AWS::Bedrock::Prompt
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html
 */
export class Prompt extends Construct implements IPrompt {
  /**
   * The name of the prompt.
   */
  public readonly name: string;
  /**
   * The KMS key that the prompt is encrypted with.
   */
  public readonly encryptionKey?: IKey;
  /**
   * The ARN of the prompt.
   * @example "arn:aws:bedrock:us-east-1:123456789012:prompt/PROMPT12345"
   */
  public readonly promptArn: string;
  /**
   * The ID of the prompt.
   * @example "PROMPT12345"
   */
  public readonly promptId: string;
  /**
   * The variants of the prompt.
   */
  readonly variants: PromptVariant[];

  /**
   * L1 resource
   */
  private readonly _resource: bedrock.CfnPrompt;

  // ------------------------------------------------------
  // Import Methods
  // ------------------------------------------------------
  public static fromPromptArn(promptArn: string): IPrompt {
    const formattedArn = Arn.split(promptArn, ArnFormat.SLASH_RESOURCE_NAME);
    return {
      promptArn: promptArn,
      promptId: formattedArn.resourceName!,
    };
  }
  // ------------------------------------------------------
  // Validation Methods
  // ------------------------------------------------------
  /**
   * Validates whether the prompt name is valid according to the specification.
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-bedrock-prompt.html#cfn-bedrock-prompt-name
   */
  private validatePromptName() {
    const errors: string[] = [];

    const matchesPattern = /^([0-9a-zA-Z][_-]?){1,100}$/.test(this.name);
    if (!matchesPattern) {
      errors.push('Valid characters are a-z, A-Z, 0-9, _ (underscore) and - (hyphen). And must not begin with a hyphen');
    }
    if (errors.length > 0) {
      errors.unshift(`Invalid prompt name (value: ${this.name})`);
    }
    return errors;
  }

  /**
   * Validates whether the number of prompt variants is respected.
   */
  private validatePromptVariants() {
    const errors: string[] = [];
    if (this.variants.length > 3) {
      errors.push(`Error: Too many variants specified. The maximum allowed is 3, but you have provided ${this.variants.length} variants.`);
    }
    return errors;
  }

  // ------------------------------------------------------
  // Constructor
  // ------------------------------------------------------
  constructor(scope: Construct, id: string, props: PromptProps) {
    super(scope, id);
    // ------------------------------------------------------
    // Set properties or defaults
    // ------------------------------------------------------
    this.name = props.name;
    this.encryptionKey = props.encryptionKey;
    this.variants = props.variants ?? [];

    // ------------------------------------------------------
    // Validation
    // ------------------------------------------------------
    this.node.addValidation({ validate: () => this.validatePromptName() });
    this.node.addValidation({ validate: () => this.validatePromptVariants() });

    // ------------------------------------------------------
    // L1 Instantiation
    // ------------------------------------------------------
    this._resource = new bedrock.CfnPrompt(this, 'Prompt', {
      customerEncryptionKeyArn: this.encryptionKey?.keyArn,
      defaultVariant: props.defaultVariant?.name,
      description: props.description,
      name: props.name,
      variants: Lazy.any({
        produce: () => (this.variants),
      }),
    })

    this.promptArn = this._resource.attrArn;
    this.promptId = this._resource.attrId;
  }

  /**
   * Creates a prompt version, a static snapshot of your prompt that can be
   * deployed to production.
   */
  public createVersion(description?: string) {
    new bedrock.CfnPromptVersion(this, `PromptVersion-${description}`, {
      promptArn: this.promptArn,
      description,
    });
  }

  /**
   * Adds a prompt variant.
   */
  public addVariant(variant: PromptVariant) {
    this.variants.push(variant);
  }
}