import {
	IHookFunctions,
	IWebhookFunctions,
	ILoadOptionsFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
	NodeApiError,
	ITriggerFunctions,
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
				displayName: 'Select Form to Trigger Workflow',
				name: 'formId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getForms',
				},
				default: '',
				required: true,
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Test With Previous Submission',
				name: 'submissionId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['formId'],
					loadOptionsMethod: 'getSubmissions',
				},
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Hitting test step button will output the data for the selected submission.',
			},
			// Hidden field to store webhook ID - using a different approach than displayOptions
			{
				displayName: 'Webhook ID',
				name: 'webhookId',
				type: 'hidden',
				default: '',
			},
		],
	};

	methods = {
		loadOptions: {
			async getForms(this: ILoadOptionsFunctions) {
				console.log('[Fillout Trigger] Loading forms...');
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

					console.log(`[Fillout Trigger] Loaded ${response.length} forms`);

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

			async getSubmissions(this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('filloutApi');
				const formId = this.getCurrentNodeParameter('formId') as string;

				if (!formId) {
					console.log('[Fillout Trigger] No form ID selected, returning empty options');
					return [{ name: 'Please Select a Form First', value: '' }];
				}

				console.log(`[Fillout Trigger] Loading submissions for form ${formId}...`);

				try {
					// Get submissions from Fillout API
					const response = await this.helpers.request({
						method: 'GET',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions`,
						qs: {
							sort: 'desc',
							includeEditLink: true,
							limit: 50, // Limit to 50 submissions to keep the dropdown manageable
						},
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});

					const data = response as { responses: Array<{ submissionId: string; submissionTime: string }> };

					console.log(`[Fillout Trigger] Loaded ${data.responses?.length || 0} submissions`);

					if (!data.responses || !data.responses.length) {
						return [{ name: 'No Previous Submissions Found', value: '' }];
					}

					return data.responses.map(submission => ({
						name: `Submission from ${new Date(submission.submissionTime).toLocaleString()}`,
						value: submission.submissionId,
					}));
				} catch (error) {
					console.error('[Fillout Trigger] Error loading submissions:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},
		},
	};

	// This method will be called when the node is initialized
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;
		console.log('[Fillout Trigger] Webhook received:', JSON.stringify(bodyData));
		return {
			workflowData: [
				this.helpers.returnJsonArray(bodyData),
			],
		};
	}

	// This method will be called when the workflow is activated or for testing
	async activate(this: IHookFunctions) {
		const credentials = await this.getCredentials('filloutApi');
		const formId = this.getNodeParameter('formId') as string;
		const webhookUrl = this.getNodeWebhookUrl('default');

		console.log(`[Fillout Trigger] Activating with Form ID: ${formId}`);
		console.log(`[Fillout Trigger] Webhook URL: ${webhookUrl}`);

		// Create webhook in Fillout
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

			console.log(`[Fillout Trigger] Webhook created with ID: ${response.id}`);

			// Store webhook ID to use for deactivation
			// The proper way to store this depends on n8n version
			// In newer n8n versions, we need to use a different approach
			const webhookData = this.getWorkflowStaticData('node');
			webhookData.webhookId = response.id.toString();
			console.log(`[Fillout Trigger] Stored webhook ID: ${response.id} in workflow static data`);
		} catch (error) {
			console.error('[Fillout Trigger] Error creating webhook:', error);
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	// This method will be called when the node is manually tested
	async trigger(this: ITriggerFunctions) {
		const credentials = await this.getCredentials('filloutApi');
		const formId = this.getNodeParameter('formId') as string;
		const submissionId = this.getNodeParameter('submissionId', '') as string;

		console.log(`[Fillout Trigger] Testing with Form ID: ${formId}`);

		try {
			// If we have a submission ID, use it for testing
			if (submissionId) {
				console.log(`[Fillout Trigger] Using submission: ${submissionId} for testing`);

				const responseData = await this.helpers.request({
					method: 'GET',
					url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions/${submissionId}`,
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
					},
					json: true,
				});

				console.log('[Fillout Trigger] Test submission loaded successfully', responseData.submission?.submissionId);

				// Update to match expected ITriggerResponse format in n8n 1.92.2
				// We need to return undefined for ITriggerResponse per interface
				return undefined;
			} else {
				console.log('[Fillout Trigger] No test submission selected, returning empty data');

				// Return undefined for ITriggerResponse in n8n 1.92.2
				return undefined;
			}
		} catch (error) {
			console.error('[Fillout Trigger] Error in trigger function:', error);
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	// This method will be called when the workflow is deactivated
	async deactivate(this: IHookFunctions) {
		const credentials = await this.getCredentials('filloutApi');
		const webhookData = this.getWorkflowStaticData('node');
		const webhookId = webhookData.webhookId as string;

		if (webhookId) {
			console.log(`[Fillout Trigger] Deactivating webhook: ${webhookId}`);

			try {
				await this.helpers.request({
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

				console.log('[Fillout Trigger] Webhook removed successfully');
			} catch (error) {
				console.error('[Fillout Trigger] Error removing webhook:', error);
				// Don't throw here, as we want to clean up even if there's an error
			}
		} else {
			console.log('[Fillout Trigger] No webhook ID found, skipping deactivation');
		}
	}
}