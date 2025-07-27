import { get7TVEmotes } from "../api/7tvApi";
import { betterTTVApi } from "../api/betterTTVApi";
import { getFrankerEmotes } from "../api/frankerfacezApi";
import { twitchApi } from "../api/twitchApi";
import { ElPatoApiResponse, ElPatoEmote, EmoteConfiguration, TwitchBadgeResponse, UserInformation } from "../types";
import { tokenApi } from "../api/tokenApi";
import { AccessToken } from "@twurple/auth";
import { escapeEmoteCode } from "../utils/escapeString";

export class ApiHandler {
  private _appToken: string | null = null;

  constructor() {
    this.authenticateApp();
  }

  private authenticateApp = async () => {
    const resp = await twitchApi.getAppToken();
    if (resp.data) {
      this._appToken = resp.data.access_token;
      return resp.data.access_token;
    }
    console.error(`Failed to authenticate`);
  };

  /**
   * IMPORTANT: Obviously, this code should not be used in production.
   *
   * This is mostly temporary and should eventually be replaced by a socket-based system to forward the
   * EventSub events to the frontend.
   */
  public onGetUserToken = async (userId: string): Promise<ElPatoApiResponse<AccessToken>> => {

    const token = await tokenApi.getUserToken(userId);

    if (token) {
      return {
        status: 200,
        body: token
      };
    }
    return { status: 404 };
  }

  /**
   * IMPORTANT: Obviously, this code should not be used in production.
   *
   * This is mostly temporary and should eventually be replaced by a socket-based system to forward the
   * EventSub events to the frontend.
   */
  public onSetUserToken = async (userId: string, token: AccessToken): Promise<ElPatoApiResponse<boolean>> => {
    const resp = await tokenApi.setUserToken(userId, token);
    if (resp) {
      return {
        status: 200,
        body: resp
      };
    }
    return { status: 500 };
  }

  public onGetGlobalBadges = async ():Promise<ElPatoApiResponse<TwitchBadgeResponse['data']>> => {
    if (!this._appToken) return { status: 500 };

    const resp = await twitchApi.getGlobalBadges(this._appToken);

    if (resp.data) return {
      status: 200,
      body: resp.data.data
    }

    if (resp.error?.status === 403 || resp.error?.status === 401) {
      const newToken = await this.authenticateApp();
      if (newToken) {
        return await this.onGetGlobalBadges();
      }
      return { status: 500 };
    }

    return {
      status: resp.error?.status ?? 500,
    }
  }

  public onGetChannelBadge = async (channelId: string): Promise<ElPatoApiResponse<TwitchBadgeResponse['data']>> => {
    if (!this._appToken) return { status: 500 };

    const resp = await twitchApi.getChannelBadges(channelId, this._appToken);
    if (resp.data) return {
      status: 200,
      body: resp.data.data
    }

    if (resp.error?.status === 403 || resp.error?.status === 401) {
      const newToken = await this.authenticateApp();
      if (newToken) {
        return await this.onGetChannelBadge(channelId);
      }
      return { status: 500 };
    }

    return {
      status: resp.error?.status ?? 500,
    }
  }

  public onGetUserInformation = async (userName: string): Promise<ElPatoApiResponse<UserInformation>> => {
    if (!this._appToken) return { status: 500 };

    const resp = await twitchApi.getUserInformation(userName, this._appToken);

    if (resp.data) {
      const foundUser = resp.data.data.find((item) => item.login === userName.toLowerCase());
      if (!foundUser) return { status: 404 };
      return {
        status: 200,
        body: foundUser
      };
    }

    if (resp.error?.status === 403 || resp.error?.status === 401) {
      const newToken = await this.authenticateApp();
      if (newToken) {
        return await this.onGetUserInformation(userName);
      }
      return { status: 500 };
    }

    return {
      status: resp.error?.status ?? 500,
    }
  }

  public getEmotes = async (channelId: string, emoteConfig: EmoteConfiguration): Promise<ElPatoApiResponse<Array<ElPatoEmote>>> => {
    let patoEmotes:Array<ElPatoEmote> = [];

    if (emoteConfig.betterTTV) {
        patoEmotes = patoEmotes.concat(await getBetterTTVEmotes(channelId));
    }

    if (emoteConfig.sevenTV) {
      patoEmotes = patoEmotes.concat(await get7TVEmotes(channelId));
    }

    if (emoteConfig.frankerFace) {
      patoEmotes = patoEmotes.concat(await getFrankerEmotes(channelId));
    }

    return { status: 200, body: patoEmotes };
  }
}

const getBetterTTVEmotes = async (channelId: string) => {
  try {
    const globalEmotes = await betterTTVApi.getGlobalEmotes();
    const userEmotes = await betterTTVApi.getUserEmotes(channelId);

    if (!globalEmotes.data) return [];
    let patoEmotes:Array<ElPatoEmote> = globalEmotes.data.map((emote) => ({
      id: emote.id,
      type: 'BetterTTV',
      code: emote.code,
      escapedCode: escapeEmoteCode(emote.code),
      animated: emote.animated,
      url1x: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
      url2x: `https://cdn.betterttv.net/emote/${emote.id}/2x`,
      url3x: `https://cdn.betterttv.net/emote/${emote.id}/3x`
    }));

    if (userEmotes.data) {
      patoEmotes = patoEmotes.concat(userEmotes.data.sharedEmotes.map((emote) => ({
        id: emote.id,
        type: 'BetterTTV',
        animated: emote.animated,
        code: emote.code,
        escapedCode: escapeEmoteCode(emote.code),
        url1x: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
        url2x: `https://cdn.betterttv.net/emote/${emote.id}/2x`,
        url3x: `https://cdn.betterttv.net/emote/${emote.id}/3x`
      })));

      patoEmotes = patoEmotes.concat(userEmotes.data.channelEmotes.map((emote) => ({
        id: emote.id,
        type: 'BetterTTV',
        animated: emote.animated,
        code: emote.code,
        escapedCode: escapeEmoteCode(emote.code),
        url1x: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
        url2x: `https://cdn.betterttv.net/emote/${emote.id}/2x`,
        url3x: `https://cdn.betterttv.net/emote/${emote.id}/3x`
      })));
    }
    return patoEmotes;
  } catch (e) {
    return []
  }
}