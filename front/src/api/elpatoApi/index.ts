import { ApiResponse } from '../ApiResponse';
import { Badge, CustomEmote, UserInformation } from './types';

// TODO: Move to an environment variable
// const BASE_URL = 'https://api.niv3kelpato.com/api/';
const BASE_URL = 'http://localhost:6042/';

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

export const elPatoApi = {
  getGlobalBadges,
  getChannelBadges,
  getUserDetails,
  getEmotes
};