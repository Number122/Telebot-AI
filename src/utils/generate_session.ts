import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import input from 'input';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const apiId = process.env.TELEGRAM_APP_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;

    if (!apiId || !apiHash) {
        console.error('Please set TELEGRAM_APP_ID and TELEGRAM_API_HASH in your .env file first');
        console.log('You can get these from https://my.telegram.org/apps');
        process.exit(1);
    }

    const stringSession = new StringSession('');
    const client = new TelegramClient(
        stringSession,
        parseInt(apiId),
        apiHash,
        { connectionRetries: 5 }
    );

    try {
        await client.start({
            phoneNumber: async () => {
                const result = await Promise.resolve(input.text('Please enter your phone number: '));
                return result;
            },
            password: async () => {
                const result = await Promise.resolve(input.text('Please enter your password: '));
                return result;
            },
            phoneCode: async () => {
                const result = await Promise.resolve(input.text('Please enter the code you received: '));
                return result;
            },
            onError: (err) => console.log(err),
        });

        console.log('Login successful!');
        
        // Get the session string
        const session = stringSession.save();
        console.log('\nYour session string (save this to your .env file as TELEGRAM_SESSION):');
        console.log(session);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await client.disconnect();
        process.exit(0);
    }
}

main().catch(console.error); 