import { decorate, observable, set, toJS, computed, action } from 'mobx'
import graphql from 'mobx-apollo'
import ApiServerAgent from '../ApiServerAgent'
import { orderQuery, ordersQuery } from '../graphql/query/order'
import { cancelOrderMutation } from '../graphql/mutation/order'
import {
  ORDER_PAGE_LIMIT,
  ORDER_TYPE_BUY,
  ORDER_TYPE_SELL,
  ORDER_STATUS_NOT_DEAL,
  ORDER_STATUS_PARTIAL_DEALED,
  ORDER_STATUS_ALL_DEALED,
  ORDER_STATUS_CANCELLED
} from '../constants/Values'

class TradeStore {
  tokenSymbol = ''
  price = 0.0
  amount = 0.0
  chartData = []
  buyOrders = {
    data: {
      orders: []
    },
    loading: false,
    error: null
  }

  sellOrders = {
    data: {
      orders: []
    },
    loading: false,
    error: null
  }

  ordersHistory = {
    data: {
      orders: []
    },
    loading: false,
    error: null
  }

  openOrders = {
    data: {
      orders: []
    },
    loading: false,
    error: null
  }

  constructor() {
    const initialTokenId = 1

    set(this, {
      get buyOrders() {
        return graphql({
          client: ApiServerAgent,
          query: ordersQuery,
          variables: {
            token_id: initialTokenId,
            type: ORDER_TYPE_BUY,
            limit: ORDER_PAGE_LIMIT,
            status: '["NOT_DEAL", "PARTIAL_DEALED"]'
          }
        })
      }
    })

    set(this, {
      get sellOrders() {
        return graphql({
          client: ApiServerAgent,
          query: ordersQuery,
          variables: {
            token_id: initialTokenId,
            type: ORDER_TYPE_SELL,
            limit: ORDER_PAGE_LIMIT,
            status: '["NOT_DEAL", "PARTIAL_DEALED"]'
          }
        })
      }
    })

    set(this, {
      get ordersHistory() {
        return graphql({
          client: ApiServerAgent,
          query: ordersQuery,
          variables: { limit: ORDER_PAGE_LIMIT, account_name: '' }
        })
      }
    })

    set(this, {
      get openOrders() {
        return graphql({
          client: ApiServerAgent,
          query: ordersQuery,
          variables: {
            limit: ORDER_PAGE_LIMIT,
            account_name: '',
            status: '["NOT_DEAL", "PARTIAL_DEALED"]'
          }
        })
      }
    })

    this.chartData = observable.box([])
    this.price = observable.box(0.0)
  }

  setTokenSymbol = symbol => {
    this.tokenSymbol = symbol
  }

  setPrice = price => {
    this.price.set(price)
  }

  setWatchPrice = observer => {
    this.price.observe(observer)
  }

  setAmount = amount => {
    this.amount = amount
  }

  setChartData = async chartData => {
    this.chartData.set(chartData)
  }
  setWatchChartData = observer => {
    this.chartData.observe(observer)
  }

  getBuyOrders = async (token_id, limit, status) => {
    this.buyOrders = await graphql({
      client: ApiServerAgent,
      query: ordersQuery,
      variables: { token_id: token_id, type: ORDER_TYPE_BUY, limit: limit, status: status }
    })
  }

  get buyOrdersError() {
    return (this.buyOrders.error && this.buyOrders.error.message) || null
  }

  get buyOrdersLoading() {
    return this.buyOrders.loading
  }

  get buyOrdersList() {
    return (this.buyOrders.data && toJS(this.buyOrders.data.orders)) || []
  }

  get buyOrdersCount() {
    return this.buyOrders.data.orders ? this.buyOrders.data.orders.length : 0
  }

  getSellOrders = async (token_id, limit, status) => {
    this.sellOrders = await graphql({
      client: ApiServerAgent,
      query: ordersQuery,
      variables: { token_id: token_id, type: ORDER_TYPE_SELL, limit: limit, status: status }
    })
  }

  get sellOrdersError() {
    return (this.sellOrders.error && this.sellOrders.error.message) || null
  }

  get sellOrdersLoading() {
    return this.sellOrders.loading
  }

  get sellOrdersList() {
    return (this.sellOrders.data && toJS(this.sellOrders.data.orders)) || []
  }

  get sellOrdersCount() {
    return this.sellOrders.data.orders ? this.sellOrders.data.orders.length : 0
  }

  getOrdersHistory = async (account_name, limit, status) => {
    this.ordersHistory = await graphql({
      client: ApiServerAgent,
      query: ordersQuery,
      variables: {
        account_name: account_name,
        limit: limit,
        status: status
      }
    })
  }

  clearOrdersHistory = () => {
    this.ordersHistory.data.orders = []
  }

  get ordersHistoryError() {
    return (this.ordersHistory.error && this.ordersHistory.error.message) || null
  }

  get ordersHistoryLoading() {
    return this.ordersHistory.loading
  }

  get ordersHistoryList() {
    return (this.ordersHistory.data && toJS(this.ordersHistory.data.orders)) || []
  }

  get ordersHistoryCount() {
    return this.ordersHistory.data.orders ? this.ordersHistory.data.orders.length : 0
  }

  getOpenOrders = async (account_name, limit, status) => {
    this.openOrders = await graphql({
      client: ApiServerAgent,
      query: ordersQuery,
      variables: {
        account_name: account_name,
        limit: limit,
        status: status
      }
    })
  }

  clearOpenOrders = () => {
    this.openOrders.data.orders = []
  }

  get openOrdersError() {
    return (this.openOrders.error && this.openOrders.error.message) || null
  }

  get openOrdersLoading() {
    return this.openOrders.loading
  }

  get openOrdersList() {
    return (this.openOrders.data && toJS(this.openOrders.data.orders)) || []
  }

  get openOrdersCount() {
    return this.openOrders.data.orders ? this.openOrders.data.orders.length : 0
  }

  cancelOrder = async (account_name, signature, order_id) => {
    try {
      return await ApiServerAgent.mutate({
        mutation: cancelOrderMutation,
        variables: { account_name: account_name, signature: signature, order_id: order_id }
      })
    } catch (err) {
      console.error(err.message)
      return false
    }
  }

  getOpenOrderByTxId = txid => {
    const pollingId = setInterval(async () => {
      const order = await graphql({
        client: ApiServerAgent,
        query: orderQuery,
        variables: {
          transaction_id: txid
        }
      })

      if (order) {
        console.log('order by txid arrived, finish polling')
        console.log(order)
        clearInterval(pollingId)

        // const parsedOrders = toJS(orders.data.orders)
        // this.openOrders.data.orders.push(parsedOrders[0])
      }
    }, 1000)
  }

  test = () => {
    this.price += 0.1
  }
}

decorate(TradeStore, {
  buyOrders: observable,
  buyOrdersError: computed,
  buyOrdersLoading: computed,
  buyOrdersList: computed,
  buyOrdersCount: computed,
  sellOrders: observable,
  sellOrdersError: computed,
  sellOrdersLoading: computed,
  sellOrdersList: computed,
  sellOrdersCount: computed,
  ordersHistory: observable,
  ordersHistoryError: computed,
  ordersHistoryLoading: computed,
  ordersHistoryList: computed,
  ordersHistoryCount: computed,
  openOrders: observable,
  openOrdersError: computed,
  openOrdersLoading: computed,
  openOrdersList: computed,
  openOrdersCount: computed,
  tokenSymbol: observable,
  price: observable,
  amount: observable,
  chartData: observable,
  setTokenSymbol: action,
  setPrice: action,
  setAmount: action,
  setWatchPrice: action,
  getBuyOrders: action,
  getSellOrders: action,
  getOrdersHistory: action,
  getOpenOrders: action,
  getOpenOrderByTxId: action,
  clearOrdersHistory: action,
  clearOpenOrders: action,
  setChartData: action,
  setWatchChartData: action,
  test: action
})

export default new TradeStore()
