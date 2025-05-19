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
						description: 'Get a submission',
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
				description: 'The submission to retrieve or delete',
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
						description: 'Status of the submissions to retrieve',
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
		],
	};

	methods = {
		loadOptions: {
			async getForms(this: ILoadOptionsFunctions) {
				console.log('[Fillout] Loading forms...');
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

					console.log(`[Fillout] Loaded ${response.length} forms`);

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
					console.log('[Fillout] No form ID selected, returning empty options');
					return [{ name: 'Please select a form first', value: '' }];
				}

				console.log(`[Fillout] Loading submissions for form ${formId}...`);

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

					console.log(`[Fillout] Loaded ${data.responses?.length || 0} submissions`);

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

		console.log(`[Fillout] Executing ${resource}.${operation}...`);

		// Implement each resource and operation
		if (resource === 'form') {
			if (operation === 'getAll') {
				console.log('[Fillout] Getting all forms...');

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

					console.log(`[Fillout] Retrieved ${response.length} forms`);

					returnData.push({ json: { forms: response } });
				} catch (error) {
					console.error('[Fillout] Error getting forms:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			} else if (operation === 'getMetadata') {
				const formId = this.getNodeParameter('formId', 0) as string;
				console.log(`[Fillout] Getting metadata for form ${formId}...`);

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

					console.log('[Fillout] Form metadata retrieved successfully');

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

				console.log(`[Fillout] Getting submissions for form ${formId}...`);

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

					console.log(`[Fillout] Retrieved ${response.responses?.length || 0} submissions`);

					returnData.push({ json: response });
				} catch (error) {
					console.error('[Fillout] Error getting submissions:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			} else if (operation === 'get') {
				const formId = this.getNodeParameter('formId', 0) as string;
				const submissionId = this.getNodeParameter('submissionId', 0) as string;

				console.log(`[Fillout] Getting submission ${submissionId} from form ${formId}...`);

				try {
					// Get single submission
					const response = await this.helpers.request({
						method: 'GET',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions/${submissionId}`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});

					console.log('[Fillout] Submission retrieved successfully:', JSON.stringify(response));

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

				console.log(`[Fillout] Creating submission for form ${formId}...`);

				try {
					// Format questions for submission
					const questions = questionValues.map(q => ({
						id: q.id,
						value: q.value,
					}));

					// Create submission
					const body = {
						submissions: [
							{
								questions,
								submissionTime: new Date().toISOString(),
							},
						],
					};

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

					console.log('[Fillout] Submission created successfully');

					returnData.push({ json: response });
				} catch (error) {
					console.error('[Fillout] Error creating submission:', error);
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			} else if (operation === 'delete') {
				const formId = this.getNodeParameter('formId', 0) as string;
				const submissionId = this.getNodeParameter('submissionId', 0) as string;

				console.log(`[Fillout] Deleting submission ${submissionId} from form ${formId}...`);

				try {
					// Delete submission
					await this.helpers.request({
						method: 'DELETE',
						url: `${credentials.apiUrl}/v1/api/forms/${formId}/submissions/${submissionId}`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
					});

					console.log('[Fillout] Submission deleted successfully');

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