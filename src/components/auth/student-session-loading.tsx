import { KibbleLoadingScreen } from '~/components/loading/kibble-loader'
import { PawketLoadingScreen } from '~/components/loading/pawket-loader'
import type { StudentApp } from '~/lib/auth-redirect'

export function StudentSessionLoading(props: StudentSessionLoadingProps) {
  if (props.app === 'kibble') {
    return (
      <KibbleLoadingScreen
        label={props.label}
        isReady={props.isReady}
        onComplete={props.onComplete}
      />
    )
  }

  return (
    <PawketLoadingScreen
      label={props.label}
      isReady={props.isReady}
      onComplete={props.onComplete}
    />
  )
}
type StudentSessionLoadingProps = {
  app: StudentApp
  label: string
  isReady?: boolean
  onComplete?: () => void
}
