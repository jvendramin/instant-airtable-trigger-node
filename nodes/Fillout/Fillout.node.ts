/* eslint-disable n8n-nodes-base/node-execute-block-wrong-error-thrown */
/* eslint-disable n8n-nodes-base/node-param-description-miscased-id */
/* eslint-disable n8n-nodes-base/node-param-description-excess-final-period */
import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	JsonObject,
	NodeConnectionType,
} from 'n8n-workflow';

export class Fillout implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fillout',
		name: 'fillout',
		icon: 'file:fillout.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Fillout API',
		defaults: {
			name: 'Fillout',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'filloutApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Form',
						value: 'form',
					},
					{
						name: 'Submission',
						value: 'submission',
					},
				],
				default: 'form',
			},
			// Operations for Form resource
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'form',
						],
					},
				},
				options: [
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get many forms',
						action: 'Get many forms',
					},
					{
						name: 'Get Metadata',
						value: 'getMetadata',
						description: 'Get form metadata and questions',
						action: 'Get form metadata',
					},
				],
				default: 'getAll',
			},
			// Operations for Submission resource
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
					},
				},
				options: [
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get many submissions',
						action: 'Get many submissions',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a submission (set to always include edit link)',
						action: 'Get a submission',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a submission',
						action: 'Create a submission',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a submission',
						action: 'Delete a submission',
					},
				],
				default: 'getAll',
			},
			// Form fields
			{
				displayName: 'Form',
				name: 'formId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getForms',
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: [
							'form',
						],
						operation: [
							'getMetadata',
						],
					},
				},
				description: 'The form to get metadata for',
			},
			// Submission fields
			{
				displayName: 'Form',
				name: 'formId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getForms',
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'getAll',
							'get',
							'create',
							'delete',
						],
					},
				},
				description: 'The form to work with',
			},
			{
				displayName: 'Submission ID',
				name: 'submissionId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'get',
							'delete',
						],
					},
				},
				description: 'The submission to retrieve (set to always include edit link)',
			},
			// Get all submissions options
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				typeOptions: {
					minValue: 1
				},
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'getAll',
						],
					},
				},
			},
			// Additional filters for getAll submissions
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'getAll',
						],
					},
				},
				options: [
					{
						displayName: 'After Date',
						name: 'afterDate',
						type: 'dateTime',
						default: '',
						description: 'Filter submissions submitted after this date',
					},
					{
						displayName: 'Before Date',
						name: 'beforeDate',
						type: 'dateTime',
						default: '',
						description: 'Filter submissions submitted before this date',
					},
					{
						displayName: 'Include Edit Link',
						name: 'includeEditLink',
						type: 'boolean',
						default: false,
						description: 'Whether to include a link to edit the submission',
					},
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search text to filter submissions',
					},
					{
						displayName: 'Sort',
						name: 'sort',
						type: 'options',
						options: [
							{
								name: 'Ascending',
								value: 'asc',
							},
							{
								name: 'Descending',
								value: 'desc',
							},
						],
						default: 'asc',
						description: 'Sort order of submissions',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Finished',
								value: 'finished',
							},
							{
								name: 'In Progress',
								value: 'in_progress',
							},
						],
						default: 'finished',
						description: 'Status of the submissions to retrieve (etching in progress submissions available on business plan or higher).',
					},
				],
			},
			// Submission create fields
			{
				displayName: 'Questions',
				name: 'questions',
				placeholder: 'Add Question',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'create',
						],
					},
				},
				default: {},
				options: [
					{
						name: 'questionValues',
						displayName: 'Question',
						values: [
							{
								displayName: 'Question ID',
								name: 'id',
								type: 'string',
								default: '',
								description: 'ID of the question',
								required: true,
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value of the answer',
								required: true,
							},
						],
					},
				],
			},
			// Optional fields for submission creation
			{
				displayName: 'Submission Time',
				name: 'submissionTime',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'create',
						],
					},
				},
				description: 'The time when the submission was created',
			},
			{
				displayName: 'Last Updated At',
				name: 'lastUpdatedAt',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'create',
						],
					},
				},
				description: 'The time when the submission was last updated',
			},
			{
				displayName: 'URL Parameters',
				name: 'urlParameters',
				placeholder: 'Add URL Parameter',
				type: 'json',
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'create',
						],
					},
				},
				default: '',
				description: 'URL parameters in JSON format. Must include id, name, and value fields. Example: [{"id":"email","name":"email","value":"example@example.com"}]',
			},
			{
				displayName: 'Scheduling',
				name: 'scheduling',
				placeholder: 'Add Scheduling Details',
				type: 'json',
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'create',
						],
					},
				},
				default: '',
				description: 'Scheduling data in JSON format. Must include id and value fields. Example: [{"id":"nLJtxBJgPA","value":{"fullName":"John Smith","email":"john@smith.com","eventStartTime":"2024-05-20T09:00:00.000Z"}}]',
			},
			{
				displayName: 'Payments',
				name: 'payments',
				placeholder: 'Add Payment Details',
				type: 'json',
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'create',
						],
					},
				},
				default: '',
				description: 'Payment data in JSON format. Must include id and value fields. Example: [{"id":"cLJtxCKgdL","value":{"paymentId":"pi_3PRF2cFMP2ckdpfG0s0ZdJqf"}}]',
			},
			{
				displayName: 'Login',
				name: 'login',
				placeholder: 'Add Login Details',
				type: 'json',
				displayOptions: {
					show: {
						resource: [
							'submission',
						],
						operation: [
							'create',
						],
					},
				},
				default: '',
				description: 'Login data in JSON format. Must contain email field. Example: {"email":"verified@email.com"}',
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
					console.error('[Fillout] Error loading forms:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},

			async getSubmissions(this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('filloutApi');
				const formId = this.getCurrentNodeParameter('formId') as string;

				if (!formId) {
					return [{ name: 'Please select a form first', value: '' }];
				}

				try {
					// Get submissions from Fillout API
					const response = await this.helpers.request({
						method: 'GET',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions`,
						qs: {
							sort: 'desc',
							limit: 50, // Limit to 50 submissions to keep the dropdown manageable
						},
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});

					const data = response as { responses: Array<{ submissionId: string; submissionTime: string }> };

					if (!data.responses || !data.responses.length) {
						return [{ name: 'No submissions found', value: '' }];
					}

					return data.responses.map(submission => ({
						name: `Submission from ${new Date(submission.submissionTime).toLocaleString()}`,
						value: submission.submissionId,
					}));
				} catch (error) {
					console.error('[Fillout] Error loading submissions:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('filloutApi');
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Implement each resource and operation
		if (resource === 'form') {
			if (operation === 'getAll') {
				try {
					// Get all forms
					const response = await this.helpers.request({
						method: 'GET',
						url: `${credentials.apiUrl}/v1/api/forms`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});

					returnData.push({ json: { forms: response } });
				} catch (error) {
					console.error('[Fillout] Error getting forms:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			} else if (operation === 'getMetadata') {
				const formId = this.getNodeParameter('formId', 0) as string;

				try {
					// Get form metadata
					const response = await this.helpers.request({
						method: 'GET',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});

					returnData.push({ json: response });
				} catch (error) {
					console.error('[Fillout] Error getting form metadata:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			}
		} else if (resource === 'submission') {
			if (operation === 'getAll') {
				const formId = this.getNodeParameter('formId', 0) as string;
				const limit = this.getNodeParameter('limit', 0) as number;
				const additionalOptions = this.getNodeParameter('additionalOptions', 0, {}) as {
					afterDate?: string;
					beforeDate?: string;
					status?: string;
					includeEditLink?: boolean;
					sort?: string;
					search?: string;
				};

				try {
					// Set up query parameters
					const qs: any = { limit };

					if (additionalOptions.afterDate) {
						qs.afterDate = additionalOptions.afterDate;
					}

					if (additionalOptions.beforeDate) {
						qs.beforeDate = additionalOptions.beforeDate;
					}

					if (additionalOptions.status) {
						qs.status = additionalOptions.status;
					}

					if (additionalOptions.includeEditLink) {
						qs.includeEditLink = additionalOptions.includeEditLink;
					}

					if (additionalOptions.sort) {
						qs.sort = additionalOptions.sort;
					}

					if (additionalOptions.search) {
						qs.search = additionalOptions.search;
					}

					// Get submissions
					const response = await this.helpers.request({
						method: 'GET',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions`,
						qs,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});

					returnData.push({ json: response });
				} catch (error) {
					console.error('[Fillout] Error getting submissions:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			} else if (operation === 'get') {
				const formId = this.getNodeParameter('formId', 0) as string;
				const submissionId = this.getNodeParameter('submissionId', 0) as string;

				try {
					// Get single submission
					const response = await this.helpers.request({
						method: 'GET',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions/${submissionId}?includeEditLink=true`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});

					// Return the submission directly - this ensures we just output the JSON
					returnData.push({ json: response });
				} catch (error) {
					console.error('[Fillout] Error getting submission:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			} else if (operation === 'create') {
				const formId = this.getNodeParameter('formId', 0) as string;
				const questionValues = this.getNodeParameter('questions.questionValues', 0, []) as Array<{
					id: string;
					value: string;
				}>;

				// Get the optional fields
				const submissionTime = this.getNodeParameter('submissionTime', 0, '') as string;
				const lastUpdatedAt = this.getNodeParameter('lastUpdatedAt', 0, '') as string;

				// Get JSON fields
				let urlParameters: Array<{id: string; name: string; value: string}> = [];
				let scheduling: Array<{id: string; value: object}> = [];
				let payments: Array<{id: string; value: object}> = [];
				let login: {email: string} | null = null;

				try {
					const urlParametersJson = this.getNodeParameter('urlParameters', 0, '') as string;
					if (urlParametersJson) {
						urlParameters = JSON.parse(urlParametersJson);
						console.log('[Fillout] URL Parameters:', urlParameters);

						// Validate structure
						if (!Array.isArray(urlParameters)) {
							throw new NodeApiError(this.getNode(), {
								message: 'URL Parameters must be an array',
							} as JsonObject);
						}

						// Validate each item in the array
						for (const param of urlParameters) {
							if (!param.id || !param.name || !param.value) {
								throw new NodeApiError(this.getNode(), {
									message: 'Each URL Parameter must have id, name, and value fields',
								} as JsonObject);
							}
						}
					}
				} catch (error) {
					console.error('[Fillout] Error parsing URL Parameters JSON:', error);
					throw new NodeApiError(this.getNode(), {
						message: 'Invalid URL Parameters JSON format',
						description: 'Please provide a valid JSON array with each item containing id, name, and value fields. Example: [{"id":"email","name":"email","value":"example@example.com"}]',
					} as JsonObject);
				}

				try {
					const schedulingJson = this.getNodeParameter('scheduling', 0, '') as string;
					if (schedulingJson) {
						scheduling = JSON.parse(schedulingJson);
						console.log('[Fillout] Scheduling:', scheduling);

						// Validate structure
						if (!Array.isArray(scheduling)) {
							throw new NodeApiError(this.getNode(), {
								message: 'Scheduling must be an array',
							} as JsonObject);
						}

						// Validate each item in the array
						for (const item of scheduling) {
							if (!item.id || !item.value || typeof item.value !== 'object') {
								throw new NodeApiError(this.getNode(), {
									message: 'Each scheduling item must have id and value (object) fields',
								} as JsonObject);
							}
						}
					}
				} catch (error) {
					console.error('[Fillout] Error parsing Scheduling JSON:', error);
					throw new NodeApiError(this.getNode(), {
						message: 'Invalid Scheduling JSON format',
						description: 'Please provide a valid JSON array with each item containing id and value fields. Example: [{"id":"nLJtxBJgPA","value":{"fullName":"John Smith","email":"john@smith.com"}}]',
					} as JsonObject);
				}

				try {
					const paymentsJson = this.getNodeParameter('payments', 0, '') as string;
					if (paymentsJson) {
						payments = JSON.parse(paymentsJson);
						console.log('[Fillout] Payments:', payments);

						// Validate structure
						if (!Array.isArray(payments)) {
							throw new Error('Payments must be an array');
						}

						// Validate each item in the array
						for (const item of payments) {
							if (!item.id || !item.value || typeof item.value !== 'object') {
								throw new Error('Each payment item must have id and value (object) fields');
							}

							// Verify paymentId exists in value
							if (!(item.value as any).paymentId) {
								throw new Error('Payment value must contain paymentId field');
							}
						}
					}
				} catch (error) {
					console.error('[Fillout] Error parsing Payments JSON:', error);
					throw new NodeApiError(this.getNode(), {
						message: 'Invalid Payments JSON format',
						description: 'Please provide a valid JSON array with each item containing id and value fields. The value object must contain paymentId. Example: [{"id":"cLJtxCKgdL","value":{"paymentId":"pi_3PRF2cFMP2ckdpfG0s0ZdJqf"}}]',
					} as JsonObject);
				}

				try {
					const loginJson = this.getNodeParameter('login', 0, '') as string;
					if (loginJson) {
						login = JSON.parse(loginJson);
						console.log('[Fillout] Login:', login);

						// Validate structure
						if (typeof login !== 'object' || login === null) {
							throw new Error('Login must be an object');
						}

						// Verify email exists
						if (!login.email || typeof login.email !== 'string') {
							throw new Error('Login object must contain email field as a string');
						}
					}
				} catch (error) {
					console.error('[Fillout] Error parsing Login JSON:', error);
					throw new NodeApiError(this.getNode(), {
						message: 'Invalid Login JSON format',
						description: 'Please provide a valid JSON object with an email field. Example: {"email":"verified@email.com"}',
					} as JsonObject);
				}

				try {
					// Format questions for submission
					const questions = questionValues.map(q => ({
						id: q.id,
						value: q.value,
					}));

					// Create the submission object
					const submissionObj: any = {
						questions,
					};

					// Add optional fields if present
					if (submissionTime) {
						submissionObj.submissionTime = submissionTime;
					} else {
						// Default to current time if not provided
						submissionObj.submissionTime = new Date().toISOString();
					}

					if (lastUpdatedAt) {
						submissionObj.lastUpdatedAt = lastUpdatedAt;
					}

					if (urlParameters.length > 0) {
						submissionObj.urlParameters = urlParameters;
					}

					if (scheduling.length > 0) {
						submissionObj.scheduling = scheduling;
					}

					if (payments.length > 0) {
						submissionObj.payments = payments;
					}

					if (login) {
						submissionObj.login = login;
					}

					// Create submission
					const body = {
						submissions: [submissionObj],
					};

					console.log('[Fillout] Creating submission with body:', JSON.stringify(body, null, 2));

					const response = await this.helpers.request({
						method: 'POST',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions`,
						body,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
						json: true,
					});

					returnData.push({ json: response });
				} catch (error) {
					console.error('[Fillout] Error creating submission:', error);

					// Log more details about the error
					if (error.response) {
						console.error('[Fillout] Error response data:', JSON.stringify(error.response.data));
						console.error('[Fillout] Error response status:', error.response.status);
						console.error('[Fillout] Error response headers:', JSON.stringify(error.response.headers));
					}

					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			} else if (operation === 'delete') {
				const formId = this.getNodeParameter('formId', 0) as string;
				const submissionId = this.getNodeParameter('submissionId', 0) as string;

				try {
					// Delete submission
					await this.helpers.request({
						method: 'DELETE',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions/${submissionId}`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
					});

					returnData.push({
						json: {
							success: true,
							message: `Submission ${submissionId} deleted successfully`,
						},
					});
				} catch (error) {
					console.error('[Fillout] Error deleting submission:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			}
		}

		return [returnData];
	}
}
