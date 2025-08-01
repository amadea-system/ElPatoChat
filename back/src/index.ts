import cors from 'cors';
import express from 'express';
import { ApiHandler } from './apiHandler';
import 'dotenv/config';
import { EmoteConfiguration } from './types';
const PORT = parseInt(process.env['SERVER_PORT'] ?? '8080');

const patoApi = express();
const apiHandler = new ApiHandler();

patoApi.use(cors());

patoApi.use((req, res, next) => {
  console.log(`${new Date().toDateString()}: [${req.method}] - ${req.url}`);
  res.setHeader('content-type', 'application/json');
  next();
});

patoApi.get('/:channelId/badge', async (req, res) => {
  const resp = await apiHandler.onGetChannelBadge(req.params.channelId);
  res.status(resp.status).send(resp.body);
});

patoApi.get('/badge', async (_, res) => {
  const resp = await apiHandler.onGetGlobalBadges();
  res.status(resp.status).send(resp.body);
});

patoApi.get('/users/:userName', async (req, res) => {
  const resp = await apiHandler.onGetUserInformation(req.params.userName);
  res.status(resp.status).send(resp.body);
});

patoApi.get('/:channelId/emotes', async (req, res) => {
  const emoteConfig:EmoteConfiguration = {
    betterTTV: req.query['betterTTV'] === 'true',
    frankerFace: req.query['frankerFace'] === 'true',
    sevenTV: req.query['sevenTV'] === 'true',
  }

  const resp = await apiHandler.getEmotes(req.params.channelId, emoteConfig);
  res.status(resp.status).send(resp.body);
});

/**
 * IMPORTANT: Obviously, this code should not be used in production.
 *
 * This is mostly temporary and should eventually be replaced by a socket-based system to forward the
 * EventSub events to the frontend.
 */
patoApi.get('/token/:userId', async (req, res) => {
  const resp = await apiHandler.onGetUserToken(req.params.userId);
  res.status(resp.status).send(resp.body);
});

/**
 * IMPORTANT: Obviously, this code should not be used in production.
 *
 * This is mostly temporary and should eventually be replaced by a socket-based system to forward the
 * EventSub events to the frontend.
 */
patoApi.post('/token/:userId', express.json(), async (req, res) => {
  // console.warn('POST /token/:userId is not implemented yet');
  console.warn('Request parameters:', req.params);
  console.warn('Request body:', req.body);
  // res.status(501).send({ error: 'Not implemented' });
  const resp = await apiHandler.onSetUserToken(req.params.userId, req.body);
  res.status(resp.status).send(resp.body);
});

patoApi.listen(PORT, 'localhost', () => {
  console.log(`Started server at http://localhost:${PORT}`)
});