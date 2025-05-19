import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FilloutApi implements ICredentialType {
	name = 'filloutApi';
	displayName = 'Fillout API';
	documentationUrl = 'https://fillout.com/help/api-quickstart';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Generate an API key in the Developer settings tab of your Fillout account',
		},
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://api.fillout.com',
			description: 'The URL of the Fillout API',
		},
	];
	
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}