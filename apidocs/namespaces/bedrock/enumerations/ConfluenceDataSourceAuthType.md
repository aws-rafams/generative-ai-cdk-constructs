[**@cdklabs/generative-ai-cdk-constructs**](../../../README.md) • **Docs**

***

[@cdklabs/generative-ai-cdk-constructs](../../../README.md) / [bedrock](../README.md) / ConfluenceDataSourceAuthType

# Enumeration: ConfluenceDataSourceAuthType

## Enumeration Members

### BASIC

> **BASIC**: `"BASIC"`

Your secret authentication credentials in AWS Secrets Manager should include:
 `username` and `password` (API token).

***

### OAUTH2\_CLIENT\_CREDENTIALS

> **OAUTH2\_CLIENT\_CREDENTIALS**: `"OAUTH2_CLIENT_CREDENTIALS"`

Your secret authentication credentials in AWS Secrets Manager should include: 
`confluenceAppKey`, `confluenceAppSecret`, `confluenceAccessToken`, `confluenceRefreshToken`.
