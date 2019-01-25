/*
eslint-disable react/no-multi-comp,react/style-prop-object
*/

import React, { Component, Fragment } from 'react';

import PropTypes from 'prop-types';
import { message, Menu, Modal } from 'antd';
import {
  FormattedNumber,
  FormattedDate,
  FormattedMessage,
  FormattedRelative,
  injectIntl
} from 'react-intl';

import { Link } from 'react-router-dom';

import Tooltip from './common/Tooltip';

import NavBar from './layout/NavBar';
import AppFooter from './layout/AppFooter';

import ComposeBtn from './elements/ComposeBtn';
import UserAvatar from './elements/UserAvatar';
import FollowControls from './elements/FollowControls';
import EntryListLoadingItem from './elements/EntryListLoadingItem';
import EntryListItem from './elements/EntryListItem';
import { DelegationList } from './Vesting';


import ScrollReplace from './helpers/ScrollReplace';
import ListSwitch from './elements/ListSwitch';
import coverFallbackDay from '../img/cover-fallback-day.png';
import coverFallbackNight from '../img/cover-fallback-night.png';
import LinearProgress from './common/LinearProgress';
import EntryLink from './helpers/EntryLink';
import DropDown from './common/DropDown';

import { btc as btcIcon, usd as usdIcon } from '../svg';


import { getFollowCount, getAccount, getState, claimRewardBalance } from '../backend/steem-client';
import {
  getActiveVotes,
  getTopPosts,
  isFavorite,
  addFavorite,
  removeFavoriteUser
} from '../backend/esteem-client';

import { makeGroupKeyForEntries } from '../actions/entries';

import authorReputation from '../utils/author-reputation';
import { votingPower } from '../utils/manabar';
import proxifyImageSrc from '../utils/proxify-image-src';
import parseToken from '../utils/parse-token';
import { vestsToSp } from '../utils/conversions';
import parseDate from '../utils/parse-date';
import catchEntryImage from '../utils/catch-entry-image';
import entryBodySummary from '../utils/entry-body-summary';
import formatChainError from '../utils/format-chain-error';
import DeepLinkHandler from './helpers/DeepLinkHandler';

import noImage from '../img/noimage.png';

class Profile extends Component {

  render() {

    let vPower;
    let vPowerPercentage;
    let reputation;
    let name;
    let about;
    let postCount;
    let activeVotes;
    let followerCount;
    let followingCount;
    let location;
    let website;
    let created;

    const { username, account, activeAccount, intl } = this.props;

    if (account) {
      vPower = votingPower(account);
      vPowerPercentage = `${parseInt(vPower, 10)}%`;
      reputation = authorReputation(account.reputation);
      postCount = account.post_count;
      ({ activeVotes } = account);
      ({ followerCount } = account);
      ({ followingCount } = account);

      const { accountProfile } = account;
      if (accountProfile) {
        name = accountProfile.name || null;
        about = accountProfile.about || null;
        location = accountProfile.location || null;
        website = accountProfile.website || null;
      }

      created = new Date(account.created);
    }

    const showWitnesses = activeAccount && activeAccount.username === username;

    return (
      <div className="profile-area">
        <div className="account-avatar">
          <UserAvatar user={username} size="xLarge"/>
          {reputation && <div className="reputation">{reputation}</div>}
        </div>

        <div className="username">{username}</div>

        {vPowerPercentage && (
          <div className="vpower-line">
            <div
              className="vpower-line-inner"
              style={{ width: vPowerPercentage }}
            />
          </div>
        )}

        {vPower && (
          <div className="vpower-percentage">
            <Tooltip title={intl.formatMessage({
              id: 'account.voting-power'
            })}>
              {vPower.toFixed(2)}
            </Tooltip>
          </div>
        )}

        {name && <div className="full-name">{name}</div>}

        {about && <div className="about">{about}</div>}

        {(name || about) && <div className="divider"/>}

        <div className="account-numbers">
          <div className="account-prop">
            <Tooltip title={intl.formatMessage({
              id: 'account.post-count'
            })} className="holder-tooltip">
              <i className="mi">list</i>
              {typeof postCount === 'number' ? (
                <FormattedNumber value={postCount}/>
              ) : (
                <span>--</span>
              )}
            </Tooltip>
          </div>
          <div className="account-prop">
            <Tooltip
              title={intl.formatMessage({
                id: 'account.number-of-votes'
              })}
              className="holder-tooltip"
            >
              <i className="mi active-votes-icon">keyboard_arrow_up</i>
              {typeof activeVotes === 'number' ? (
                <FormattedNumber value={activeVotes}/>
              ) : (
                <span>--</span>
              )}
            </Tooltip>
          </div>
          <div className="account-prop">
            <Tooltip title={intl.formatMessage({
              id: 'account.followers'
            })} className="holder-tooltip">
              <i className="mi">people</i>
              {typeof followerCount === 'number' ? (
                <FormattedNumber value={followerCount}/>
              ) : (
                <span>--</span>
              )}
            </Tooltip>
          </div>
          <div className="account-prop">
            <Tooltip title={intl.formatMessage({
              id: 'account.following'
            })} className="holder-tooltip">
              <i className="mi">person_add</i>
              {typeof followingCount === 'number' ? (
                <FormattedNumber value={followingCount}/>
              ) : (
                <span>--</span>
              )}
            </Tooltip>
          </div>
        </div>

        <div className="divider"/>

        {location && (
          <div className="account-prop">
            <i className="mi">near_me</i> {location}
          </div>
        )}

        {website && (
          <div className="account-prop prop-website">
            <i className="mi">public</i>{' '}
            <a target="_external" className="website-link" href={website}>{website}</a>
          </div>
        )}

        {created && (
          <div className="account-prop">
            <i className="mi">date_range</i>{' '}
            <FormattedDate
              month="long"
              day="2-digit"
              year="numeric"
              value={created}
            />
          </div>
        )}

        {showWitnesses && (
          <Fragment>
            <div className="divider"/>
            <div className="witnesses">
              <Link to="/witnesses">Witnesses</Link>
            </div>
          </Fragment>
        )}
      </div>
    );
  }
}


Profile.defaultProps = {
  account: null,
  activeAccount: null
};

Profile.propTypes = {
  username: PropTypes.string.isRequired,
  account: PropTypes.instanceOf(Object),
  intl: PropTypes.instanceOf(Object).isRequired,
  activeAccount: PropTypes.instanceOf(Object)
};


export class AccountMenu extends Component {
  goSection = (section) => {
    const { history, username } = this.props;
    const u = section ? `/@${username}/${section}` : `/@${username}`;
    history.push(u);
  };

  render() {
    const { section } = this.props;

    return (
      <div className="account-menu">
        <div className="account-menu-items">
          <a role="none" className={`menu-item ${section === 'blog' && 'selected-item'}`} onClick={() => {
            this.goSection('blog');
          }}><FormattedMessage id="account.section-blog"/></a>
          <a role="none" className={`menu-item ${section === 'comments' && 'selected-item'}`} onClick={() => {
            this.goSection('comments');
          }}><FormattedMessage id="account.section-comments"/></a>
          <a role="none" className={`menu-item ${section === 'replies' && 'selected-item'}`} onClick={() => {
            this.goSection('replies');
          }}><FormattedMessage id="account.section-replies"/></a>
          <a role="none" className={`menu-item ${section === 'wallet' && 'selected-item'}`} onClick={() => {
            this.goSection('wallet');
          }}><FormattedMessage id="account.section-wallet"/></a>
        </div>
        <div className="page-tools">
          {section !== 'wallet' &&
          <ListSwitch {...this.props} />
          }
        </div>
      </div>
    );
  }
}

AccountMenu.propTypes = {
  username: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired,
  history: PropTypes.instanceOf(Object).isRequired
};

export class AccountCover extends Component {
  render() {
    let coverImage;

    const { account, username, global, activeAccount } = this.props;
    const hideFollowControls = activeAccount && activeAccount.username === username;

    if (account) {
      const { accountProfile } = account;
      if (accountProfile) {
        coverImage = accountProfile.cover_image || null;
      }
    }

    const bgImage = coverImage && proxifyImageSrc(coverImage) || (global.theme === 'day' ? coverFallbackDay : coverFallbackNight);

    return <div className="account-cover">
      <div className="cover-image" style={{ backgroundImage: `url('${bgImage}')` }}/>
      {!hideFollowControls &&
      <div className="follow-controls-holder">
        <FollowControls {...this.props} targetUsername={username}/>
      </div>
      }
    </div>;
  }
}

AccountCover.defaultProps = {
  account: null,
  activeAccount: null
};

AccountCover.propTypes = {
  username: PropTypes.string.isRequired,
  account: PropTypes.instanceOf(Object),
  global: PropTypes.shape({
    theme: PropTypes.string.isRequired
  }).isRequired,
  activeAccount: PropTypes.instanceOf(Object)
};

export class AccountTopPosts extends Component {
  render() {
    const { posts } = this.props;

    return (
      <div className="top-posts-list">
        <h2 className="top-posts-list-header"><FormattedMessage id="account.top-posts"/></h2>
        <div className="top-posts-list-body">
          {posts.map(p => (
            <EntryLink {...this.props} author={p.author} permlink={p.permlink} key={p.permlink}>
              <div className="top-posts-list-item" role="none">
                <div className="post-image">
                  <img alt="" src={catchEntryImage(p, 130, 80) || noImage}/>
                </div>
                <div className="post-content">
                  <div className="post-title">{p.title}</div>
                  <div className="post-body">{entryBodySummary(p.body, 40)}</div>
                </div>
              </div>
            </EntryLink>
          ))}
        </div>
      </div>
    );
  }
}

AccountTopPosts.defaultProps = {
  posts: []
};

AccountTopPosts.propTypes = {
  posts: PropTypes.arrayOf(Object),
  history: PropTypes.instanceOf(Object).isRequired
};


export class TransactionRow extends Component {

  render() {

    const { dynamicProps, transaction: tr } = this.props;
    const { steemPerMVests } = dynamicProps;

    const { op } = tr[1];
    const { timestamp } = tr[1];
    const opName = op[0];
    const opData = op[1];
    const transDate = parseDate(timestamp);

    let flag = false;
    let icon = 'local_activity';
    let numbers;
    let details;

    if (opName === 'curation_reward') {
      flag = true;

      const { reward: vestingPayout } = opData;

      numbers = (
        <Fragment>
          <FormattedNumber value={vestsToSp(parseToken(vestingPayout), steemPerMVests)}
                           minimumFractionDigits={3}/> {'SP'}
        </Fragment>
      );

      const { comment_author: commentAuthor, comment_permlink: commentPermlink } = opData;
      details = `@${commentAuthor}/${commentPermlink}`;
    }

    if (opName === 'author_reward' || opName === 'comment_benefactor_reward') {
      flag = true;

      let {
        sbd_payout: sbdPayout,
        steem_payout: steemPayout,
        vesting_payout: vestingPayout
      } = opData;

      sbdPayout = parseToken(sbdPayout);
      steemPayout = parseToken(steemPayout);
      vestingPayout = parseToken(vestingPayout);

      numbers = (
        <Fragment>
          {sbdPayout > 0 &&
          <span className="number"><FormattedNumber value={sbdPayout}
                                                    minimumFractionDigits={3}/> {'SBD'}</span>
          }
          {steemPayout > 0 &&
          <span className="number"><FormattedNumber value={steemPayout}
                                                    minimumFractionDigits={3}/> {'STEEM'}</span>
          }
          {vestingPayout > 0 &&
          <span className="number"><FormattedNumber value={vestsToSp(vestingPayout, steemPerMVests)}
                                                    minimumFractionDigits={3}/> {'SP'}</span>
          }
        </Fragment>
      );

      const {
        author,
        permlink
      } = opData;

      details = `@${author}/${permlink}`;
    }

    if (opName === 'comment_benefactor_reward') {
      icon = 'comment';
    }

    if (opName === 'claim_reward_balance') {
      flag = true;

      let {
        reward_sbd: rewardSdb,
        reward_steem: rewardSteem,
        reward_vests: rewardVests
      } = opData;

      rewardSdb = parseToken(rewardSdb);
      rewardSteem = parseToken(rewardSteem);
      rewardVests = parseToken(rewardVests);

      numbers = (
        <Fragment>
          {rewardSdb > 0 &&
          <span className="number"><FormattedNumber value={rewardSdb}
                                                    minimumFractionDigits={3}/> {'SBD'}</span>
          }
          {rewardSteem > 0 &&
          <span className="number"><FormattedNumber value={rewardSteem}
                                                    minimumFractionDigits={3}/> {'STEEM'}</span>
          }
          {rewardVests > 0 &&
          <span className="number"><FormattedNumber value={vestsToSp(rewardVests, steemPerMVests)}
                                                    minimumFractionDigits={3}/> {'SP'}</span>
          }
        </Fragment>
      );
    }

    if (opName === 'transfer' || opName === 'transfer_to_vesting') {
      flag = true;
      icon = 'compare_arrows';

      const { amount, memo, from, to } = opData;
      details = <span>{memo} <br/><br/> <strong>@{from}</strong> -&gt; <strong>@{to}</strong></span>;

      numbers = (
        <span>{amount}</span>
      );
    }

    if (opName === 'withdraw_vesting') {
      flag = true;
      icon = 'money';

      const { acc } = opData;

      let {
        vesting_shares: opVestingShares
      } = opData;

      opVestingShares = parseToken(opVestingShares);
      numbers = <span className="number"><FormattedNumber value={vestsToSp(opVestingShares, steemPerMVests)}
                                                          minimumFractionDigits={3}/> {'SP'}</span>;

      details = <span><strong>@{acc}</strong></span>;
    }

    if (opName === 'fill_order') {
      flag = true;
      icon = 'reorder';

      const {
        current_pays: currentPays,
        open_pays: openPays
      } = opData;

      numbers = <span className="number">{currentPays} = {openPays}</span>;
    }

    if (flag) {
      return (
        <div className="transaction-list-item">
          <div className="transaction-icon">
            <i className="mi">{icon}</i>
          </div>
          <div className="transaction-title">
            <div className="transaction-name">
              <FormattedMessage id={`account.transaction-${opName}`}/>
            </div>
            <div className="transaction-date">
              <FormattedRelative value={transDate}/>
            </div>
          </div>
          <div className="transaction-numbers">
            {numbers}
          </div>
          <div className="transaction-details">
            {details}
          </div>
        </div>
      );
    }


    return null;
  }
}


TransactionRow.propTypes = {
  transaction: PropTypes.arrayOf(Object).isRequired,
  dynamicProps: PropTypes.instanceOf(Object).isRequired
};


export class Exchange extends Component {

  render() {
    const { marketData } = this.props;

    let steemUsdDir;
    let steemBtcDir;
    let sbdUsdDir;
    let sbdBtcDir;

    if (marketData) {
      const { steem, sbd } = marketData;
      const { usd: steemUsd, btc: steemBtc } = steem.quotes;
      const { usd: sbdUsd, btc: sbdBtc } = sbd.quotes;

      steemUsdDir = steemUsd.percent_change === 0 && 'same' || (steemUsd.percent_change > 0 ? 'up' : 'down');
      steemBtcDir = steemBtc.percent_change === 0 && 'same' || (steemBtc.percent_change > 0 ? 'up' : 'down');

      sbdUsdDir = sbdUsd.percent_change === 0 && 'same' || (sbdUsd.percent_change > 0 ? 'up' : 'down');
      sbdBtcDir = sbdBtc.percent_change === 0 && 'same' || (sbdBtc.percent_change > 0 ? 'up' : 'down');
    }

    return (
      <div className="exchange-data">
        <div className="exchange-title">
              <span className="title-icon ">
                <i className="mi">show_chart</i>
              </span>
          <h2><FormattedMessage id="account.exchange"/></h2>
        </div>

        <div className="market-data">
          <div className="market-data-title">Steem</div>

          {marketData &&
          <Fragment>
            <div className={`price change-${steemUsdDir}`}>
              <div className="price-usd">
                {usdIcon} <FormattedNumber maximumFractionDigits={2} value={marketData.steem.quotes.usd.price}/>
              </div>

              <div className="price-change">
                (<FormattedNumber maximumFractionDigits={2} value={marketData.steem.quotes.usd.percent_change}/>%)
              </div>
              {steemUsdDir === 'same' &&
              <i className="change-icon">--</i>
              }
              {steemUsdDir === 'up' &&
              <i className="mi change-icon">arrow_drop_up</i>
              }
              {steemUsdDir === 'down' &&
              <i className="mi change-icon">arrow_drop_down</i>
              }
            </div>


            <div className={`price change-${steemBtcDir}`}>
              <div className="price-btc">
                {btcIcon} <FormattedNumber minimumFractionDigits={8} value={marketData.steem.quotes.btc.price}/>
              </div>

              <div className="price-change">
                (<FormattedNumber maximumFractionDigits={2} value={marketData.steem.quotes.btc.percent_change}/>%)
              </div>
              {steemBtcDir === 'same' &&
              <i className="change-icon">--</i>
              }
              {steemBtcDir === 'up' &&
              <i className="mi change-icon">arrow_drop_up</i>
              }
              {steemBtcDir === 'down' &&
              <i className="mi change-icon">arrow_drop_down</i>
              }
            </div>
          </Fragment>
          }
        </div>

        <div className="market-data">
          <div className="market-data-title">Steem Dollar</div>
          {marketData &&
          <Fragment>
            <div className={`price change-${sbdUsdDir}`}>
              <div className="price-usd">
                {usdIcon} <FormattedNumber maximumFractionDigits={2} value={marketData.sbd.quotes.usd.price}/>
              </div>

              <div className="price-change">
                (<FormattedNumber maximumFractionDigits={2} value={marketData.sbd.quotes.usd.percent_change}/>%)
              </div>
              {sbdUsdDir === 'same' &&
              <i className="change-icon">--</i>
              }
              {sbdUsdDir === 'up' &&
              <i className="mi change-icon">arrow_drop_up</i>
              }
              {sbdUsdDir === 'down' &&
              <i className="mi change-icon">arrow_drop_down</i>
              }
            </div>
            <div className={`price change-${sbdBtcDir}`}>
              <div className="price-btc">
                {btcIcon} <FormattedNumber minimumFractionDigits={8} value={marketData.sbd.quotes.btc.price}/>
              </div>
              <div className="price-change">
                (<FormattedNumber maximumFractionDigits={2} value={marketData.sbd.quotes.btc.percent_change}/>%)
              </div>
              {sbdBtcDir === 'same' &&
              <i className="change-icon">--</i>
              }
              {sbdBtcDir === 'up' &&
              <i className="mi change-icon">arrow_drop_up</i>
              }
              {sbdBtcDir === 'down' &&
              <i className="mi change-icon">arrow_drop_down</i>
              }
            </div>
          </Fragment>
          }
        </div>
      </div>
    );
  }
}

Exchange.defaultProps = {
  marketData: null
};

Exchange.propTypes = {
  marketData: PropTypes.instanceOf(Object)
};

export class SectionWallet extends Component {

  constructor(props) {
    super(props);

    const { account } = this.props;

    this.state = {
      account,
      claiming: false,
      delegationModalOpen: false
    };
  }

  claimRewardBalance = () => {
    const { activeAccount, global, intl } = this.props;
    const { claiming } = this.state;

    if (claiming) {
      return;
    }

    this.setState({ claiming: true });

    return getAccount(activeAccount.username).then(account => {
      const {
        reward_steem_balance: steemBal,
        reward_sbd_balance: sbdBal,
        reward_vesting_balance: vestingBal
      } = account;

      return claimRewardBalance(activeAccount, global.pin, steemBal, sbdBal, vestingBal);
    })
      .then(() => getAccount(activeAccount.username))
      .then(account => {
        message.success(intl.formatMessage({
          id: 'account.claim-reward-balance-ok'
        }));
        this.setState({ account });
        return account;
      }).then(account => {
        this.setState({ account });
        return account;
      }).catch(err => {
        message.error(formatChainError(err));
      }).finally(() => {
        this.setState({ claiming: false });
      });
  };

  delegationClicked = () => {
    this.setState({ delegationModalOpen: true });
  };

  render() {
    const { transactions, dynamicProps, global, intl, activeAccount, username, location } = this.props;
    const { account, claiming, delegationModalOpen } = this.state;


    if (account) {

      const { steemPerMVests, base, quote } = dynamicProps;
      const { currency, currencyRate } = global;

      const rewardSteemBalance = parseToken(account.reward_steem_balance);
      const rewardSbdBalance = parseToken(account.reward_sbd_balance);
      const rewardVestingSteem = parseToken(account.reward_vesting_steem);
      const hasUnclaimedRewards = (rewardSteemBalance > 0 || rewardSbdBalance > 0 || rewardVestingSteem > 0);

      const balance = parseToken(account.balance);

      const vestingShares = parseToken(account.vesting_shares);
      const vestingSharesDelegated = parseToken(account.delegated_vesting_shares);
      const vestingSharesReceived = parseToken(account.received_vesting_shares);
      const vestingSharesTotal = (vestingShares - vestingSharesDelegated + vestingSharesReceived);

      const sbdBalance = parseToken(account.sbd_balance);
      const savingBalance = parseToken(account.savings_balance);
      const savingBalanceSbd = parseToken(account.savings_sbd_balance);

      const estimatedValue = (
        (vestsToSp(vestingShares, steemPerMVests) * (base / quote)) +
        (balance * (base / quote)) +
        sbdBalance
      ) * currencyRate;

      const showPowerDown = account.next_vesting_withdrawal !== '1969-12-31T23:59:59';
      const nextVestingWithdrawal = parseDate(account.next_vesting_withdrawal);
      const nextVestingWithdrawalAmount = vestsToSp(parseToken(account.vesting_withdraw_rate), steemPerMVests);

      const isMyPage = activeAccount && activeAccount.username === username;

      let actionListSteem;
      let actionListSp;
      let actionListSbd;
      let actionListWithdrawSteem;
      let actionListWithdrawSbd;

      if (isMyPage) {
        actionListSteem = <Menu className="surfer-dropdown-menu">
          <Menu.Item key="transfer">
            <Link to={`/@${activeAccount.username}/transfer/steem`}>
              <FormattedMessage id="account.transfer"/>
            </Link>
          </Menu.Item>
          <Menu.Item key="transfer-saving">
            <Link to={`/@${activeAccount.username}/transfer-saving/steem`}>
              <FormattedMessage id="account.transfer-to-savings"/>
            </Link>
          </Menu.Item>
          <Menu.Item key="power-up">
            <Link to={`/@${activeAccount.username}/power-up`}>
              <FormattedMessage id="account.power-up"/>
            </Link>
          </Menu.Item>
        </Menu>;

        actionListSp = <Menu className="surfer-dropdown-menu">
          <Menu.Item key="delegate">
            <Link to={`/@${activeAccount.username}/delegate`}>
              <FormattedMessage id="account.delegate"/>
            </Link>
          </Menu.Item>

        </Menu>;

        actionListSbd = <Menu className="surfer-dropdown-menu">
          <Menu.Item key="transfer">
            <Link to={`/@${activeAccount.username}/transfer/sbd`}>
              <FormattedMessage id="account.transfer"/>
            </Link>
          </Menu.Item>
          <Menu.Item key="transfer-saving">
            <Link to={`/@${activeAccount.username}/transfer-saving/sbd`}>
              <FormattedMessage id="account.transfer-to-savings"/>
            </Link>
          </Menu.Item>
        </Menu>;

        actionListWithdrawSteem = <Menu className="surfer-dropdown-menu">
          <Menu.Item key="withdraw-saving">
            <Link to={`/@${activeAccount.username}/withdraw-saving/steem`}>
              <FormattedMessage id="account.withdraw-steem"/>
            </Link>
          </Menu.Item>
        </Menu>;

        actionListWithdrawSbd = <Menu className="surfer-dropdown-menu">
          <Menu.Item key="withdraw-saving">
            <Link to={`/@${activeAccount.username}/withdraw-saving/sbd`}>
              <FormattedMessage id="account.withdraw-sbd"/>
            </Link>
          </Menu.Item>
        </Menu>;
      }

      return (
        <div className="wallet-section">
          <div className="first-row">
            {hasUnclaimedRewards &&
            <div className="unclaimed-rewards">
              <div className="title"><FormattedMessage id="account.unclaimed-rewards"/></div>
              <div className="rewards">
                {rewardSteemBalance > 0 &&
                <span className="reward-type">{`${rewardSteemBalance} STEEM`}</span>
                }
                {rewardSbdBalance > 0 &&
                <span className="reward-type">{`${rewardSbdBalance} SDB`}</span>
                }
                {rewardVestingSteem > 0 &&
                <span className="reward-type">{`${rewardVestingSteem} SP`}</span>
                }
                {isMyPage &&
                <Tooltip title={intl.formatMessage({
                  id: 'account.claim-reward-balance'
                })} mouseEnterDelay={2}>
                  <a className={`claim-btn ${claiming ? 'in-progress' : ''}`} onClick={() => {
                    this.claimRewardBalance();
                  }} role="none">
                    <i className="mi">add_circle</i>
                  </a>
                </Tooltip>
                }
              </div>
            </div>
            }
            <div className="estimated-value">
              <Tooltip title={intl.formatMessage({
                id: 'account.estimated-value'
              })}>
              <span><FormattedNumber currency={currency} style="currency" currencyDisplay="symbol"
                                     minimumFractionDigits={3} value={estimatedValue}/></span>
              </Tooltip>
            </div>
          </div>
          <div className="second-row">
            <div className="funds">
              <div className="fund fund-steem">
                <div className="fund-line">
                  <Tooltip title={intl.formatMessage({
                    id: 'account.steem-description'
                  })}>
                    <div className="fund-info-icon"/>
                  </Tooltip>
                  <div className="fund-title"><FormattedMessage id="account.steem"/></div>
                  <div className="fund-number"><FormattedNumber minimumFractionDigits={3} value={balance}/> {'STEEM'}
                  </div>
                  <div className="fund-action">
                    {isMyPage &&
                    <DropDown menu={actionListSteem} location={location}/>
                    }
                  </div>
                </div>
              </div>

              <div className="fund fund-sp alternative">
                <div className="fund-line">
                  <Tooltip title={intl.formatMessage({
                    id: 'account.steem-power-description'
                  })}>
                    <div className="fund-info-icon"/>
                  </Tooltip>
                  <div className="fund-title"><FormattedMessage id="account.steem-power"/></div>
                  <div className="fund-number">
                    <FormattedNumber minimumFractionDigits={3} value={vestsToSp(vestingShares, steemPerMVests)}/> {'SP'}
                  </div>
                  <div className="fund-action">
                    {isMyPage &&
                    <DropDown menu={actionListSp} location={location}/>
                    }
                  </div>
                </div>

                {vestingSharesDelegated > 0 &&
                <div className="fund-line">
                  <div className="fund-number delegated-shares">
                    <Tooltip title={intl.formatMessage({
                      id: 'account.steem-power-delegated'
                    })}>
                     <span className="btn-delegated" role="none" onClick={this.delegationClicked}>
                       {'-'} <FormattedNumber value={vestsToSp(vestingSharesDelegated, steemPerMVests)}/> {'SP'}
                     </span>
                    </Tooltip>
                  </div>
                  <div className="fund-action"/>
                </div>
                }

                {vestingSharesReceived > 0 &&
                <div className="fund-line">
                  <div className="fund-number received-shares">
                    <Tooltip title={intl.formatMessage({
                      id: 'account.steem-power-received'
                    })}>
                      {'+'} <FormattedNumber value={vestsToSp(vestingSharesReceived, steemPerMVests)}/> {'SP'}
                    </Tooltip>
                  </div>
                  <div className="fund-action"/>
                </div>
                }

                {(vestingSharesDelegated > 0 || vestingSharesReceived > 0) &&
                <div className="fund-line">
                  <div className="fund-number total-sp">
                    <Tooltip title={intl.formatMessage({
                      id: 'account.steem-power-total'
                    })}>
                      {'='} <FormattedNumber value={vestsToSp(vestingSharesTotal, steemPerMVests)}/> {'SP'}
                    </Tooltip>
                  </div>
                  <div className="fund-action"/>
                </div>
                }
              </div>

              <div className="fund fund-sbd">
                <div className="fund-line">
                  <Tooltip title={intl.formatMessage({
                    id: 'account.steem-dollars-description'
                  })}>
                    <div className="fund-info-icon"/>
                  </Tooltip>
                  <div className="fund-title"><FormattedMessage id="account.steem-dollars"/></div>
                  <div className="fund-number">
                    <FormattedNumber currency="USD" style="currency" currencyDisplay="symbol"
                                     minimumFractionDigits={3} value={sbdBalance}/>
                  </div>
                  <div className="fund-action">
                    {isMyPage &&
                    <DropDown menu={actionListSbd} location={location}/>
                    }
                  </div>
                </div>
              </div>
              <div className="fund fund-savings alternative">
                <div className="fund-line">
                  <Tooltip title={intl.formatMessage({
                    id: 'account.savings-description'
                  })}>
                    <div className="fund-info-icon"/>
                  </Tooltip>
                  <div className="fund-title"><FormattedMessage id="account.savings"/></div>
                  <div className="fund-number">
                    <FormattedNumber minimumFractionDigits={3} value={savingBalance}/> {'STEEM'}
                  </div>
                  <div className="fund-action">
                    {isMyPage &&
                    <DropDown menu={actionListWithdrawSteem} location={location}/>
                    }
                  </div>
                </div>
                <div className="fund-line">
                  <div className="fund-number">
                    <FormattedNumber currency="USD" style="currency" currencyDisplay="symbol"
                                     minimumFractionDigits={3} value={savingBalanceSbd}/>
                  </div>
                  <div className="fund-action">
                    {isMyPage &&
                    <DropDown menu={actionListWithdrawSbd} location={location}/>
                    }
                  </div>
                </div>
              </div>
              {showPowerDown &&
              <div className="next-power-down">
                <div className="fund-info-icon"/>
                <FormattedMessage id="account.next-power-down"
                                  values={
                                    {
                                      time: <FormattedRelative value={nextVestingWithdrawal}/>,
                                      amount: <strong><FormattedNumber value={nextVestingWithdrawalAmount}
                                                                       minimumFractionDigits={3}/> SP</strong>
                                    }
                                  }/>
              </div>
              }
            </div>

            <Exchange {...this.props} />
          </div>

          <div className="transaction-list">
            <div className="transaction-list-header">
              <h2><FormattedMessage id="account.transactions"/></h2>
            </div>
            <div className="transaction-list-body">

              {transactions && transactions.map(tr => (
                <TransactionRow {...this.props} transaction={tr} key={tr[0]}/>
              ))}
            </div>
          </div>

          <Modal
            visible={delegationModalOpen}
            footer={false}
            width="550px"
            onCancel={() => {
              this.setState({ delegationModalOpen: false });
            }}
            destroyOnClose
            centered
            title={intl.formatMessage({ id: 'account.steem-power-delegated' })}
          >
            <DelegationList {...this.props} username={username}/>
          </Modal>
        </div>
      );
    }

    return <div className="wallet-section"/>;
  }
}

SectionWallet.defaultProps = {
  account: null,
  transactions: [],
  activeAccount: null
};

SectionWallet.propTypes = {
  username: PropTypes.string.isRequired,
  account: PropTypes.instanceOf(Object),
  transactions: PropTypes.arrayOf(Object),
  dynamicProps: PropTypes.shape({
    steemPerMVests: PropTypes.number.isRequired,
    base: PropTypes.number.isRequired
  }).isRequired,
  global: PropTypes.shape({
    currencyRate: PropTypes.number.isRequired,
    currencySymbol: PropTypes.string.isRequired,
    pin: PropTypes.string.isRequired
  }).isRequired,
  intl: PropTypes.instanceOf(Object).isRequired,
  location: PropTypes.instanceOf(Object).isRequired,
  activeAccount: PropTypes.instanceOf(Object)
};


class Account extends Component {
  constructor(props) {
    super(props);

    this.state = {
      account: null,
      topPosts: null,
      transactions: null,
      transactionsLoading: true,
      favorite: false
    };
  }

  componentDidMount() {
    /*
    Check user here

    const {match} = this.props;
    const {username, section = 'blog'} = match.params;
    */

    this.fetchData();
    this.fetchEntries();
  }

  componentDidUpdate(prevProps) {
    const { location } = this.props;

    if (location !== prevProps.location) {

      // fetch entries when location changed.
      this.fetchEntries();

      const { match: newMatch } = this.props;
      const { match: oldMatch } = prevProps;

      const { username: newUsername } = newMatch.params;
      const { username: oldUsername } = oldMatch.params;

      if (newUsername !== oldUsername) {
        // refresh data when user changed
        this.fetchData();
      }
    }
  }

  fetchData = () => {
    // Reset state
    this.setState({
      account: null,
      topPosts: null,
      transactions: null,
      transactionsLoading: true
    });

    // Account data
    this.fetchAccount().then(account => {
      this.setState({ account });
      return account;
    }).catch(err => {
      message.error(formatChainError(err));
    });

    const { match } = this.props;
    const { username } = match.params;

    // Top posts
    getTopPosts(username).then(resp => {
      this.setState({
        topPosts: resp.list
      });
      return resp;
    }).catch(() => {

    });

    // Transactions
    getState(`/@${username}/transfers`).then(state => {
      const { accounts } = state;
      const { transfer_history: transferHistory } = accounts[username];
      const transactions = transferHistory.slice(Math.max(transferHistory.length - 50, 0));
      transactions.sort((a, b) => b[0] - a[0]);
      return transactions;
    }).then(transactions => {
      this.setState({
        transactions
      });
      return transactions;
    }).catch(err => {
      message.error(formatChainError(err));
    }).finally(() => {
      this.setState({
        transactionsLoading: false
      });
    });

    // is favorite
    const { activeAccount } = this.props;
    if (activeAccount) {
      isFavorite(activeAccount.username, username).then(favorite => {
        this.setState({ favorite });
        return favorite;
      }).catch(() => {
      });
    }
  };

  fetchAccount = async () => {
    const { match } = this.props;
    const { username } = match.params;

    let { visitingAccount: account } = this.props;

    if (!(account && account.name === username)) {
      account = await getAccount(username);
    }

    // Profile data
    let accountProfile;
    try {
      accountProfile = JSON.parse(account.json_metadata).profile;
    } catch (err) {
      accountProfile = null;
    }

    account = Object.assign({}, account, { accountProfile });
    this.setState({ account });

    // Follow counts
    let follow;
    try {
      follow = await getFollowCount(username);
    } catch (err) {
      follow = null;
    }

    if (follow) {
      const followerCount = follow.follower_count;
      const followingCount = follow.following_count;

      account = Object.assign({}, account, { followerCount, followingCount });
      this.setState({ account });
    }

    // Active votes
    let activeVotes;
    try {
      activeVotes = await getActiveVotes(username);
    } catch (err) {
      activeVotes = { count: 0 };
    }

    account = Object.assign({}, account, { activeVotes: activeVotes.count });

    return account;
  };

  fetchEntries = () => {
    const { match, actions } = this.props;
    const { username, section = 'blog' } = match.params;
    if (['blog', 'comments', 'replies'].includes(section)) {
      actions.fetchEntries(section, `@${username}`);
    }
  };

  invalidateEntries = () => {
    const { match, actions } = this.props;
    const { username, section = 'blog' } = match.params;
    if (['blog', 'comments', 'replies'].includes(section)) {
      actions.invalidateEntries(section, `@${username}`);
    }
  };

  bottomReached = () => {
    const { actions, entries, match } = this.props;
    const { username, section = 'blog' } = match.params;

    const groupKey = makeGroupKeyForEntries(section, `@${username}`);
    const data = entries.get(groupKey);
    const loading = data.get('loading');
    const hasMore = data.get('hasMore');

    if (!loading && hasMore) {
      actions.fetchEntries(section, `@${username}`, true);
    }
  };

  refresh = () => {
    this.invalidateEntries();
    this.fetchEntries();
    this.fetchData();
    document.querySelector('#app-content').scrollTop = 0;
  };

  favoriteFn = () => {
    const { favorite } = this.state;
    const { activeAccount, match, intl } = this.props;
    const { username } = match.params;

    if (favorite) {
      removeFavoriteUser(activeAccount.username, username).then(resp => {
        this.setState({ favorite: false });
        message.info(intl.formatMessage({ id: 'entry.favoriteRemoved' }));
        return resp;
      }).catch(() => {

      });
      return;
    }

    addFavorite(activeAccount.username, username).then(resp => {
      this.setState({ favorite: true });
      message.info(intl.formatMessage({ id: 'entry.favorited' }));
      return resp;
    }).catch(() => {

    });
  };

  render() {
    const { entries, global, match } = this.props;
    const { account, favorite } = this.state;
    const { username, section = 'blog' } = match.params;
    const isWallet = section === 'wallet';

    let entryList;
    let loading = false;

    if (!isWallet) {
      const groupKey = makeGroupKeyForEntries(section, `@${username}`);
      const data = entries.get(groupKey);
      entryList = data.get('entries');
      loading = data.get('loading');
    } else {
      const { transactionsLoading } = this.state;
      loading = transactionsLoading;
    }

    const { topPosts } = this.state;
    const { transactions } = this.state;

    return (
      <div className="wrapper">
        <NavBar
          {...this.props}
          reloadFn={() => {
            this.refresh();
          }}
          reloading={loading}
          favoriteFn={this.favoriteFn}
          favoriteFlag={favorite}
        />

        <div className="app-content account-page">
          <div className="page-header">
            <div className="left-side">
              <ComposeBtn {...this.props} />
            </div>
            <div className="right-side">
              <AccountMenu {...this.props} section={section} username={username}/>
            </div>
          </div>
          <div className="page-inner" id="app-content">
            <div className="left-side">
              <Profile {...this.props} username={username} account={account}/>
            </div>

            <div className="right-side">
              {!isWallet &&
              <AccountCover {...this.props} account={account} username={username}/>
              }

              {section === 'blog' && topPosts &&
              <AccountTopPosts {...this.props} posts={topPosts}/>
              }

              {!isWallet &&
              <Fragment>
                <div className={`entry-list ${loading ? 'loading' : ''}`}>
                  <div
                    className={`entry-list-body ${
                      global.listStyle === 'grid' ? 'grid-view' : ''
                      }`}
                  >
                    {loading && entryList.size === 0 ? (
                      <EntryListLoadingItem/>
                    ) : (
                      ''
                    )}
                    {entryList.valueSeq().map(d => (
                      <EntryListItem key={`${d.author}-${d.permlink}`} {...this.props} entry={d} asAuthor={username}/>
                    ))}
                  </div>
                </div>
                {loading && entryList.size > 0 ? <LinearProgress/> : ''}
                <ScrollReplace {...this.props} selector="#app-content" onBottom={this.bottomReached}/>
              </Fragment>
              }

              {isWallet && account &&
              <SectionWallet {...this.props} transactions={transactions} username={username} account={account} />
              }
            </div>
          </div>
        </div>
        <AppFooter {...this.props} />
        <DeepLinkHandler {...this.props} />
      </div>
    );
  }
}

Account.defaultProps = {
  visitingAccount: null,
  activeAccount: null
};

Account.propTypes = {
  actions: PropTypes.shape({
    fetchEntries: PropTypes.func.isRequired,
    invalidateEntries: PropTypes.func.isRequired,
    changeTheme: PropTypes.func.isRequired,
    changeListStyle: PropTypes.func.isRequired
  }).isRequired,
  global: PropTypes.shape({
    listStyle: PropTypes.string.isRequired,
    pin: PropTypes.string.isRequired
  }).isRequired,
  entries: PropTypes.instanceOf(Object).isRequired,
  location: PropTypes.instanceOf(Object).isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
  match: PropTypes.instanceOf(Object).isRequired,
  visitingAccount: PropTypes.instanceOf(Object),
  activeAccount: PropTypes.instanceOf(Object),
  intl: PropTypes.instanceOf(Object).isRequired
};

export default injectIntl(Account);
