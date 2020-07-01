const { createConnection, useContainer } = require('typeorm')
const { Container } = require('typedi');

let connection

;(async () => {
  useContainer(Container)
  console.log('Setting up DB')
  await createConnection()
})()


