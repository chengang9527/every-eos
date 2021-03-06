import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { compose } from 'recompose'
import { Table } from 'react-bootstrap'
import { FormattedMessage } from 'react-intl'
import classnames from 'classnames'
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap'
import {
  ORDER_PAGE_LIMIT,
  ORDER_STATUS_ALL_DEALED,
  ORDER_STATUS_CANCELLED,
  ORDER_DETAIL_DEAL_STATUS_CANCELLED
} from '../../constants/Values'

class OrderHistory extends Component {
  constructor(props) {
    super(props)

    this.toggle = this.toggle.bind(this)
    this.state = {
      activeTab: '1'
    }
  }

  componentDidMount = () => {
    const { accountStore, tradeStore } = this.props

    if (accountStore.isLogin) {
      this.getOrderHistory()
    } else {
      this.disposer = accountStore.subscribeLoginState(changed => {
        if (changed.newValue) {
          this.getOrderHistory()
        } else {
          tradeStore.clearOrdersHistory()
        }
      })
    }
  }

  getOrderHistory = async () => {
    const { tradeStore, accountStore } = this.props

    await tradeStore.getOrdersHistory(
      accountStore.loginAccountInfo.account_name,
      ORDER_PAGE_LIMIT,
      JSON.stringify([ORDER_STATUS_ALL_DEALED, ORDER_STATUS_CANCELLED])
    )
  }

  componentWillUnmount = () => {
    if (this.disposer) this.disposer()
  }

  toggle = tab => {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      })
    }
  }

  render() {
    const { tradeStore, accountStore } = this.props
    const { ordersHistoryList } = tradeStore

    return (
      <div>
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: this.state.activeTab === '1' })}
              onClick={() => {
                this.toggle('1')
              }}>
              Order History
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={this.state.activeTab}>
          <TabPane tabId="1">
            <Table>
              <thead>
                <tr>
                  <th>
                    <FormattedMessage id="Date" />
                  </th>
                  <th>
                    <FormattedMessage id="Pair" />
                  </th>
                  <th>
                    <FormattedMessage id="Type" />
                  </th>
                  <th>
                    <FormattedMessage id="Price" />
                  </th>
                  <th>
                    <FormattedMessage id="Average" />
                  </th>
                  <th>
                    <FormattedMessage id="Amount" />
                  </th>
                  <th>
                    <FormattedMessage id="Dealed" />
                  </th>
                  <th>
                    <FormattedMessage id="Total" />
                  </th>
                  <th>
                    <FormattedMessage id="Status" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {accountStore.isLogin &&
                  ordersHistoryList &&
                  ordersHistoryList.map(o => {
                    return (
                      <tr key={o.id}>
                        <td>{o.created}</td>
                        <td>{o.token_id}</td>
                        <td>{o.type}</td>
                        <td>{o.token_price}</td>
                        <td>
                          {o.status === ORDER_STATUS_ALL_DEALED
                            ? o.orderDetails.length === 0
                              ? 0
                              : Math.round(
                                o.orderDetails.reduce(
                                  (acc, curr) => acc + curr.amount * curr.token_price,
                                  0
                                ) / o.orderDetails.reduce((acc, curr) => acc + curr.amount, 0)
                              )
                            : o.status === ORDER_STATUS_CANCELLED
                              ? o.orderDetails.length === 0
                                ? 0
                                : Math.round(
                                  o.orderDetails
                                    .filter(
                                      od => od.deal_status === ORDER_DETAIL_DEAL_STATUS_CANCELLED
                                    )
                                    .reduce(
                                      (acc, curr) => acc + curr.amount * curr.token_price,
                                      0
                                    ) /
                                      o.orderDetails
                                        .filter(
                                          od =>
                                            od.deal_status === ORDER_DETAIL_DEAL_STATUS_CANCELLED
                                        )
                                        .reduce((acc, curr) => acc + curr.amount, 0)
                                )
                              : '-'}
                        </td>
                        <td>{o.total_amount}</td>
                        <td>{o.deal_amount}</td>
                        <td>-</td>
                        {/* {Math.abs(
                      o.token_price.toFixed(token.precision) *
                        o.total_amount.toFixed(token.precision)
                    ).toFixed(token.precision)} */}
                        <td>{o.status}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </Table>
          </TabPane>
        </TabContent>
      </div>
    )
  }
}

export default OrderHistory
