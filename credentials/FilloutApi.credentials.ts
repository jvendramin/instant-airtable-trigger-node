import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FilloutApi implements ICredentialType {
	name = 'filloutApi';
	displayName = 'Fillout API';
	documentationUrl = 'https://www.fillout.com/help/api-documentation';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Fillout API key. You can find this in your account settings.',
		},
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://api.fillout.com',
			required: true,
			description: 'The URL of the Fillout API. No need to change this.',
		},
	];
}