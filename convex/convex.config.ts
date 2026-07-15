import authz from '@djpanda/convex-authz/convex.config'
import tenants from '@djpanda/convex-tenants/convex.config'
import { defineApp } from 'convex/server'

const app = defineApp()
app.use(tenants)
app.use(authz)

export default app
