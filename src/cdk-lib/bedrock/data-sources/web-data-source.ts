import { KnowledgeBase } from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock";
import { DataDeletionPolicy, DataSourceNew, DataSourceAssociationProps, DataSourceType } from "./base-data-source";
import { IKey } from "aws-cdk-lib/aws-kms";
import { CfnDataSource } from "aws-cdk-lib/aws-bedrock";
import { Construct } from "constructs";
import { generatePhysicalNameV2 } from "@cdklabs/generative-ai-cdk-constructs/lib/common/helpers/utils";

export enum CrawlingScope {
  /**
   * Crawls only web pages that belong to the same host or primary domain.
   */
  HOST_ONLY = "HOST_ONLY",
  /**
   * Includes subdomains in addition to the host or primary domain, i.e.
   * web pages that contain "aws.amazon.com" can also include 
   * sub domain "docs.aws.amazon.com"
   */
  SUBDOMAINS = "SUBDOMAINS",
  /**
   * Limit crawling to web pages that belong to the same host and with the 
   * same initial URL path.
   * @warning bug in resource handler - not specifying crawling scope makes it fail but resource creation succeeds.
   */
  //DEFAULT = ""
}
export interface CrawlingFilters {
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
export interface WebCrawlerDataSourceAssociationProps extends DataSourceAssociationProps {
  /**
   * The source urls in the format `https://www.sitename.com`.
   * Maximum of 100 URLs.
   */
  readonly sourceUrls: string[];
  /**
   * The scope of the crawling.
   * @default CrawlingScope.HOST_ONLY
   */
  readonly crawlingScope?: CrawlingScope;
  /**
   * The max rate at which pages are crawled, up to 300 per minute per host.
   * Higher values will decrease sync time but increase the load on the host.
   * @default 300
   */
  readonly crawlingRate?: number;
  /**
   * The filters (regular expression patterns) for the crawling. 
   * If there's a conflict, the exclude pattern takes precedence.
   * @default None
   */
  readonly filters?: CrawlingFilters;
}

/**
 * Interface to create a new standalone data source object.
 */
export interface WebCrawlerDataSourceProps extends WebCrawlerDataSourceAssociationProps {
  /**
   * The knowledge base to associate with the data source.
   */
  readonly knowledgeBase: KnowledgeBase;
}

/**
 * Sets up a web crawler data source to be added to a knowledge base.
 */
export class WebCrawlerDataSource extends DataSourceNew {
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
   * The max rate at which pages are crawled.
   */
  public readonly crawlingRate: number;
  /**
   * The KMS key to use to encrypt the data source.
   */
  public readonly kmsKey?: IKey;
  /**
   * The Data Source cfn resource.
   */
  private readonly __resource: CfnDataSource;

  constructor(scope: Construct, id: string, props: WebCrawlerDataSourceProps) {
    super(scope, id);
    // Assign attributes
    this.knowledgeBase = props.knowledgeBase;
    this.dataSourceType = DataSourceType.WEB_CRAWLER;
    this.name = props.name ?? generatePhysicalNameV2(this, 'crawler-datasource', { maxLength: 40, lower: true, separator: '-' });;
    this.dataSourceName = this.name;
    this.kmsKey = props.kmsKey;
    this.crawlingRate = props.crawlingRate ?? 300

    // L1 instantiation
    this.__resource = new CfnDataSource(this, 'DataSource', {
      knowledgeBaseId: this.knowledgeBase.knowledgeBaseId,
      name: this.name,
      dataDeletionPolicy: props.dataDeletionPolicy ?? DataDeletionPolicy.DELETE,
      dataSourceConfiguration: {
        type: this.dataSourceType,
        webConfiguration: {
          crawlerConfiguration: {
            crawlerLimits: {
              rateLimit: this.crawlingRate
            },
            scope: (props.crawlingScope || CrawlingScope.HOST_ONLY) ? props.crawlingScope : undefined,
            inclusionFilters: props.filters?.includePatterns,
            exclusionFilters: props.filters?.excludePatterns

          },
          sourceConfiguration: {
            urlConfiguration: {
              seedUrls: props.sourceUrls.map(item => ({ "url": item })),
            }
          }
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
