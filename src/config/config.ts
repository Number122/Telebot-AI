import { cleanEnv, str } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export default cleanEnv(process.env, {
    TELEGRAM_APP_ID: str(),
    TELEGRAM_API_HASH: str(),
    TELEGRAM_SESSION: str()
}); 