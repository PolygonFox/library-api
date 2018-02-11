import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import convert from 'koa-convert'
import logger from 'koa-logger'
import mongoose from 'mongoose'
import session from 'koa-generic-session'
import passport from 'koa-passport'
import mount from 'koa-mount'
import serve from 'koa-static'

import config from '../config'
import { errorMiddleware } from '../src/middleware'
import MediaWatcher from '../src/utils/MediaWatcher'

const app = new Koa()
app.keys = [config.session]


mongoose.Promise = global.Promise
mongoose.connect(config.database,  { useMongoClient: true })

app.use(convert(logger()))
app.use(bodyParser())
app.use(session())
app.use(errorMiddleware())

app.use(convert(mount('/docs', serve(`${process.cwd()}/docs`))))
app.use(convert(mount('/m', serve(config.watchFolder))))

require('../config/passport')
app.use(passport.initialize())
app.use(passport.session())

const modules = require('../src/modules')
modules(app)

app.listen(config.port, () => {
  console.log(`Server started on ${config.port}`)
})

new MediaWatcher({
  watchFolder: config.watchFolder
})

export default app
