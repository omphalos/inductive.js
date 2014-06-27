function Clock() { this.reset() }

Clock.prototype.reset = function() {
  this.value = 0
  this.idCounter = 0
  this.events = {}
}

Clock.prototype.get = function() { return new Date(+this.value) }

Clock.prototype.set = function(val) {
  if(!(val instanceof Date)) throw new Error('val must be a date')
  if(+val < this.value) throw new Error('Cannot move back in time.')
  this.value = +val
}

Clock.prototype.add = function(amount) {
  if(amount < 0) throw new Error('Cannot move back in time')
  this.value -= amount
}

Clock.prototype.setTimeout = function(fn, delay, cookie) {
  cookie = cookie || ++this.idCounter
  this.events[cookie] = { fn: fn, time: this.value + (delay || 0) }
  return cookie
}

Clock.prototype.processEvents = function() {
  var self = this
  Object.keys(self.events).forEach(function(key) {
    var evt = self.events[key]
    if(evt.time > self.value) return
    delete self.events[key]
    evt.fn()
  })
}

Clock.prototype.setInterval = function(fn, interval) {
  var self = this
    , cookie = ++this.idCounter
  function tick() {
    fn()
    self.setTimeout(tick, interval, cookie)
  }
  self.setTimeout(tick, interval, cookie)
  return cookie
}

Clock.prototype.clear = function(cookie) {
  delete this.events[cookie]
}

module.exports = new Clock()
