import { ApiResponse } from '../ApiResponse';
import { Badge, CustomEmote, UserInformation } from './types';
import { AccessToken } from '@twurple/auth';

// const BASE_URL = import.meta.env?.VITE_BACKEND_URL || 'https://api.elpato.dev/ChatApi/';
const BASE_URL = import.meta.env?.VITE_BACKEND_URL;
if (!BASE_URL) {
  throw new Error('VITE_BACKEND_URL is not defined. Please set it in your environment variables.');
}

const getEmotes = async (channelId: string, 
  isBetterTTVEnabled: boolean,
  isFrankerTTEnabled: boolean,
  isSevenTVEnabled: boolean
):Promise<ApiResponse<Array<CustomEmote>>> => {
  return await fetchApi(`${BASE_URL}${channelId}/emotes?betterTTV=${isBetterTTVEnabled}&frankerFace=${isFrankerTTEnabled}&sevenTV=${isSevenTVEnabled}`);
};

const getGlobalBadges = async ():Promise<ApiResponse<Array<Badge>>> => (
  fetchApi(BASE_URL + 'badge')
);

const getChannelBadges = async (channelId: string):Promise<ApiResponse<Array<Badge>>> => (
  fetchApi(`${BASE_URL}${channelId}/badge`)
);

const getUserDetails = async (userName: string):Promise<ApiResponse<UserInformation>> => (
  fetchApi(`${BASE_URL}users/${userName}`)
);

/**
 * IMPORTANT: Obviously, this code should not be used in production.
 *
 * This is mostly temporary and should eventually be replaced by a socket-based system to forward the
 * EventSub events to the frontend.
 */
const getUserToken = async (userId: string):Promise<ApiResponse<AccessToken>> => (
  fetchApi(`${BASE_URL}token/${userId}`)
);

/**
 * IMPORTANT: Obviously, this code should not be used in production.
 *
 * This is mostly temporary and should eventually be replaced by a socket-based system to forward the
 * EventSub events to the frontend.
 */
const setUserToken = async (userId: string, token: AccessToken):Promise<ApiResponse<boolean>> => (
  pushApi(`${BASE_URL}token/${userId}`, token)
);

const fetchApi = async <T>(url:string):Promise<ApiResponse<T>> => {
  const resp = await fetch(url, {
    headers: new Headers({
      'content-type': 'application/json',
    })
  });
  if (!resp.ok) {
    return {
      status: resp.status,
      hasError: true,
    };
  }

  const data = await resp.json() as T;
  return { data, status: resp.status };
};

const pushApi = async <T>(url:string, body:T):Promise<ApiResponse<boolean>> => {
  const resp = await fetch(url, {
    method: 'POST',
    headers: new Headers({
      'content-type': 'application/json',
    }),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    return {
      status: resp.status,
      hasError: true,
    };
  }

  return { data: true, status: resp.status };
};


export const elPatoApi = {
  getGlobalBadges,
  getChannelBadges,
  getUserDetails,
  getEmotes,
  getUserToken,
  setUserToken
};