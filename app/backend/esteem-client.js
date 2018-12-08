import axios from 'axios';
import { BACKEND_URL, SEARCH_API_URL, SEARCH_API_TOKEN } from '../config';

export const search = (q, sort, scrollId) =>
  axios.post(
    SEARCH_API_URL,
    {
      q,
      sort,
      scroll_id: scrollId
    },
    {
      headers: {
        Authorization: SEARCH_API_TOKEN
      }
    }
  );

export const getCurrencyRate = cur =>
  axios
    .get(`${BACKEND_URL}/api/currencyRate/${cur.toUpperCase()}/steem`)
    .then(resp => resp.data);

export const getNodes = () =>
  axios
    .get(`https://storage.googleapis.com/esteem/public_nodes.json`)
    .then(resp => resp.data.steemd);

export const getActiveVotes = user =>
  axios.get(`${BACKEND_URL}/api/votes/${user}`).then(resp => resp.data);

export const getTopPosts = user =>
  axios.get(`${BACKEND_URL}/api/top-posts/${user}`).then(resp => resp.data);

export const getMarketData = () =>
  axios.get(`${BACKEND_URL}/api/market-data/`).then(resp => {
    let { data } = resp;

    const fakeData = {
      quotes: {
        btc: {
          price: 1,
          percent_change: 1,
          last_updated: 1
        },
        usd: {
          price: 1,
          percent_change: 1,
          last_updated: 1
        }
      }
    };

    if (data.sbd === null) {
      data = Object.assign({}, data, { sbd: fakeData });
    }

    if (data.steem === null) {
      data = Object.assign({}, data, { steem: fakeData });
    }

    return data;
  });

export const uploadImage = file => {
  const fData = new FormData();
  fData.append('postimage', file);

  return axios.post('https://img.esteem.ws/backend.php', fData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getImages = user =>
  axios.get(`${BACKEND_URL}/api/images/${user}`).then(resp => resp.data);

export const addMyImage = (user, url) =>
  axios.post(`${BACKEND_URL}/api/image`, { username: user, image_url: url });

export const removeImage = (id, user) =>
  axios.delete(`${BACKEND_URL}/api/images/${user}/${id}`);

export const getDrafts = user =>
  axios.get(`${BACKEND_URL}/api/drafts/${user}`).then(resp => resp.data);

export const removeDraft = (id, user) =>
  axios.delete(`${BACKEND_URL}/api/drafts/${user}/${id}`);

export const addDraft = (user, title, body, tags) =>
  axios
    .post(`${BACKEND_URL}/api/draft`, {
      username: user,
      title,
      body,
      tags
    })
    .then(resp => resp.data);

export const updateDraft = (user, id, title, body, tags) =>
  axios.put(`${BACKEND_URL}/api/drafts/${user}/${id}`, {
    title,
    body,
    tags
  });

export const schedule = (
  user,
  title,
  permlink,
  json,
  tags,
  body,
  operationType,
  upvote,
  scheduleDate
) =>
  axios
    .post(`${BACKEND_URL}/api/schedules`, {
      username: user,
      category: tags[0],
      title,
      permlink,
      json: JSON.stringify(json),
      tags,
      body,
      post_type: operationType,
      upvote_this: upvote,
      schedule: scheduleDate,
      chain: 'steem'
    })
    .then(resp => resp.data);

export const getSchedules = user =>
  axios.get(`${BACKEND_URL}/api/schedules/${user}`).then(resp => resp.data);

export const removeSchedule = (id, user) =>
  axios.delete(`${BACKEND_URL}/api/schedules/${user}/${id}`);

export const moveSchedule = (id, user) =>
  axios.put(`${BACKEND_URL}/api/schedules/${user}/${id}`);

export const addBookmark = (user, author, permlink) =>
  axios
    .post(`${BACKEND_URL}/api/bookmark`, {
      username: user,
      author,
      permlink,
      chain: 'steem'
    })
    .then(resp => resp.data);

export const getBookmarks = user =>
  axios.get(`${BACKEND_URL}/api/bookmarks/${user}`).then(resp => resp.data);

export const removeBookmark = (id, user) =>
  axios.delete(`${BACKEND_URL}/api/bookmarks/${user}/${id}`);

export const getFavorites = user =>
  axios.get(`${BACKEND_URL}/api/favorites/${user}`).then(resp => resp.data);

export const isFavorite = (user, account) =>
  axios
    .get(`${BACKEND_URL}/api/isfavorite/${user}/${account}`)
    .then(resp => resp.data);

export const addFavorite = (user, account) =>
  axios
    .post(`${BACKEND_URL}/api/favorite`, {
      username: user,
      account
    })
    .then(resp => resp.data);

export const removeFavoriteUser = (user, account) =>
  axios.delete(`${BACKEND_URL}/api/favoriteUser/${user}/${account}`);

export const getActivities = (user, since = null) => {
  let u = `${BACKEND_URL}/api/activities/${user}`;
  if (since) {
    u += `?since=${since}`;
  }

  return axios.get(u).then(resp => resp.data);
};

export const getUnreadActivityCount = user =>
  axios
    .get(`${BACKEND_URL}/api/activities/${user}/unread-count`)
    .then(resp => resp.data.count);

export const getMyVotes = (user, since = null) => {
  let u = `${BACKEND_URL}/api/rvotes/${user}`;
  if (since) {
    u += `?since=${since}`;
  }

  return axios.get(u).then(resp => resp.data);
};

export const getMyReplies = (user, since = null) => {
  let u = `${BACKEND_URL}/api/replies/${user}`;
  if (since) {
    u += `?since=${since}`;
  }

  return axios.get(u).then(resp => resp.data);
};

export const getMyMentions = (user, since = null) => {
  let u = `${BACKEND_URL}/api/mentions/${user}`;
  if (since) {
    u += `?since=${since}`;
  }

  return axios.get(u).then(resp => resp.data);
};

export const getMyFollows = (user, since = null) => {
  let u = `${BACKEND_URL}/api/follows/${user}`;
  if (since) {
    u += `?since=${since}`;
  }

  return axios.get(u).then(resp => resp.data);
};

export const getMyReblogs = (user, since = null) => {
  let u = `${BACKEND_URL}/api/reblogs/${user}`;
  if (since) {
    u += `?since=${since}`;
  }

  return axios.get(u).then(resp => resp.data);
};

export const marActivityAsRead = (user, id = null) => {
  const d = {};
  if (id) {
    d.id = id;
  }

  return axios.put(`${BACKEND_URL}/api/activities/${user}`, d);
};

export const getLeaderboard = () =>
  axios.get(`${BACKEND_URL}/api/leaderboard`).then(resp => resp.data);
