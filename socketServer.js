let onlineUsers = []
let onlineAdmins = []
const socketServer = (io) => {
  io.on('connection', (socket) => {
    socket.on('addOnline', ({ userId, role }) => {
      if (role === 'admin') {
        onlineAdmins.findIndex((item) => item.userId === userId) < 0 &&
          onlineAdmins.push({
            userId,
            socketId: socket.id,
          })
      } else {
        onlineUsers.findIndex((item) => item.userId === userId) < 0 &&
          onlineUsers.push({
            userId,
            socketId: socket.id,
          })
      }
      io.emit('getOnline', { onlineAdmins, onlineUsers })
    })
    socket.on('orderAdminNotify', (value) => {
      if (onlineAdmins.length > 0) {
        io.to(onlineAdmins.map((item) => item.socketId)).emit(
          'notifyOrderToAdmin',
          value
        )
      }
    })
    socket.on('orderUserNotify', (res) => {
      const userId = res.notify.user
      const index = onlineUsers.findIndex((item) => item.userId === userId)
      if (index > -1) {
        io.to(onlineUsers[index].socketId).emit('notifyOrderToUser', res)
      }
    })
    socket.on('clientSendMessages', (data) => {
      if (onlineAdmins.length > 0) {
        io.to(onlineAdmins.map((item) => item.socketId)).emit(
          'addMessageToAdmin',
          data
        )
      }
    })
    socket.on('adminSendMessage', (data) => {
      const userId = data.data.user?._id
      const index = onlineUsers.findIndex((item) => item.userId === userId)
      if (index > -1) {
        io.to(onlineUsers[index].socketId).emit('addMessageToClient', data)
      }
    })

    socket.on('disconnect', () => {
      onlineAdmins = onlineAdmins.filter((user) => user.socketId !== socket.id) // ngắt kết nối khi ng dùng off
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
      io.emit('getOnline', { onlineAdmins, onlineUsers })
    })
  })
}

module.exports = socketServer
