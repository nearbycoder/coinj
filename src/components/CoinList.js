import React, { Component, Fragment } from 'react';
import { orderBy, isString, filter, includes } from 'lodash';
import { Column, Table, WindowScroller } from 'react-virtualized';
import numeral from 'numeral';
import { WindowSize } from 'react-fns';
import 'react-virtualized/styles.css'; // only needs to be imported once
import '../spritesheet.css';
import io from 'socket.io-client';

export default class CoinList extends Component {
  state = {
    coins: [],
    previousCoins: [],
    sortDirection: 'ASC',
    sortBy: 'id',
    filterKey: ''
  };

  socket = null;

  fetchCoins = () => {
    fetch('https://coincap.io/front')
      .then(res => res.json())
      .then(res =>
        this.setState({
          coins: res.map((coin, index) => ({
            ...coin,
            name: `${coin.long} ${coin.short}`,
            rank: index + 1
          }))
        })
      )
      .catch(err => console.log(err));
  };

  componentWillMount() {
    this.socket = io('https://coincap.io');

    this.socket.on('trades', tradeMsg => {
      this.setState(() => {
        return {
          previousCoins: this.state.coins,
          coins: this.state.coins.map(coin => {
            if (coin.short === tradeMsg.coin) {
              return { ...coin, ...tradeMsg.msg };
            } else {
              return coin;
            }
          })
        };
      });
    });

    this.fetchCoins();
  }

  sort = sortObject => {
    this.setState({
      coins: orderBy(
        this.state.coins,
        coin =>
          isString(coin[sortObject.sortBy])
            ? coin[sortObject.sortBy].toLowerCase()
            : coin[sortObject.sortBy],
        this.state.sortDirection.toLowerCase()
      ),
      sortDirection: this.state.sortDirection === 'ASC' ? 'DESC' : 'ASC',
      sortBy: sortObject.sortBy
    });
  };

  filteredCoins = _ =>
    filter(this.state.coins, coin =>
      includes(coin.name.toLowerCase(), this.state.filterKey.toLowerCase())
    );

  handleInput = e => {
    this.setState({ filterKey: e.target.value });
  };

  render() {
    const coins = this.filteredCoins();
    return (
      <WindowSize
        render={({ width, height }) => (
          <Fragment>
            <input
              style={{
                padding: '10px',
                width: '200px',
                margin: '10px',
                fontSize: '20px'
              }}
              onChange={this.handleInput}
            />
            <WindowScroller>
              {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <Table
                  style={{
                    margin: '0 auto',
                    display: 'block',
                    width: '1400px',
                    border: '1px solid grey',
                    borderRadius: '2px'
                  }}
                  autoHeight
                  width={1400}
                  isScrolling={isScrolling}
                  onChildScroll={onChildScroll}
                  scrollTop={scrollTop}
                  height={height}
                  headerHeight={40}
                  rowHeight={60}
                  sort={this.sort}
                  sortBy={this.state.sortBy}
                  sortDirection={this.state.sortDirection}
                  rowCount={coins.length}
                  rowStyle={({ index }) => {
                    const previousCoinValue = this.state.previousCoins.find(
                      coin => {
                        if (!coins[index]) return;
                        return coin.short === coins[index].short;
                      }
                    );
                    if (previousCoinValue) {
                      if (previousCoinValue.price === coins[index].price) {
                        return {
                          padding: '0 0 10px',
                          backgroundColor: '#ffffff'
                        };
                      } else {
                        if (previousCoinValue.price < coins[index].price) {
                          return {
                            padding: '0 0 10px',
                            backgroundColor: 'RGBA(69, 198, 188, 0.50)'
                          };
                        } else {
                          return {
                            padding: '0 0 10px',
                            backgroundColor: 'RGBA(255, 95, 96, 0.50)'
                          };
                        }
                      }
                    }
                  }}
                  rowGetter={({ index }) => coins[index]}>
                  <Column width={70} label="Rank" dataKey="rank" />
                  <Column
                    width={200}
                    label="Name"
                    dataKey="name"
                    style={{ textAlign: 'left' }}
                    cellRenderer={({ cellData }) => {
                      return (
                        <span>
                          <span
                            className={`sprite-${cellData
                              .split(' ')
                              .slice(0, cellData.split(' ').length - 1)
                              .join('')
                              .toLowerCase()} sprite small_coin_logo`}
                          />
                          {cellData}
                        </span>
                      );
                    }}
                  />
                  <Column
                    width={180}
                    label="Market Cap"
                    dataKey="mktcap"
                    cellRenderer={formatCurrency}
                  />
                  <Column
                    width={150}
                    label="Price"
                    dataKey="price"
                    cellRenderer={formatCurrency}
                  />
                  <Column
                    width={150}
                    label="24hour VWAP"
                    dataKey="vwapData"
                    cellRenderer={formatCurrency}
                  />
                  <Column
                    width={225}
                    label="Available Supply"
                    dataKey="supply"
                  />
                  <Column width={200} label="24 Hour Volume" dataKey="volume" />
                  <Column width={90} label="%24hr" dataKey="cap24hrChange" />
                </Table>
              )}
            </WindowScroller>
          </Fragment>
        )}
      />
    );
  }
}

const formatCurrency = ({ cellData }) => numeral(cellData).format('$0,0[.]00');
