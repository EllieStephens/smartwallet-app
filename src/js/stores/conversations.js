import Reflux from 'reflux'
import _ from 'lodash'
import settings from 'settings'
import ChatAgent from 'lib/agents/chat.js'

import ConversationsActions from 'actions/conversations'

let {load} = ConversationsActions

let chatAgent = new ChatAgent()

export default Reflux.createStore({
  listenables: ConversationsActions,

  getInitialState() {
    return {
      loading: true,
      conversations: []
    }
  },

  onLoad(username, query) {
    let regEx = query && query !== '' && new RegExp(`.*${query}.*`, 'i')

    return chatAgent.getInboxConversations(`${settings.endpoint}/${username}/profile/card#me`)
      .then(function(conversations) {
        // @TODO load author, first message
        load.completed(_.chain(conversations).map((conversation) => {
          let id = conversation.replace(/^.*\/chats\/([a-z]+)$/, '$1')
          return {
            id: id,
            url: conversation,
            username: '',
            items: [{
              author: {
                name: id
              },
              date: new Date(),
              content: conversation
            }]
          }
        }).filter((conversation) => {
          return !regEx || conversation.id.match(regEx)
        }).value())
      })
  },

  onLoadCompleted(conversations) {
    this.trigger({
      loading: false,
      conversations: conversations
    })
  }

})
