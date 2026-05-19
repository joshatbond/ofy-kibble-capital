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

export const Route = createFileRoute('/pawket/')({
  component: PawketHome,
})

function PawketHome() {
  return (
    <StudentAppShell title="PawKet Exchange" subtitle={appThemes.pawket.label}>
      <Card className="border-ink shadow-brutal rounded-xl border-2">
        <CardHeader>
          <CardTitle className="font-heading">Theme preview</CardTitle>

          <CardDescription>
            Banking-style student PWA. Semantic tokens and tonal ramps from
            Stitch Vibrant Scholar.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Savings</Badge>

            <Badge variant="secondary">Vault</Badge>

            <Badge className="bg-accent text-accent-foreground">Rewards</Badge>
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
