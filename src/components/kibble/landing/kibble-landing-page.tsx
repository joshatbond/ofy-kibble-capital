import {
  ArrowRight,
  CalendarOff,
  Clock,
  LayoutDashboard,
  Wallet,
} from 'lucide-react'

import { BrandLogo } from '~/components/brand/brand-logo'
import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { PawketBrutalFrame } from '~/components/pawket/landing/pawket-brutal-frame'
import { cn } from '~/lib/class-name-merge'

export function KibbleLandingPage() {
  return (
    <div className="bg-background text-foreground min-h-dvh min-w-0">
      <LandingHeader />

      <main className="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-0 px-4 pt-18 pb-0 md:px-12 md:pt-28">
        <LandingHero />

        <LandingFeatures />

        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  )
}

function LandingHeader() {
  return (
    <header className="bg-background border-ink shadow-brutal fixed top-0 z-50 w-full border-b-2">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 md:px-12">
        <BrandLogo brand="kibble" className="h-10 md:h-11" />

        <div className="group flex items-center gap-2">
          <PawketBrutalButton className="bg-primary text-primary-foreground inline-flex items-center gap-2">
            Sign In
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </PawketBrutalButton>
        </div>
      </div>
    </header>
  )
}

function LandingHero() {
  return (
    <section
      id="top"
      className="border-ink relative flex min-h-[70vh] flex-col items-center justify-center border-b-2 py-12 text-center md:min-h-[80vh] md:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--secondary-70)_1px,transparent_1px)] bg-size-[24px_24px]"
        aria-hidden
      />

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
        <h1 className="font-heading text-foreground text-4xl leading-[1.1] font-extrabold tracking-tight uppercase md:text-6xl">
          <span className="block">Your Professional</span>

          <span className="text-primary block">Earnings</span>

          <span className="block">Start Here.</span>
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
          The financial headquarters for students. Track time, manage paychecks,
          and level up your school career with Kibble Capital&apos;s pro-grade
          ledger.
        </p>

        <div className="flex w-full max-w-md flex-col gap-3 md:flex-row md:justify-center">
          <PawketBrutalButton className="bg-primary text-primary-foreground inline-flex items-center justify-center gap-2">
            Sign In with School ID
            <ArrowRight className="size-4" aria-hidden />
          </PawketBrutalButton>

          <PawketBrutalButton variant="outline" className="bg-card">
            Learn More
          </PawketBrutalButton>
        </div>
      </div>
    </section>
  )
}

function LandingFeatures() {
  return (
    <section
      id="features"
      className="border-ink bg-card border-y-2 px-0 py-16 md:py-20"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-0 md:px-0">
        <h2 className="font-heading text-center text-3xl font-extrabold md:text-4xl">
          Toolbox for <span className="text-primary">Success</span>
        </h2>

        <div className="grid grid-cols-1 gap-6 md:auto-rows-min md:grid-cols-12">
          <FeatureCard
            className="bg-card justify-between md:col-span-8"
            icon={<Clock className="text-primary size-12" aria-hidden />}
            title="Precision Timekeeping"
            description="Clock in and out with enterprise-grade accuracy. Log every minute of your school-based work assignments with ease."
            footer={<TimekeepingChart />}
          />

          <FeatureCard
            className="bg-primary text-primary-foreground items-center text-center md:col-span-4"
            icon={<Wallet className="size-14" aria-hidden />}
            title="Transparent Pay"
            description="See exactly how your Kibble adds up. Detailed pay stubs and history at your fingertips."
            titleClassName="text-xl"
            descriptionClassName="text-primary-foreground"
            actionLabel="View pay stub"
            actionClassName="bg-card text-foreground border-ink mt-8 border-2 px-6 py-2 font-heading text-sm font-bold tracking-wide uppercase"
          />

          <FeatureCard
            className="bg-ink text-white md:col-span-4"
            icon={<CalendarOff className="size-10" aria-hidden />}
            title="Absence Manager"
            description="Request leave or report absences directly through the portal."
            descriptionClassName="text-white/80"
          />

          <PawketBrutalFrame
            large
            className="bg-muted flex flex-col gap-4 p-8 md:col-span-8 md:flex-row md:items-center"
          >
            <LayoutDashboard
              className="text-accent size-12 shrink-0"
              aria-hidden
            />

            <div className="space-y-2 text-left">
              <h3 className="font-heading text-2xl font-bold">
                Unified Dashboard
              </h3>

              <p className="text-muted-foreground text-base leading-relaxed">
                One screen to rule them all. Your goals, your progress, and your
                earnings.
              </p>
            </div>
          </PawketBrutalFrame>
        </div>
      </div>
    </section>
  )
}

type FeatureCardProps = {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  actionLabel?: string
  actionClassName?: string
  footer?: React.ReactNode
}

function FeatureCard(props: FeatureCardProps) {
  return (
    <PawketBrutalFrame
      large
      className={cn('flex flex-col gap-4 p-8', props.className)}
    >
      {props.icon}

      <div className="flex flex-1 flex-col gap-2">
        <h3
          className={cn(
            'font-heading text-2xl font-bold',
            props.titleClassName
          )}
        >
          {props.title}
        </h3>

        <p
          className={cn(
            'text-muted-foreground flex-1 text-base leading-relaxed',
            props.descriptionClassName
          )}
        >
          {props.description}
        </p>
      </div>

      {props.actionLabel ? (
        <span className={props.actionClassName}>{props.actionLabel}</span>
      ) : null}

      {props.footer}
    </PawketBrutalFrame>
  )
}

function TimekeepingChart() {
  return (
    <div className="mt-4 flex items-end gap-4 overflow-hidden">
      <div className="border-ink bg-ink h-24 w-12 border-2 sm:w-16" />

      <div className="bg-primary border-ink h-40 w-12 border-2 sm:w-16" />

      <div className="border-ink bg-ink h-32 w-12 border-2 sm:w-16" />

      <div className="bg-primary border-ink h-28 w-12 border-2 sm:w-16" />

      <div className="border-ink bg-ink h-36 w-12 border-2 sm:w-16" />
    </div>
  )
}

function LandingCta() {
  return (
    <section
      id="resources"
      className="flex flex-col items-center gap-8 px-4 py-20 text-center md:px-0"
    >
      <h2 className="font-heading text-3xl leading-tight font-extrabold md:text-5xl">
        Ready to claim your&nbsp;
        <span className="text-primary block md:inline">Financial Future</span>
      </h2>

      <PawketBrutalButton large className="bg-primary text-primary-foreground">
        Get Started Now
      </PawketBrutalButton>

      <div className="flex flex-wrap justify-center gap-3">
        <TrustBadge label="School Partners" />

        <TrustBadge label="Ed-Tech Certified" />

        <TrustBadge label="Secure Ledger" />
      </div>
    </section>
  )
}

function TrustBadge(props: { label: string }) {
  return (
    <span className="border-ink bg-card text-foreground rounded-full border-2 px-4 py-1.5 text-xs font-bold tracking-wider uppercase shadow-[2px_2px_0_0_var(--ink)]">
      {props.label}
    </span>
  )
}

function LandingFooter() {
  return (
    <footer className="border-ink bg-ink text-background border-t-4 py-12">
      <div className="mx-auto max-w-[1200px] px-4 md:px-12">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <BrandLogo brand="kibble" className="h-10 brightness-0 invert" />

            <p className="text-primary-80 text-sm leading-relaxed">
              Professional earnings tools for students in school-based work
              programs.
            </p>
          </div>

          <FooterLinkGroup
            title="System"
            links={[
              { label: 'Privacy Policy', href: '#' },
              { label: 'Security Standards', href: '#' },
              { label: 'Accessibility', href: '#' },
              { label: 'API Docs', href: '#' },
            ]}
          />

          <FooterLinkGroup
            title="Support"
            links={[
              { label: 'Help Center', href: '#' },
              { label: 'For Teachers', href: '#' },
              { label: 'For Students', href: '#' },
              { label: 'Contact Us', href: '#' },
            ]}
          />
        </div>

        <div className="border-background/30 mt-12 border-t-2 pt-6 text-center">
          <p className="text-primary-80 text-xs">
            © 2024 Kibble Capital. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLinkGroup(props: {
  title: string
  links: Array<{ label: string; href: string }>
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-primary-90 text-sm font-semibold tracking-tighter uppercase">
        {props.title}
      </span>

      {props.links.map(link => (
        <a
          key={link.label}
          href={link.href}
          className="hover:text-accent text-sm transition-colors"
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}
