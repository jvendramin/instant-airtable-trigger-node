/* eslint-disable n8n-nodes-base/node-execute-block-wrong-error-thrown */
import {
	IHookFunctions,
	IWebhookFunctions,
	ILoadOptionsFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeApiError,
	JsonObject,
	NodeConnectionType,
} from 'n8n-workflow';

export class FilloutTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fillout Trigger',
		name: 'filloutTrigger',
		icon: 'file:fillout.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when a Fillout form is submitted',
		defaults: {
			name: 'Fillout Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'filloutApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Form',
				name: 'formId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getForms',
				},
				default: '',
				required: true,
				description: 'The Fillout form that will trigger this workflow when a submission is received',
			},
		],
	};

	methods = {
		loadOptions: {
			async getForms(this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('filloutApi');

				try {
					// Get forms from Fillout API
					const response = await this.helpers.request({
						method: 'GET',
						url: `${credentials.apiUrl}/v1/api/forms`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});

					const forms = response as Array<{ formId: string; name: string }>;

					return forms.map(form => ({
						name: form.name,
						value: form.formId,
					}));
				} catch (error) {
					console.error('[Fillout Trigger] Error loading forms:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},
		},
	};

	// Use webhookMethods like in the Airtable Trigger example
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId === undefined) {
					return false;
				}

				// We don't have a specific webhook lookup endpoint in Fillout API
				// So we'll just assume if we have a webhookId, it exists
				return true;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const formId = this.getNodeParameter('formId') as string;
				const credentials = await this.getCredentials('filloutApi');

				try {
					const response = await this.helpers.request({
						method: 'POST',
						url: `${credentials.apiUrl}/v1/api/webhook/create`,
						body: {
							formId,
							url: webhookUrl,
						},
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
						json: true,
					});

					if (!response || !response.id) {
						throw new Error(`Failed to create webhook for form ${formId}. Response: ${JSON.stringify(response)}`);
					}

					// Store webhook ID and form ID to use for deactivation
					webhookData.webhookId = response.id;
					webhookData.formId = formId;

					return true;
				} catch (error) {
					console.error('[Fillout Trigger] Error creating webhook:', error);
					throw error;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const credentials = await this.getCredentials('filloutApi');

				if (webhookData.webhookId === undefined) {
					return false;
				}

				const webhookId = webhookData.webhookId as string;

				try {
					// Delete the webhook using the Fillout API
					const response = await this.helpers.request({
						method: 'POST',
						url: `${credentials.apiUrl}/v1/api/webhook/delete`,
						body: {
							webhookId,
						},
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
						json: true,
					});

					console.log('[Fillout Trigger] Deleted webhook:', response);

					// Clean up the static data
					delete webhookData.webhookId;
					delete webhookData.formId;

					return true;
				} catch (error) {
					console.error('[Fillout Trigger] Error deleting webhook:', error);
					return false;
				}
			},
		},
	};

	// This method processes webhook data when received
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		try {
			// Get the raw webhook data
			let bodyData = this.getBodyData();

			// If the data is a string, try to parse it as JSON
			if (typeof bodyData === 'string') {
				try {
					bodyData = JSON.parse(bodyData);
				} catch (e) {
					// Could not parse string as JSON, using as is
				}
			}

			// Ensure we're working with an object (not a string)
			const processedData = (typeof bodyData === 'object') ? bodyData : { rawData: bodyData };

			// Return the data as a proper object for the workflow
			return {
				workflowData: [
					this.helpers.returnJsonArray([processedData]),
				],
			};
		} catch (error) {
			console.error('[Fillout Trigger] Error processing webhook data:', error);

			// Even on error, return something usable
			return {
				workflowData: [
					this.helpers.returnJsonArray([{ error: 'Error processing webhook data' }]),
				],
			};
		}
	}
}
