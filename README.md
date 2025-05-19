# Fillout for N8N by vwork Digital

These are n8n community nodes for triggering workflows based on Fillout submissions, and interacting with your Fillout forms directly in N8N.

This node was created by Jacob @ vwork Digital. **These nodes are NOT affiliated with Fillout in anyway**. Please see [Node Feedback](#node-feedback) for how to submit feedback or issues about these nodes.

Need implementation help for your business? Want more n8n or no-code/low-code resources? Visit our website now! Don't forget to subscribe to our newsletter.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Node Feedback](#node-feedback)
[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)

## Node Feedback
Please [submit feedback to us](https://vform.fillout.com/fillout-n8n-node-feedback) if you have any ideas to improve this node, or experience a bug.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Trigger Node - Fillout Trigger

The trigger node allows you to start workflows when a form is submitted in Fillout.

### Action Node - Fillout

The action node allows you to perform various operations with Fillout:

**Form Operations:**
- Get all forms
- Get form metadata (including questions)

**Submission Operations:**
- Get all submissions for a form
- Get a specific submission
- Create a submission
- Delete a submission

## Credentials

You need a Fillout API key to use these nodes:

1. Log in to your Fillout account
2. Go to your Account Settings
3. Navigate to the Developer section
4. Generate an API key
5. Use this key in the n8n credentials for the Fillout nodes

## Compatibility

Tested with n8n version 1.92.2

## Usage

### Trigger Node

1. Create a new workflow
2. Add a "Fillout Trigger" node as the trigger
3. Configure your Fillout API credentials
4. Select the form you want to monitor for submissions
5. Optionally select a previous submission to use for testing
6. Save and activate the workflow

The node will then trigger your workflow when the form is submitted.

### Action Node

1. Add the "Fillout" node to your workflow
2. Configure your Fillout API credentials
3. Select the resource and operation you want to perform
4. Fill in the required parameters
5. Execute the node

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Fillout API documentation](https://www.fillout.com/help/api-documentation)

## Version history

### 1.0.0

- Initial release
- Added Fillout Trigger node for form submission webhooks
- Added Fillout Action node for forms and submissions management