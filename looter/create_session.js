// The following line should be `import {...} from 'steam-session';` if installed from npm
const SteamUser = require('steam-user');
const {
    EAuthSessionGuardType,
    EAuthTokenPlatformType,
    LoginSession
} = require('steam-session');
const { generateAuthCode } = require('steam-totp');
const pkg = require('@doctormckay/stdlib');
const args = process.argv;
if(args.length <= 2) process.exit(0);

const account = args[2].split(':');
const [accountName, password, code] = account;

(async () => {
	let session = new LoginSession(EAuthTokenPlatformType.WebBrowser);
	let startResult = await session.startWithCredentials({
		accountName,
		password,
	});

	if (startResult.actionRequired && startResult.validActions.some(action => action.type === EAuthSessionGuardType.DeviceCode)) {
		try {
			//let code = generateAuthCode(sharedSecret);
			await session.submitSteamGuardCode(code);
		} catch (ex) {
			console.log(`ERROR`);
			process.exit(1);
		}
	} else if (startResult.actionRequired) {
		throw new Error('Login action is required, but we don\'t know how to handle it');
	}

	session.on('authenticated', async () => {
		console.log(`Successfully logged in as ${session.accountName}`);
		let webCookies = await session.getWebCookies();
		const cookieString = webCookies.join('; ');
		webCookies.forEach(element => {
			console.log(element);
		});
		process.exit(1);
	});

	session.on('timeout', () => {
		console.log('This login attempt has timed out.');
		process.exit(1);
	});

	session.on('error', (err) => {
		// This should ordinarily not happen. This only happens in case there's some kind of unexpected error while
		// polling, e.g. the network connection goes down or Steam chokes on something.
		console.log(`ERROR`);
		process.exit(1);
	});
})();