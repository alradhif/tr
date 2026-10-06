const { portalUserHandlers } = require('../lib/portalUsers')

const users = portalUserHandlers('JODAYN')

exports.createJodaynPortalUser = users.create
exports.getJodaynUsers = users.list
exports.toggleJodaynUser = users.toggle
exports.resetJodaynUserCredentials = users.resetCredentials
exports.reissueJodaynInvite = users.resetCredentials

