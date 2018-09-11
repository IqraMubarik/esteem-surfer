// @flow
import { Client } from 'dsteem';
import { makeGroupKeyForPosts } from '../utils/misc';
import type { postStateType, commonActionType } from '../reducers/types';

export const POSTS_FETCH_BEGIN = 'POSTS_FETCH_BEGIN';
export const POSTS_FETCH_OK = 'POSTS_FETCH_OK';
export const POSTS_FETCH_ERROR = 'POSTS_FETCH_ERROR';
export const POSTS_INVALIDATE = 'POSTS_INVALIDATE';
export const POST_SET_READ = 'POST_SET_READ';
export const POST_SET_VOTED = 'POST_SET_VOTED';

const client = new Client('https://api.steemit.com');

export function fetchPosts(
  what: string,
  tag: string | null = '',
  more: boolean = false
) {
  return (
    dispatch: (action: commonActionType) => void,
    getState: () => postStateType
  ) => {
    const { posts } = getState();
    const pageSize = 20;

    const groupKey = makeGroupKeyForPosts(what, tag);

    // make sure tag is not null or undefined. it should be empty string.
    const query = {
      tag: tag || '',
      limit: pageSize
    };

    if (!more && posts.getIn([groupKey, 'entries']).size) {
      return;
    }

    const lastEntry = posts
      .getIn([groupKey, 'entries'])
      .valueSeq()
      .last();

    if (lastEntry) {
      query.start_author = lastEntry.author;
      query.start_permlink = lastEntry.permlink;
    }

    dispatch({
      type: POSTS_FETCH_BEGIN,
      payload: { group: groupKey }
    });

    client.database
      .getDiscussions(what, query)
      .then(resp => {
        dispatch({
          type: POSTS_FETCH_OK,
          payload: {
            data: resp,
            group: groupKey,
            hasMore: resp.length >= pageSize
          }
        });

        return resp;
      })
      .catch(e => {
        dispatch({
          type: POSTS_FETCH_ERROR,
          payload: { group: groupKey, error: e }
        });
      });
  };
}

export function invalidatePosts(what, tag = '') {
  return (dispatch: (action: commonActionType) => void) => {
    const groupKey = makeGroupKeyForPosts(what, tag);

    dispatch({
      type: POSTS_INVALIDATE,
      payload: { group: groupKey }
    });
  };
}
