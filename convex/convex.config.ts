import migrations from '@convex-dev/migrations/convex.config'
import authz from '@djpanda/convex-authz/convex.config'
import tenants from '@djpanda/convex-tenants/convex.config'
import { defineApp } from 'convex/server'

const app = defineApp()
app.use(tenants)
app.use(authz)
app.use(migrations)

export default app
