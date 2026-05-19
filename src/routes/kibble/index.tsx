import { createFileRoute } from '@tanstack/react-router'

import { StudentAppShell } from '~/components/shell/student-app-shell'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { appThemes } from '~/lib/themes'

export const Route = createFileRoute('/kibble/')({
  component: KibbleHome,
})

function KibbleHome() {
  return (
    <StudentAppShell
      title="Kibble Capital"
      brand="kibble"
      subtitle={appThemes.kibble.label}
    >
      <Card className="border-ink shadow-brutal border-2">
        <CardHeader>
          <CardTitle className="font-heading">Theme preview</CardTitle>

          <CardDescription>
            Accounting-style student PWA. Semantic tokens and tonal ramps from
            Stitch Kinetic Ledger.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Ledger</Badge>

            <Badge variant="secondary">Payroll</Badge>

            <Badge className="bg-primary-90 text-primary-20">Tonal</Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>

            <Button variant="secondary">Secondary</Button>

            <Button variant="outline">Outline</Button>
          </div>
        </CardContent>
      </Card>
    </StudentAppShell>
  )
}
