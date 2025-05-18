# n8n-nodes-airtable-webhook-trigger

This is an n8n community node for triggering workflows based on Airtable webhooks. It allows you to watch for changes in Airtable tables and trigger workflows when records are created or updated.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Watch for record creation
- Watch for record updates
- Specify fields to watch for changes
- Include additional field data in the output

## Credentials

You need an Airtable Personal Access Token to use this node.

1. Go to your [Airtable account page](https://airtable.com/account)
2. In the API section, create a Personal Access Token with permissions to access your bases
3. Use the token in the n8n credentials for this node

## Compatibility

Tested with n8n version 1.92.2

## Usage

1. Create a new workflow
2. Add an "Airtable Webhook Trigger" node as the trigger
3. Configure the credentials
4. Select the base and table you want to monitor
5. Select fields to watch for changes
6. Select any additional fields to include in the output
7. Choose if you want to include previous values in the output
8. Select which events to trigger on (record creation and/or updates)
9. Save the workflow and activate it

The node will then trigger your workflow when the specified changes occur in your Airtable table.

### Output Format

When triggered, the node outputs data in this format:

```json
{
  "recordId": "recXXXXXXXXXXXXXX",
  "fieldChanged": "Field Name",
  "fieldChangedId": "fldXXXXXXXXXXXXXX",
  "previousValue": "Previous value (if available)",
  "currentValue": "Current value",
  "includedData": {
    "Field 1": "Value 1",
    "Field 2": "Value 2"
  }
}
```

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Airtable API documentation](https://airtable.com/developers/web/api/introduction)
* [Airtable webhooks documentation](https://airtable.com/developers/web/api/webhooks)

## Version history

### 0.1.0

- Initial release
