require('dotenv').config()

const REQUIRED_ENV = ['ANTHROPIC_API_KEY', 'SWEETBOOK_API_KEY']
const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`[startup] 필수 환경변수가 누락되었습니다: ${missing.join(', ')}`)
  process.exit(1)
}

const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const cors = require('cors')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const storyRouter = require('./routes/story')
const booksRouter = require('./routes/books')
const templatesRouter = require('./routes/templates')
const ordersRouter = require('./routes/orders')
const creditsRouter = require('./routes/credits')

const app = express()

app.use(helmet())
app.use(morgan('dev'))
app.use(cors({ origin: process.env.ALLOWED_ORIGIN }))
app.use(express.json({ limit: '1mb' }))

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GrowBook API',
      version: '1.0.0',
      description: 'GrowBook 백엔드 API (Sandbox 환경)',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}`, description: 'Sandbox 서버' }],
  },
  apis: ['./src/routes/*.js'],
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/story', storyRouter)
app.use('/api/books', booksRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/credits', creditsRouter)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({
    success: false,
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || '서버 오류가 발생했습니다.',
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT} 에서 실행 중`)
  console.log(`[docs]   http://localhost:${PORT}/api-docs`)
})
