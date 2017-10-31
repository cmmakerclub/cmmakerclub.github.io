/**
 * Copyright 2013 dc-square GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author: Christoph Schäbel
 */

var websocketclient = {
  'client': null,
  'lastMessageId': 1,
  'lastSubId': 1,
  'subscriptions': [],
  'messages': [],
  'connected': false,

  'connect': function () {
    // var host = $('#urlInput').val();
    // var port = parseInt($('#portInput').val(), 10);
    // var clientId = $('#clientIdInput').val();

    // var username = $('#userInput').val();
    // var password = $('#pwInput').val();
    // var keepAlive = parseInt($('#keepAliveInput').val());
    // var cleanSession = $('#cleanSessionInput').is(':checked');
    // var lwTopic = $('#lwTopicInput').val();
    // var lwQos = parseInt($('#lwQosInput').val());
    // var lwRetain = $('#LWRInput').is(':checked');
    // var lwMessage = $('#LWMInput').val();
    var ssl = $('#sslInput').is(':checked')

    var appId = $('#appIdInput').val()
    var appKey = $('#appKeyInput').val()
    var appSecret = $('#appSecretInput').val()
    var gearAlias = $('#gearAlias').val()

    // this.client = new Messaging.Client(host, port, clientId);
    this.client = new Microgear.create({
      key: appKey,
      secret: appSecret,
      alias: gearAlias || 'nat_html5'
    })

    window.microgear = this.client

    this.client.on('connected', this.onConnect)
    this.client.on('message', this.onMessageArrived)
    this.client.on('error', this.onFail)
    this.client.on('closed', this.onConnectionLost)

    // this.client.onConnectionLost = this.onConnectionLost;
    // this.client.onMessageArrived = this.onMessageArrived;

    // var options = {
    //     timeout: 3,
    //     keepAliveInterval: keepAlive,
    //     cleanSession: cleanSession,
    //     useSSL: ssl,
    //     onSuccess: this.onConnect,
    //     onFailure: this.onFail
    // };

    this.client.connect(appId)
  },

  'onConnect': function () {
    websocketclient.connected = true
    // console.log("connected");
    var body = $('body').addClass('connected').removeClass('notconnected').removeClass('connectionbroke')

    localStorage.setItem('appId', $('#appIdInput').val())
    localStorage.setItem('appKey', $('#appKeyInput').val())
    localStorage.setItem('appSecret', $('#appSecretInput').val())

    websocketclient.render.hide('conni')
    websocketclient.render.show('publish')
    websocketclient.render.show('sub')
    websocketclient.render.show('messages')
  },

  'onFail': function (message) {
    console.log('ON FAILED')
    websocketclient.connected = false
    console.log('error: ' + message.errorMessage)
    websocketclient.render.showError('Connect failed: ' + message.errorMessage)
  },

  'onConnectionLost': function (responseObject) {
    console.log('onConnectionLost')
    websocketclient.connected = false
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage)
    }
    $('body.connected').removeClass('connected').addClass('notconnected').addClass('connectionbroke')
    websocketclient.render.show('conni')
    websocketclient.render.hide('publish')
    websocketclient.render.hide('sub')
    websocketclient.render.hide('messages')

    //Cleanup messages
    websocketclient.messages = []
    websocketclient.render.clearMessages()

    //Cleanup subscriptions
    websocketclient.subscriptions = []
    websocketclient.render.clearSubscriptions()
  },

  'onMessageArrived': function (topic, message) {
    var subscription = websocketclient.getSubscriptionForTopic(topic)

    var messageObj = {
      'topic': topic,
      'payload': message,
      'timestamp': moment(),
      'subscriptionId': subscription.id,
      'color': websocketclient.getColorForSubscription(subscription.id)
    }

    messageObj.id = websocketclient.render.message(messageObj)
    websocketclient.messages.push(messageObj)
    // console.log(messageObj);
  },

  'disconnect': function () {
    var conf = confirm('Not implement yet. Reload the browser?')
    if (conf) {
      window.location.reload()
    }
    // this.client.disconnect();
  },

  'publish': function (topic, payload, qos, retain) {
    if (!websocketclient.connected) {
      websocketclient.render.showError('Not connected')
      return false
    }
    this.client.publish(topic, payload, retain)
    // var message = new Messaging.Message(payload);
    // message.destinationName = topic;
    // message.qos = qos;
    // message.retained = retain;
    // this.client.send(message);
  },

  'subscribe': function (topic, qosNr, color) {
    if (!websocketclient.connected) {
      websocketclient.render.showError('Not connected')
      return false
    }

    if (topic.length < 1) {
      websocketclient.render.showError('Topic cannot be empty')
      return false
    }

    if (_.find(this.subscriptions, {'topic': topic})) {
      websocketclient.render.showError('You are already subscribed to this topic')
      return false
    }

    this.client.subscribe(topic, {qos: qosNr})
    if (color.length < 1) {
      color = '999999'
    }

    var subscription = {'topic': topic, 'qos': qosNr, 'color': color}
    subscription.id = websocketclient.render.subscription(subscription)
    this.subscriptions.push(subscription)

    return true

  },

  'unsubscribe': function (id) {
    var subs = _.find(websocketclient.subscriptions, {'id': id})
    this.client.unsubscribe(subs.topic)
    websocketclient.subscriptions = _.filter(websocketclient.subscriptions, function (item) {
      return item.id != id
    })

    websocketclient.render.removeSubscriptionsMessages(id)
  },

  'deleteSubscription': function (id) {
    var elem = $('#sub' + id)

    if (confirm('Wirklich löschen ?')) {
      elem.remove()
      this.unsubscribe(id)
    }
  },

  'getRandomColor': function () {
    var r = (Math.round(Math.random() * 255)).toString(16)
    var g = (Math.round(Math.random() * 255)).toString(16)
    var b = (Math.round(Math.random() * 255)).toString(16)
    return r + g + b
  },

  'getSubscriptionForTopic': function (topic) {
    var i
    for (i = 0; i < this.subscriptions.length; i++) {
      if (this.compareTopics(topic, this.subscriptions[i].topic)) {
        return this.subscriptions[i]
      }
    }
    return false
  },

  'getColorForPublishTopic': function (topic) {
    var id = this.getSubscriptionForTopic(topic)
    return this.getColorForSubscription(id)
  },

  'getColorForSubscription': function (id) {
    try {
      if (!id) {
        return '99999'
      }

      var sub = _.find(this.subscriptions, {'id': id})
      if (!sub) {
        return '999999'
      } else {
        return sub.color
      }
    } catch (e) {
      return '999999'
    }
  },

  'compareTopics': function (topic, subTopic) {
    var pattern = subTopic.replace('+', '(.+?)').replace('#', '(.*)')
    var regex = new RegExp('^' + pattern + '$')
    return regex.test(topic)
  },

  'render': {

    'showError': function (message) {
      alert(message)
    },
    'messages': function () {

      websocketclient.render.clearMessages()
      _.forEach(websocketclient.messages, function (message) {
        message.id = websocketclient.render.message(message)
      })

    },
    'message': function (message) {

      var largest = websocketclient.lastMessageId++
      // var _topic = '/' + message.topic.split('/').slice(2).join('/')

      var html = '<li class="messLine id="' + largest + '">' +
        '   <div class="row large-12 mess' + largest + '" style="border-left: solid 10px #' + message.color + '; ">' +
        '       <div class="large-12 columns messageText">' +
        '           <div class="large-3 columns date">' + message.timestamp.format('YYYY-MM-DD HH:mm:ss') + '</div>' +
        '           <div class="large-5 columns topicM" id="topicM' + largest + '" title="' + Encoder.htmlEncode(message.topic, 0) + '">' + Encoder.htmlEncode(message.topic) + '</div>' +
        '           <div class="large-2 columns retain">'
      if (message.retained) {
        html += 'Retained'
      }
      html += '           </div>' +
        '           <div class="large-12 columns message break-words">' + Encoder.htmlEncode(message.payload) + '</div>' +
        '       </div>' +
        '   </div>' +
        '</li>'
      $('#messEdit').prepend(html)
      return largest
    },

    'subscriptions': function () {
      websocketclient.render.clearSubscriptions()
      _.forEach(websocketclient.subscriptions, function (subs) {
        subs.id = websocketclient.render.subscription(subs)
      })
    },

    'subscription': function (subscription) {
      var largest = websocketclient.lastSubId++
      $('#innerEdit').append(
        '<li class="subLine" id="sub' + largest + '">' +
        '   <div class="row large-12 subs' + largest + '" style="border-left: solid 10px #' + subscription.color + '; background-color: #ffffff">' +
        '       <div class="large-12 columns subText">' +
        '           <div class="large-1 columns right closer">' +
        '              <a href="#" onclick="websocketclient.deleteSubscription(' + largest + '); return false;">x</a>' +
        '           </div>' +
        '           <div class="qos">Qos: ' + subscription.qos + '</div>' +
        '           <div class="topic truncate" id="topic' + largest + '" title="' + Encoder.htmlEncode(subscription.topic, 0) + '">' + Encoder.htmlEncode(subscription.topic) + '</div>' +
        '       </div>' +
        '   </div>' +
        '</li>')
      return largest
    },

    'toggleAll': function () {
      websocketclient.render.toggle('conni')
      websocketclient.render.toggle('publish')
      websocketclient.render.toggle('messages')
      websocketclient.render.toggle('sub')
    },

    'toggle': function (name) {
      $('.' + name + 'Arrow').toggleClass('closed')
      $('.' + name + 'Top').toggleClass('closed')
      var elem = $('#' + name + 'Main')
      elem.slideToggle()
    },

    'hide': function (name) {
      $('.' + name + 'Arrow').addClass('closed')
      $('.' + name + 'Top').addClass('closed')
      var elem = $('#' + name + 'Main')
      elem.slideUp()
    },

    'show': function (name) {
      $('.' + name + 'Arrow').removeClass('closed')
      $('.' + name + 'Top').removeClass('closed')
      var elem = $('#' + name + 'Main')
      elem.slideDown()
    },

    'removeSubscriptionsMessages': function (id) {
      websocketclient.messages = _.filter(websocketclient.messages, function (item) {
        return item.subscriptionId !== id
      })
      websocketclient.render.messages()
    },

    'clearMessages': function () {
      $('#messEdit').empty()
    },

    'clearSubscriptions': function () {
      $('#innerEdit').empty()
    }
  }
}
