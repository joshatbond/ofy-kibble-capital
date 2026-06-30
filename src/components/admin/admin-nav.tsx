import { Link } from '@tanstack/react-router'

import { SignOutButton } from '~/components/auth/sign-out-button'
import { Case, SwitchOn } from '~/components/switch-on'
import { adminAppHomePath, adminAppLandingPath } from '~/lib/auth-redirect'

export function AdminNav(props: {
  organizationId: string
  classroomId: string
  current?: 'dashboard' | 'classroom' | 'settings' | 'store' | 'pos'
}) {
  const orgParams = { orgId: props.organizationId }
  const classParams = {
    orgId: props.organizationId,
    classId: props.classroomId,
  }

  return (
    <nav>
      <ul>
        <li>
          <SwitchOn>
            <Case predicate={props.current === 'dashboard'}>
              <span>Dashboard</span>
            </Case>

            <Case>
              <Link to={adminAppHomePath()}>Dashboard</Link>
            </Case>
          </SwitchOn>
        </li>

        <li>
          <SwitchOn>
            <Case predicate={props.current === 'classroom'}>
              <span>Classroom</span>
            </Case>

            <Case>
              <Link to="/admin/$orgId/$classId" params={classParams}>
                Classroom
              </Link>
            </Case>
          </SwitchOn>
        </li>

        <li>
          <SwitchOn>
            <Case predicate={props.current === 'settings'}>
              <span>Settings</span>
            </Case>

            <Case>
              <Link to="/admin/$orgId" params={orgParams}>
                Settings
              </Link>
            </Case>
          </SwitchOn>
        </li>

        <li>
          <SwitchOn>
            <Case predicate={props.current === 'store'}>
              <span>Student store</span>
            </Case>

            <Case>
              <Link to="/admin/$orgId/$classId/store" params={classParams}>
                Student store
              </Link>
            </Case>
          </SwitchOn>
        </li>

        <li>
          <SwitchOn>
            <Case predicate={props.current === 'pos'}>
              <span>POS</span>
            </Case>

            <Case>
              <Link to="/admin/$orgId/$classId/pos" params={classParams}>
                POS
              </Link>
            </Case>
          </SwitchOn>
        </li>

        <li>
          <SignOutButton landingTo={adminAppLandingPath()} />
        </li>
      </ul>
    </nav>
  )
}
