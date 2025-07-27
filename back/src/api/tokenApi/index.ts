/**
 * IMPORTANT: Obviously, this code should not be used in production.
 *
 * This is mostly temporary and should eventually be replaced by a socket-based system to forward the
 * EventSub events to the frontend.
 */
import { promises as fs } from 'fs';
import { AccessToken } from '@twurple/auth';

const BASE_TOKEN_PATH = './tokens';

const getUserToken = async (userId: string) => (
    await fs.readFile(`${BASE_TOKEN_PATH}/tokens.${userId}.json`, 'utf-8')
        .then(data => JSON.parse(data) as AccessToken)
        // .then(data => data)
        .catch(() => {
            console.warn(`No token found for user ${userId}`);
            console.warn(`Expected path: ${BASE_TOKEN_PATH}/tokens.${userId}.json`);
            return null;
        })
);

const setUserToken = async (userId: string, token: AccessToken): Promise<boolean> => {
    console.log(`Setting token for user ${userId}`);
    console.log(`Token: ${JSON.stringify(token)}`);
    try {
        await fs.writeFile(`${BASE_TOKEN_PATH}/tokens.${userId}.json`, JSON.stringify(token));
        return true;
    } catch (error) {
        console.error(`Failed to write token for user ${userId}:`, error);
        return false;
    }
};

export const tokenApi = {
  getUserToken,
  setUserToken
};
